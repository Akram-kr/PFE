// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UniversityDAO
 * @notice Role-based access control for the university ecosystem.
 * Refactored for stack safety.
 */
contract UniversityDAO {

    // ── Roles ──────────────────────────────────────────────────────────────
    enum Role {
        NONE,
        STUDENT,
        PROFESSOR,
        DEPARTMENT_HEAD,
        SCOLARITE,
        VICE_RECTOR,
        RECTOR,
        EMPLOYER
    }

    // ── Structs ────────────────────────────────────────────────────────────

    struct StaffMember {
        string  fullName;
        string  department;
        string  faculty;
        Role    role;
        bool    active;
        uint256 registeredAt;
    }

    // Input struct to fix stack too deep in staff registration
    struct StaffInput {
        address wallet;
        string  fullName;
        string  department;
        string  faculty;
        Role    role;
    }

    struct StudentRecord {
        string  fullName;
        string  studentId;
        string  faculty;
        string  department;
        string  level;
        string  academicYear;
        bool    enrolled;
        uint256 enrolledAt;
    }

    // Input struct to fix stack too deep in student enrollment
    struct StudentInput {
        address wallet;
        string  fullName;
        string  matricule;
        string  faculty;
        string  department;
        string  level;
        string  academicYear;
    }

    // ── State ──────────────────────────────────────────────────────────────

    address public rector;
    string  public universityName;
    string  public universityCode;

    mapping(address => StaffMember)   public staff;
    mapping(address => StudentRecord) public students;
    mapping(address => Role)          public roles;

    // ── Events ─────────────────────────────────────────────────────────────

    event StaffRegistered(address indexed wallet, string name, Role role);
    event StudentEnrolled(address indexed wallet, string matricule, string level);
    event RoleUpdated(address indexed wallet, Role oldRole, Role newRole);

    // ── Modifiers ──────────────────────────────────────────────────────────

    modifier onlyRector() {
        require(msg.sender == rector, "Only Rector");
        _;
    }

    modifier onlyAdmin() {
        require(
            roles[msg.sender] == Role.RECTOR ||
            roles[msg.sender] == Role.VICE_RECTOR ||
            roles[msg.sender] == Role.SCOLARITE,
            "Admin only"
        );
        _;
    }

    // ── Constructor ────────────────────────────────────────────────────────

    constructor(string memory _name, string memory _code) {
        rector = msg.sender;
        roles[msg.sender] = Role.RECTOR;
        universityName = _name;
        universityCode = _code;
    }

    // ── Functions ──────────────────────────────────────────────────────────

    /**
     * @notice Registers staff using a struct to save stack space (5 args -> 1).
     */
    function registerStaff(StaffInput calldata inp) public onlyAdmin {
        require(inp.role != Role.STUDENT && inp.role != Role.NONE, "Invalid staff role");
        
        staff[inp.wallet] = StaffMember({
            fullName:     inp.fullName,
            department:   inp.department,
            faculty:      inp.faculty,
            role:         inp.role,
            active:       true,
            registeredAt: block.timestamp
        });
        
        roles[inp.wallet] = inp.role;
        emit StaffRegistered(inp.wallet, inp.fullName, inp.role);
    }

    /**
     * @notice Enrolls a student using a struct to save stack space (7 args -> 1).
     */
    function enrollStudent(StudentInput calldata inp) public onlyAdmin {
        students[inp.wallet] = StudentRecord({
            fullName:     inp.fullName,
            studentId:    inp.matricule,
            faculty:      inp.faculty,
            department:   inp.department,
            level:        inp.level,
            academicYear: inp.academicYear,
            enrolled:     true,
            enrolledAt:   block.timestamp
        });
        
        roles[inp.wallet] = Role.STUDENT;
        emit StudentEnrolled(inp.wallet, inp.matricule, inp.level);
    }

    function updateStaffStatus(address wallet, bool _active) public onlyAdmin {
        require(roles[wallet] != Role.NONE && roles[wallet] != Role.STUDENT, "Not a staff member");
        staff[wallet].active = _active;
    }

    function updateStudentStatus(address wallet, bool _enrolled) public onlyAdmin {
        require(roles[wallet] == Role.STUDENT, "Not a student");
        students[wallet].enrolled = _enrolled;
    }

    function updateStaffRole(address wallet, Role newRole) public onlyRector {
        require(roles[wallet] != Role.NONE && roles[wallet] != Role.STUDENT, "Not a staff member");
        require(newRole != Role.STUDENT && newRole != Role.NONE, "Invalid new role");
        
        Role oldRole = roles[wallet];
        roles[wallet] = newRole;
        staff[wallet].role = newRole;
        
        emit RoleUpdated(wallet, oldRole, newRole);
    }

    function getRole(address wallet) public view returns (Role) {
        return roles[wallet];
    }

    function isStaff(address wallet) public view returns (bool) {
        return roles[wallet] != Role.NONE && roles[wallet] != Role.STUDENT;
    }
}