// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EnrollmentRegistry
 * @notice On-chain enrollment for Algerian LMD university system
 * @dev Optimized with scoping blocks to solve Stack Too Deep / Memoryguard errors.
 */
contract EnrollmentRegistry {

    struct Enrollment {
        address studentWallet;
        string  matricule;
        string  fullName;
        string  level;
        string  specialty;
        string  academicYear;
        string  enrollmentType;
        uint256 enrolledAt;
        bool    inscriptionAdmin;
        bool    inscriptionPedago;
        bool    active;
    }

    struct EnrollmentInput {
        address wallet;
        string  matricule;
        string  fullName;
        string  level;
        string  specialty;
        string  academicYear;
        string  enrollmentType;
    }

    struct Module {
        string  code;
        string  name;
        string  level;
        string  specialty;
        uint8   coefficient;
        uint8   credits;
        string  semester;
        address professor;
        bool    active;
    }

    struct ModuleInput {
        string  code;
        string  name;
        string  level;
        string  specialty;
        uint8   coefficient;
        uint8   credits;
        string  semester;
        address professor;
    }

    mapping(address => Enrollment)  public enrollments;
    mapping(string => Module)       public modules;
    mapping(address => string[])    public studentModules;

    address public admin;

    event StudentEnrolled(address indexed wallet, string matricule, string level, string year);
    event ModuleRegistered(address indexed student, string moduleCode, string academicYear);
    event InscriptionValidated(address indexed student, string inscType);

    modifier onlyAdmin() { require(msg.sender == admin, "Admin only"); _; }

    constructor() { admin = msg.sender; }

    /**
     * @notice Enrolls a student. Scoping block clears string pointers immediately after state write.
     */
    function enrollStudent(EnrollmentInput calldata inp) public onlyAdmin {
        {
            enrollments[inp.wallet] = Enrollment({
                studentWallet:       inp.wallet,
                matricule:           inp.matricule,
                fullName:            inp.fullName,
                level:               inp.level,
                specialty:           inp.specialty,
                academicYear:        inp.academicYear,
                enrollmentType:      inp.enrollmentType,
                enrolledAt:          block.timestamp,
                inscriptionAdmin:    false,
                inscriptionPedago:   false,
                active:              true
            });
        }
        
        emit StudentEnrolled(inp.wallet, inp.matricule, inp.level, inp.academicYear);
    }

    function validateAdminInscription(address wallet) public onlyAdmin {
        enrollments[wallet].inscriptionAdmin = true;
        emit InscriptionValidated(wallet, "Administrative");
    }

    function validatePedagoInscription(address wallet) public onlyAdmin {
        enrollments[wallet].inscriptionPedago = true;
        emit InscriptionValidated(wallet, "Pedagogique");
    }

    /**
     * @notice Adds a module. Scoping block prevents stack buildup from 8 mixed-type inputs.
     */
    function addModule(ModuleInput calldata inp) public onlyAdmin {
        {
            modules[inp.code] = Module({
                code:        inp.code,
                name:        inp.name,
                level:       inp.level,
                specialty:   inp.specialty,
                coefficient: inp.coefficient,
                credits:     inp.credits,
                semester:    inp.semester,
                professor:   inp.professor,
                active:      true
            });
        }
    }

    function registerForModule(
        string memory moduleCode,
        string memory academicYear
    ) public {
        // Using a storage pointer for the check to keep stack usage at 1 slot
        Enrollment storage e = enrollments[msg.sender];
        
        require(e.active, "Not enrolled");
        require(
            e.inscriptionAdmin && e.inscriptionPedago,
            "Inscription not validated"
        );
        
        studentModules[msg.sender].push(moduleCode);
        emit ModuleRegistered(msg.sender, moduleCode, academicYear);
    }

    function getStudentModules(address wallet) public view returns (string[] memory) {
        return studentModules[wallet];
    }

    function isFullyEnrolled(address wallet) public view returns (bool) {
        Enrollment storage e = enrollments[wallet];
        return e.inscriptionAdmin && e.inscriptionPedago && e.active;
    }
}