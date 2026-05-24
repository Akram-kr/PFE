// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  UniversityDAO
 * @notice Role registry for the University of Blida 1 diploma ecosystem.
 *
 * Roles (ordered by authority):
 *   NONE         — unregistered address
 *   STUDENT      — enrolled student, receives diploma NFTs
 *   PROFESSOR    — teaching staff
 *   ADMIN        — scolarité staff, prepares diploma proposals
 *   DEAN         — Doyen de la Faculté, required signer for diploma batches
 *   RECTOR       — Recteur de l'Université, required signer for diploma batches
 *
 * Only the Rector (deployer) can assign the DEAN and RECTOR roles.
 * Admins can register students and professors.
 *
 * @dev Roles are stored as uint8 enum values for gas efficiency.
 *      All privileged functions emit events for on-chain audit trail.
 */
contract UniversityDAO {

    // ── Roles ──────────────────────────────────────────────────────────────

    enum Role {
        NONE,        // 0 — not registered
        STUDENT,     // 1
        PROFESSOR,   // 2
        ADMIN,       // 3 — scolarité
        DEAN,        // 4 — Doyen (signs diploma batches)
        RECTOR       // 5 — Recteur (signs diploma batches, highest authority)
    }

    // ── Structs ────────────────────────────────────────────────────────────

    struct Member {
        string  fullName;
        string  department;    // e.g. "Informatique", "Mathématiques"
        string  faculty;       // e.g. "Faculté des Sciences"
        Role    role;
        bool    active;
        uint256 registeredAt;
    }

    struct StudentInfo {
        string  fullName;
        string  matricule;     // Numéro de matricule (e.g. "20241234")
        string  dateOfBirth;   // "DD/MM/YYYY"
        string  placeOfBirth;  // e.g. "Blida"
        string  faculty;
        string  department;
        string  specialty;     // "SIQ", "ISIL", "AI", "Réseau"
        string  cycle;         // "L3" or "M2"
        string  academicYear;  // "2024-2025"
        bool    enrolled;
        uint256 enrolledAt;
    }

    struct MemberInput {
        address wallet;
        string  fullName;
        string  department;
        string  faculty;
        Role    role;
    }

    struct StudentInput {
        address wallet;
        string  fullName;
        string  matricule;
        string  dateOfBirth;
        string  placeOfBirth;
        string  faculty;
        string  department;
        string  specialty;
        string  cycle;
        string  academicYear;
    }

    // ── State ──────────────────────────────────────────────────────────────

    address public rector;                          // deployer = initial rector

    mapping(address => Role)        public roles;
    mapping(address => Member)      public members;
    mapping(address => StudentInfo) public students;

    // Track all registered addresses for enumeration
    address[] private memberList;
    address[] private studentList;

    string public universityName;
    string public universityCode;

    // ── Events ─────────────────────────────────────────────────────────────

    event MemberRegistered(
        address indexed wallet,
        string  fullName,
        Role    role,
        uint256 timestamp
    );
    event StudentEnrolled(
        address indexed wallet,
        string  matricule,
        string  specialty,
        string  cycle
    );
    event RoleUpdated(
        address indexed wallet,
        Role    oldRole,
        Role    newRole
    );
    event MemberDeactivated(address indexed wallet);

    // ── Modifiers ──────────────────────────────────────────────────────────

    modifier onlyRector() {
        require(msg.sender == rector, "Only Rector");
        _;
    }

    modifier onlyAdmin() {
        require(
            roles[msg.sender] == Role.ADMIN   ||
            roles[msg.sender] == Role.DEAN    ||
            roles[msg.sender] == Role.RECTOR,
            "Admin or above required"
        );
        _;
    }

    modifier onlyHighAuthority() {
        require(
            roles[msg.sender] == Role.DEAN   ||
            roles[msg.sender] == Role.RECTOR,
            "Dean or Rector required"
        );
        _;
    }

    // ── Constructor ────────────────────────────────────────────────────────

    /**
     * @param _name  University full name
     * @param _code  Short code used in metadata (e.g. "UDBB1")
     */
    constructor(string memory _name, string memory _code) {
        rector           = msg.sender;
        universityName   = _name;
        universityCode   = _code;
        roles[msg.sender] = Role.RECTOR;

        // Register deployer as Rector member
        members[msg.sender] = Member({
            fullName:     "Recteur",
            department:   "Rectorat",
            faculty:      _name,
            role:         Role.RECTOR,
            active:       true,
            registeredAt: block.timestamp
        });
        memberList.push(msg.sender);

        emit MemberRegistered(msg.sender, "Recteur", Role.RECTOR, block.timestamp);
    }

    // ── Role assignment ────────────────────────────────────────────────────

    /**
     * @notice Register any non-student member (ADMIN, DEAN, RECTOR, PROFESSOR)
     * @dev    Only Rector can assign DEAN and RECTOR roles.
     *         Admins can assign PROFESSOR role only.
     */
   

    // ── Student enrollment ─────────────────────────────────────────────────

    /**
     * @notice Enroll a student with full LMD academic info.
     * @dev    specialty must be one of: "SIQ", "ISIL", "AI", "Réseau"
     *         cycle must be "L3" or "M2"
     */
    function enrollStudent(StudentInput calldata inp) external onlyAdmin {
        require(inp.wallet != address(0),           "Invalid address");
        require(bytes(inp.matricule).length > 0,    "Matricule required");
        require(_validSpecialty(inp.specialty),     "Invalid specialty");
        require(_validCycle(inp.cycle),             "Cycle must be L3 or M2");

        // FIX: Pointer-based assignment to avoid stack variable overload
        StudentInfo storage student = students[inp.wallet];
        
        student.fullName = inp.fullName;
        student.matricule = inp.matricule;
        student.dateOfBirth = inp.dateOfBirth;
        student.placeOfBirth = inp.placeOfBirth;
        student.faculty = inp.faculty;
        student.department = inp.department;
        student.specialty = inp.specialty;
        student.cycle = inp.cycle;
        student.academicYear = inp.academicYear;
        student.enrolled = true;
        student.enrolledAt = block.timestamp;

        if (roles[inp.wallet] == Role.NONE) {
            studentList.push(inp.wallet);
        }
        roles[inp.wallet] = Role.STUDENT;

        emit StudentEnrolled(inp.wallet, inp.matricule, inp.specialty, inp.cycle);
    }

    // ── Member registration (FIXED) ────────────────────────────────────────
function registerMember(MemberInput calldata inp) external {
        require(inp.wallet != address(0), "Invalid address");
        require(inp.role != Role.NONE && inp.role != Role.STUDENT, "Use enrollStudent");

        if (inp.role == Role.DEAN || inp.role == Role.RECTOR) {
            require(msg.sender == rector, "Only Rector");
        } else {
            require(
                roles[msg.sender] == Role.ADMIN  ||
                roles[msg.sender] == Role.DEAN   ||
                roles[msg.sender] == Role.RECTOR,
                "Insufficient permissions"
            );
        }

        Role oldRole = roles[inp.wallet];
        roles[inp.wallet] = inp.role;

        // FIX: Assigning fields one-by-one to storage pointer
        Member storage m = members[inp.wallet];
        m.fullName = inp.fullName;
        m.department = inp.department;
        m.faculty = inp.faculty;
        m.role = inp.role;
        m.active = true;
        m.registeredAt = block.timestamp;

        if (oldRole == Role.NONE) memberList.push(inp.wallet);

        emit MemberRegistered(inp.wallet, inp.fullName, inp.role, block.timestamp);
        if (oldRole != inp.role) emit RoleUpdated(inp.wallet, oldRole, inp.role);
    }
    
    // ── Deactivate member ──────────────────────────────────────────────────

    function deactivateMember(address wallet) external onlyHighAuthority {
        require(members[wallet].active, "Already inactive");
        require(wallet != rector,        "Cannot deactivate Rector");
        members[wallet].active = false;
        emit MemberDeactivated(wallet);
    }

    // ── Read ───────────────────────────────────────────────────────────────

    function getRole(address wallet) external view returns (Role) {
        return roles[wallet];
    }

    function isAuthorizedSigner(address wallet) external view returns (bool) {
        return roles[wallet] == Role.DEAN || roles[wallet] == Role.RECTOR;
    }

    function getMember(address wallet) external view returns (Member memory) {
        return members[wallet];
    }

    function getStudent(address wallet) external view returns (StudentInfo memory) {
        return students[wallet];
    }

    function getMemberList() external view returns (address[] memory) {
        return memberList;
    }

    function getStudentList() external view returns (address[] memory) {
        return studentList;
    }

    function getMemberCount() external view returns (uint256) {
        return memberList.length;
    }

    function getStudentCount() external view returns (uint256) {
        return studentList.length;
    }

    // ── Internal validators ────────────────────────────────────────────────

    function _validSpecialty(string calldata s) internal pure returns (bool) {
        bytes32 h = keccak256(bytes(s));
        return h == keccak256("SIQ")    ||
               h == keccak256("ISIL")   ||
               h == keccak256("AI")     ||
               h == keccak256(unicode"Réseau");
    }

    function _validCycle(string calldata c) internal pure returns (bool) {
        bytes32 h = keccak256(bytes(c));
        return h == keccak256("L3") || h == keccak256("M2");
    }
}
