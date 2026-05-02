// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GraduationEligibility
 * @notice Graduation eligibility using REAL Algerian LMD rules.
 * @dev Optimized with blocks and storage pointers for absolute stack safety.
 */
contract GraduationEligibility {

    // ... [Constants, Structs, and State remain the same as your version] ...
    
    uint16 private constant PASS_SCALED = 1000; // 10.00 * 100

    struct LevelRequirements {
        uint8   totalSemesters;
        uint16  totalCredits;
        bool    requiresThesis;
    }

    struct ModuleResult {
        string  moduleCode;
        string  moduleName;
        uint8   coefficient;       
        uint16  gradeS1;          
        uint16  gradeRattrapage;   
        uint16  finalGrade;        
        uint8   credits;           
        string  semester;          
        bool    validated;
    }

    struct ModuleInput {
        string  moduleCode;
        string  moduleName;
        uint8   coefficient;
        uint16  gradeS1;
        uint16  gradeRattrapage;
        uint8   credits;
        string  semester;
    }

    struct SemesterResult {
        string  semesterCode;
        uint16  moyennePonderee;    
        uint16  totalCoefficients;
        uint8   totalCredits;
        bool    validated;          
        bool    exists;
    }

    struct StudentRecord {
        address wallet;
        string  matricule;
        string  level;
        string  specialty;
        string  academicYear;
        bool    thesisDefended;
        bool    pendingAppeal;
        bool    exists;
    }

    struct EligibilityResult {
        bool    eligible;
        string  reason;
        uint16  moyenneGenerale;     
        uint8   validatedSemesters;
        uint16  totalCredits;
        uint256 totalModules;
        string  mention;
    }

    struct StudentStats {
        uint256 moduleCount;
        uint256 semesterCount;
    }

    mapping(string  => LevelRequirements) public requirements;
    mapping(address => StudentRecord) private records;
    mapping(address => ModuleResult[]) private studentModules;
    mapping(address => mapping(string => SemesterResult)) private semesterResults;
    mapping(address => string[]) private studentSemesters;
    mapping(address => bool) public authorizedContracts;

    address public admin;

    event EligibilityChecked(address indexed student, string level, bool eligible, string reason, uint16 moyenneGenerale);
    event ModuleRecorded(address indexed student, string moduleCode, uint16 finalGrade, uint8 coefficient);
    event SemesterComputed(address indexed student, string semesterCode, uint16 moyennePonderee, bool validated);
    event ThesisDefended(address indexed student, uint256 timestamp);

    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender] || msg.sender == admin, "Not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
        authorizedContracts[msg.sender] = true;
        _initRequirements();
    }

    function _initRequirements() internal {
        requirements["L3"] = LevelRequirements(6, 180, false);
        requirements["M2"] = LevelRequirements(4, 120, true);
        requirements["D3"] = LevelRequirements(6, 180, true);
    }

    function addAuthorizedContract(address c) external {
        require(msg.sender == admin, "Admin only");
        authorizedContracts[c] = true;
    }

    function registerStudent(
        address wallet,
        string calldata matricule,
        string calldata level,
        string calldata specialty,
        string calldata academicYear
    ) external onlyAuthorized {
        require(!records[wallet].exists, "Already registered");
        records[wallet] = StudentRecord({
            wallet:         wallet,
            matricule:      matricule,
            level:          level,
            specialty:      specialty,
            academicYear:   academicYear,
            thesisDefended: false,
            pendingAppeal:  false,
            exists:         true
        });
    }

    function recordModuleResult(
        address studentWallet,
        ModuleInput calldata input
    ) external onlyAuthorized {
        require(records[studentWallet].exists, "Student not registered");
        require(input.coefficient >= 1 && input.coefficient <= 10, "Coefficient must be 1-10");

        uint16 finalGrade = input.gradeRattrapage > input.gradeS1 ? input.gradeRattrapage : input.gradeS1;

        // Block 1: Push module result
        {
            studentModules[studentWallet].push(ModuleResult({
                moduleCode:      input.moduleCode,
                moduleName:      input.moduleName,
                coefficient:     input.coefficient,
                gradeS1:         input.gradeS1,
                gradeRattrapage: input.gradeRattrapage,
                finalGrade:      finalGrade,
                credits:         input.credits,
                semester:        input.semester,
                validated:       true
            }));
        }

        emit ModuleRecorded(studentWallet, input.moduleCode, finalGrade, input.coefficient);
        _recomputeSemester(studentWallet, input.semester);
    }

    function _recomputeSemester(
        address studentWallet,
        string memory semCode
    ) internal {
        ModuleResult[] storage mods = studentModules[studentWallet];
        bytes32 semHash = keccak256(bytes(semCode));

        uint256 weightedSum = 0;
        uint256 totalCoeffs = 0;
        uint8 semCredits = 0;

        // Block 2: Logic for summation
        {
            for (uint256 i = 0; i < mods.length; i++) {
                if (!mods[i].validated) continue;
                if (keccak256(bytes(mods[i].semester)) != semHash) continue;

                weightedSum += uint256(mods[i].finalGrade) * uint256(mods[i].coefficient);
                totalCoeffs += mods[i].coefficient;
                semCredits  += mods[i].credits;
            }
        }

        if (totalCoeffs == 0) return;

        uint16 moyennePonderee = uint16(weightedSum / totalCoeffs);
        bool semValidated = moyennePonderee >= PASS_SCALED;

        // Block 3: Assignment to mapping
        {
            if (!semesterResults[studentWallet][semCode].exists) {
                studentSemesters[studentWallet].push(semCode);
            }

            semesterResults[studentWallet][semCode] = SemesterResult({
                semesterCode:      semCode,
                moyennePonderee:   moyennePonderee,
                totalCoefficients: uint16(totalCoeffs),
                totalCredits:      semCredits,
                validated:         semValidated,
                exists:            true
            });
        }

        emit SemesterComputed(studentWallet, semCode, moyennePonderee, semValidated);
    }

    function recordThesisDefence(address studentWallet) external onlyAuthorized {
        require(records[studentWallet].exists, "Not registered");
        records[studentWallet].thesisDefended = true;
        emit ThesisDefended(studentWallet, block.timestamp);
    }

    function checkEligibility(
        address studentWallet
    ) external returns (EligibilityResult memory res) {
        StudentRecord storage rec = records[studentWallet];
        require(rec.exists, "Student not registered");

        if (rec.pendingAppeal) {
            res.eligible = false;
            res.reason   = "Pending grade appeal";
            return res;
        }

        LevelRequirements memory req = requirements[rec.level];

        if (req.requiresThesis && !rec.thesisDefended) {
            res.eligible = false;
            res.reason   = "Memoire/Thesis not defended";
            return res;
        }

        res = _computeResult(studentWallet, req);

        emit EligibilityChecked(studentWallet, rec.level, res.eligible, res.reason, res.moyenneGenerale);
    }

    function _computeResult(
        address studentWallet,
        LevelRequirements memory req
    ) internal view returns (EligibilityResult memory res) {
        string[] storage sems = studentSemesters[studentWallet];
        res.totalModules = studentModules[studentWallet].length;

        uint256 validCount = 0;
        uint256 creditSum = 0;
        uint256 weightedMoy = 0;
        uint256 coeffSum = 0;

        // Block 4: Loop logic
        {
            for (uint256 i = 0; i < sems.length; i++) {
                SemesterResult storage sem = semesterResults[studentWallet][sems[i]];
                if (!sem.exists) continue;

                weightedMoy += uint256(sem.moyennePonderee) * uint256(sem.totalCoefficients);
                coeffSum    += sem.totalCoefficients;

                if (sem.validated) {
                    validCount++;
                    creditSum += sem.totalCredits;
                }
            }
        }

        res.validatedSemesters = uint8(validCount);
        res.totalCredits       = uint16(creditSum);
        res.moyenneGenerale    = coeffSum > 0 ? uint16(weightedMoy / coeffSum) : 0;
        res.mention            = _mention(res.moyenneGenerale);

        if (validCount < req.totalSemesters) {
            res.eligible = false;
            res.reason   = "Not all required semesters validated";
            return res;
        }

        if (res.totalCredits < req.totalCredits) {
            res.eligible = false;
            res.reason   = "Insufficient validated credits";
            return res;
        }

        res.eligible = true;
        res.reason   = "All graduation requirements met";
    }

    // ... [Mention and Read functions remain same] ...

    function _mention(uint16 moy) internal pure returns (string memory) {
        if (moy >= 1600) return "Tres Bien";
        if (moy >= 1400) return "Bien";
        if (moy >= 1200) return "Assez Bien";
        if (moy >= 1000) return "Passable";
        return "Insuffisant";
    }

    function getStudentRecord(address w) external view returns (
        StudentRecord memory record,
        StudentStats memory stats
    ) {
        record = records[w];
        stats = StudentStats({
            moduleCount: studentModules[w].length,
            semesterCount: studentSemesters[w].length
        });
    }
}