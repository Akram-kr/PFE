// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/**
 * @title IEnrollmentRegistry
 * @dev Interface to fetch module coefficients for GPA calculation
 */
interface IEnrollmentRegistry {
    function modules(string memory code) external view returns (
        string memory, string memory, string memory, 
        uint8 coeff, uint8 creds, 
        string memory, string memory
    );
}

/**
 * @title GradesLedger
 * @notice Immutable on-chain grade registry for the Algerian LMD system
 * @dev Professors submit grades once — immutable after validation
 */
contract GradesLedger {

    struct Grade {
        string  matricule;      // Student ID
        address studentWallet;
        string  moduleCode;     // ex: "INF301", "MAT201"
        string  moduleName;     // ex: "Algorithmique Avancée"
        uint8   tdNote;         // TD note /20  (×10 stored, so 15.5 = 155)
        uint8   tpNote;         // TP note /20
        uint8   examNote;       // Examen note /20
        uint8   rattrapageNote; // Rattrapage (if applicable)
        uint8   moyenne;        // Moyenne générale /20
        string  mention;        // Passable/AB/Bien/TB
        string  semester;       // "S1","S2","S3","S4","S5","S6" etc
        string  academicYear;   // "2024-2025"
        address submittedBy;    // Professor wallet
        uint256 submittedAt;
        bool    validated;      // Validated by Department Head
        bool    locked;         // Locked after validation — immutable
    }

    // gradeId => Grade
    mapping(bytes32 => Grade)   public grades;
    // studentWallet => list of gradeIds
    mapping(address => bytes32[]) public studentGrades;
    // moduleCode + semester + year => locked
    mapping(bytes32 => bool)    public moduleLocked;

    mapping(address => bool) public authorizedProfessors;
    mapping(address => bool) public departmentHeads;
    
    address public admin;
    IEnrollmentRegistry public registry; // Fixed: Connected to the interface

    event GradeSubmitted(bytes32 indexed gradeId, address indexed student, string moduleCode, uint8 moyenne);
    event GradeValidated(bytes32 indexed gradeId, address validatedBy);
    event ModuleLocked(string moduleCode, string semester, string year);

    modifier onlyProfessor() {
        require(authorizedProfessors[msg.sender], "Not a professor");
        _;
    }
    
    modifier onlyDeptHead() {
        require(departmentHeads[msg.sender], "Not a department head");
        _;
    }

    constructor() {
        admin = msg.sender;
        authorizedProfessors[msg.sender] = true;
        departmentHeads[msg.sender] = true;
    }

    function setRegistry(address registryAddress) public {
        require(msg.sender == admin, "Admin only");
        registry = IEnrollmentRegistry(registryAddress);
    }

    function addProfessor(address prof) public {
        require(msg.sender == admin, "Admin only");
        authorizedProfessors[prof] = true;
    }

    function addDeptHead(address head) public {
        require(msg.sender == admin, "Admin only");
        departmentHeads[head] = true;
    }

    // ── Submit grades for a student ───────────────────────
    function submitGrade(
        address studentWallet,
        string memory matricule,
        string memory moduleCode,
        string memory moduleName,
        uint8 tdNote,
        uint8 tpNote,
        uint8 examNote,
        uint8 rattrapageNote,
        uint8 moyenne,
        string memory mention,
        string memory semester,
        string memory academicYear
    ) public onlyProfessor returns (bytes32) {
        
        // FIX 1: Updated validation to allow x10 decimals (20.0 = 200)
        require(tdNote <= 200 && tpNote <= 200 && examNote <= 200 && moyenne <= 200, "Notes must be 0-200 (x10)");

        bytes32 gradeId = keccak256(abi.encodePacked(
            studentWallet, moduleCode, semester, academicYear
        ));

        // Check module not locked
        bytes32 moduleKey = keccak256(abi.encodePacked(
            moduleCode, semester, academicYear
        ));
        require(!moduleLocked[moduleKey], "Module grades are locked");

        // FIX 2: Prevent duplicate array entries if the professor resubmits before it is locked
        if (grades[gradeId].submittedAt == 0) {
            studentGrades[studentWallet].push(gradeId);
        }

        grades[gradeId] = Grade({
            matricule:      matricule,
            studentWallet:  studentWallet,
            moduleCode:     moduleCode,
            moduleName:     moduleName,
            tdNote:         tdNote,
            tpNote:         tpNote,
            examNote:       examNote,
            rattrapageNote: rattrapageNote,
            moyenne:        moyenne,
            mention:        mention,
            semester:       semester,
            academicYear:   academicYear,
            submittedBy:    msg.sender,
            submittedAt:    block.timestamp,
            validated:      false,
            locked:         false
        });

        emit GradeSubmitted(gradeId, studentWallet, moduleCode, moyenne);
        return gradeId;
    }

    // ── Department Head validates grades ──────────────────
    function validateGrade(bytes32 gradeId) public onlyDeptHead {
        require(!grades[gradeId].locked, "Already locked");
        grades[gradeId].validated = true;
        grades[gradeId].locked = true;
        emit GradeValidated(gradeId, msg.sender);
    }

    // ── Lock entire module for a semester ─────────────────
    function lockModule(
        string memory moduleCode,
        string memory semester,
        string memory academicYear
    ) public onlyDeptHead {
        bytes32 moduleKey = keccak256(abi.encodePacked(
            moduleCode, semester, academicYear
        ));
        moduleLocked[moduleKey] = true;
        emit ModuleLocked(moduleCode, semester, academicYear);
    }

    // ── Get all grades for a student ──────────────────────
    function getStudentGrades(
        address studentWallet
    ) public view returns (bytes32[] memory) {
        return studentGrades[studentWallet];
    }

    // ── Compute GPA across all modules ───────────────────
    function getStudentGPA(address studentWallet) public view returns (uint256 weightedGpa) {
        bytes32[] memory ids = studentGrades[studentWallet];
        if (ids.length == 0) return 0;

        uint256 totalWeightedPoints = 0;
        uint256 totalCoefficients = 0;

        for (uint256 i = 0; i < ids.length; i++) {
            Grade storage g = grades[ids[i]];
            
            // FIX 3: Correctly fetches the coefficient using the new Interface
            (,,, uint8 coeff, , ,) = registry.modules(g.moduleCode);
            
            if (coeff > 0) {
                // Standard LMD Calculation: (Note * Coeff)
                totalWeightedPoints += (uint256(g.moyenne) * coeff);
                totalCoefficients += coeff;
            }
        }

        if (totalCoefficients == 0) return 0;
        return totalWeightedPoints / totalCoefficients;
    }
}