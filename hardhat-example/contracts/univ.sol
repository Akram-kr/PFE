// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title  UniversityDiploma (Monolithic Edition)
 * @author University of Blida 1 — PFE Project (DiploChain)
 * @notice Soulbound NFT + On-Chain Enrollment + Grades Ledger + Multi-Sig Governance.
 */
contract UniversityDiploma is ERC721, AccessControl, ReentrancyGuard {

    // =========================================================================
    // Constants
    // =========================================================================

    uint256 public constant PROPOSAL_EXPIRY = 7 days;
    uint256 public constant MAX_BATCH_SIZE  = 300;
    uint16  public constant PASS_GRADE = 1000;
    uint16  public constant MAX_GRADE  = 2000;

    // =========================================================================
    // Roles
    // =========================================================================

    bytes32 public constant ADMIN_ROLE     = keccak256("ADMIN_ROLE");
    bytes32 public constant DEAN_ROLE      = keccak256("DEAN_ROLE");
    bytes32 public constant RECTOR_ROLE    = keccak256("RECTOR_ROLE");
    bytes32 public constant COUNCIL_ROLE   = keccak256("COUNCIL_ROLE");
    bytes32 public constant PROFESSOR_ROLE = keccak256("PROFESSOR_ROLE"); // NEW: For grading

    // =========================================================================
    // Enumerations
    // =========================================================================

    enum BatchStatus { Proposed, Deliberated, SignedByDean, SignedByRector, Minted, Cancelled }
    enum Specialty { SIQ, ISIL, AI, Reseau }
    enum Cycle { L1, L2, L3, M1, M2 }
    enum Mention { Passable, AssezBien, Bien, TresBien }

    // =========================================================================
    // Structs
    // =========================================================================

    struct StudentEntry {
        address   wallet;
        string    studentName;
        string    matricule;
        string    dateOfBirth;  
        string    placeOfBirth; 
        string    metadataCID;
        bytes32   sha256Hash;
        Specialty specialty;
        Cycle     cycle;
        uint16    moyenne;      
        uint16    graduationYear;
        string    department;
    }

    struct Batch {
        StudentEntry[] students;
        BatchStatus    status;
        address        proposer;
        uint256        proposedAt;
        uint256        expiresAt;        
        uint256        deliberatedAt;
        address        deliberatedBy;
        uint256        deanSignedAt;
        uint256        rectorSignedAt;
        string         description;
        string         cancelReason;     
        string         deliberationNote; 
    }

    struct DiplomaRecord {
        string    studentName;
        string    matricule;
        string    dateOfBirth;
        string    placeOfBirth;
        string    metadataCID;
        bytes32   sha256Hash;
        Specialty specialty;
        Cycle     cycle;
        Mention   mention;        
        uint16    moyenne;        
        uint16    graduationYear;
        string    department;
        uint256   batchId;
        uint256   mintedAt;
        bool      valid;
        string    revocationReason; 
    }

    // NEW: Enrollment & Ledger Structs
    struct AcademicModule {
        string name;
        uint8  coefficient;
        bool   active;
    }

    struct StudentProfile {
        bool adminValidated;
        bool pedagoValidated;
        bool active;
    }

    // =========================================================================
    // State
    // =========================================================================

    uint256 private _nextTokenId;
    uint256 private _nextBatchId;

    mapping(uint256 => Batch)         private _batches;
    mapping(uint256 => DiplomaRecord) private _diplomaRecords;
    mapping(string  => bool)          private _matriculeUsed;
    mapping(address => uint256[])     private _studentTokens;

    // NEW: Enrollment & Grades State
    mapping(string => AcademicModule) public academicModules;
    mapping(address => StudentProfile) public studentProfiles;
    mapping(address => string[]) public studentRegisteredModules;
    mapping(address => mapping(string => uint16)) public studentGrades;

    uint256 public verificationCount;

    // =========================================================================
    // Events
    // =========================================================================

    event BatchProposed(uint256 indexed batchId, address indexed proposer, uint256 studentCount, string description, uint256 expiresAt);
    event BatchDeliberated(uint256 indexed batchId, address indexed councilMember, uint256 timestamp, string note);
    event BatchSignedByDean(uint256 indexed batchId, address indexed dean, uint256 timestamp);
    event BatchSignedByRector(uint256 indexed batchId, address indexed rector, uint256 timestamp);
    event DiplomasMinted(uint256 indexed batchId, uint256[] tokenIds);
    event BatchCancelled(uint256 indexed batchId, address indexed cancelledBy, string reason);
    event DiplomaVerified(uint256 indexed tokenId, address indexed verifier, bool isAuthentic, uint256 count);
    event DiplomaRevoked(uint256 indexed tokenId, address indexed revokedBy, string reason, uint256 timestamp);
    
    // Role Events
    event RoleAssigned(bytes32 indexed role, address indexed account, address indexed assignedBy);
    event RoleRemoved(bytes32 indexed role, address indexed account, address indexed removedBy);

    // Ledger Events
    event StudentEnrolled(address indexed student, string level);
    event ModuleAdded(string code, string name, uint8 coeff);
    event ModuleRegistered(address indexed student, string code);
    event GradeSubmitted(address indexed student, string moduleCode, uint16 grade, address professor);

    // =========================================================================
    // Errors
    // =========================================================================

    error SBT_TransferNotAllowed();
    error Role_ZeroAddress();
    error Batch_EmptyStudentList();
    error Batch_TooLarge(uint256 provided, uint256 max);
    error Batch_InvalidStatus(uint256 batchId, BatchStatus current, BatchStatus required);
    error Batch_Expired(uint256 batchId);
    error Batch_CannotCancel(uint256 batchId);
    error Batch_MissingCancelReason();
    error Batch_InvalidStudentWallet(uint256 index);
    error Batch_MissingName(uint256 index);
    error Batch_MissingMatricule(uint256 index);
    error Batch_MissingCID(uint256 index);
    error Batch_MissingHash(uint256 index);
    error Batch_MissingDepartment(uint256 index);
    error Batch_InvalidGraduationYear(uint256 index);
    error Batch_InvalidMoyenne(uint256 index, uint16 moyenne, uint16 onChainMoyenne);
    error Batch_StudentFailed(uint256 index, uint16 moyenne);
    error Batch_MatriculeAlreadyMinted(string matricule);
    error Token_DoesNotExist(uint256 tokenId);
    error Token_AlreadyRevoked(uint256 tokenId);
    error Token_MissingRevocationReason();

    // Ledger Errors
    error Enrollment_NotActive();
    error Enrollment_NotValidated();
    error Ledger_ModuleDoesNotExist();
    error Ledger_InvalidGrade();

    // =========================================================================
    // Constructor
    // =========================================================================

    constructor(address admin) ERC721("UniversityDiploma", "UDIP") {
        if (admin == address(0)) revert Role_ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    // =========================================================================
    // Role Management (admin-only)
    // =========================================================================

    function assignRole(bytes32 role, address account) external onlyRole(ADMIN_ROLE) {
        if (account == address(0)) revert Role_ZeroAddress();
        _grantRole(role, account);
        emit RoleAssigned(role, account, msg.sender);
    }

    function removeRole(bytes32 role, address account) external onlyRole(ADMIN_ROLE) {
        _revokeRole(role, account);
        emit RoleRemoved(role, account, msg.sender);
    }

    // =========================================================================
    // PART 1: Enrollment & Grades Ledger (Scolarité)
    // =========================================================================

    function enrollStudentAdmin(address student) external onlyRole(ADMIN_ROLE) {
        studentProfiles[student].adminValidated = true;
        studentProfiles[student].active = true;
        emit StudentEnrolled(student, "Admin");
    }

    function enrollStudentPedago(address student) external onlyRole(ADMIN_ROLE) {
        studentProfiles[student].pedagoValidated = true;
        emit StudentEnrolled(student, "Pedago");
    }

    function addAcademicModule(string calldata code, string calldata name, uint8 coeff) external onlyRole(ADMIN_ROLE) {
        academicModules[code] = AcademicModule({
            name: name,
            coefficient: coeff,
            active: true
        });
        emit ModuleAdded(code, name, coeff);
    }

    function registerForModule(string calldata code) external {
        StudentProfile storage p = studentProfiles[msg.sender];
        if (!p.active) revert Enrollment_NotActive();
        if (!p.adminValidated || !p.pedagoValidated) revert Enrollment_NotValidated();
        if (!academicModules[code].active) revert Ledger_ModuleDoesNotExist();

        studentRegisteredModules[msg.sender].push(code);
        emit ModuleRegistered(msg.sender, code);
    }

    function setGrade(address student, string calldata code, uint16 grade) external onlyRole(PROFESSOR_ROLE) {
        if (grade > MAX_GRADE) revert Ledger_InvalidGrade();
        studentGrades[student][code] = grade;
        emit GradeSubmitted(student, code, grade, msg.sender);
    }

    function calculateOnChainMoyenne(address student) public view returns (uint16) {
        string[] memory mods = studentRegisteredModules[student];
        if (mods.length == 0) return 0;

        uint256 totalPoints = 0;
        uint256 totalCoeffs = 0;

        for (uint256 i = 0; i < mods.length; i++) {
            string memory code = mods[i];
            uint8 coeff = academicModules[code].coefficient;
            uint16 grade = studentGrades[student][code];

            totalPoints += (uint256(grade) * coeff);
            totalCoeffs += coeff;
        }

        if (totalCoeffs == 0) return 0;
        return uint16(totalPoints / totalCoeffs);
    }

    // =========================================================================
    // PART 2: Soulbound: block all transfers
    // =========================================================================

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0)) revert SBT_TransferNotAllowed();
        return super._update(to, tokenId, auth);
    }

    function _mentionFromMoyenne(uint16 moyenne) internal pure returns (Mention) {
        if (moyenne < 1200) return Mention.Passable;
        if (moyenne < 1400) return Mention.AssezBien;
        if (moyenne < 1600) return Mention.Bien;
        return Mention.TresBien;
    }

    // =========================================================================
    // PART 3: Multi-Sig Batch Governance (On-Chain Enforced)
    // =========================================================================

    function proposeBatch(
        StudentEntry[] calldata students,
        string calldata description
    ) external onlyRole(ADMIN_ROLE) returns (uint256 batchId) {
        if (students.length == 0)                revert Batch_EmptyStudentList();
        if (students.length > MAX_BATCH_SIZE)    revert Batch_TooLarge(students.length, MAX_BATCH_SIZE);

        batchId = _nextBatchId++;
        Batch storage batch = _batches[batchId];
        batch.status      = BatchStatus.Proposed;
        batch.proposer    = msg.sender;
        batch.proposedAt  = block.timestamp;
        batch.expiresAt   = block.timestamp + PROPOSAL_EXPIRY;
        batch.description = description;

        for (uint256 i = 0; i < students.length; ) {
            StudentEntry calldata s = students[i];
            if (s.wallet == address(0))                  revert Batch_InvalidStudentWallet(i);
            if (bytes(s.studentName).length == 0)        revert Batch_MissingName(i);
            if (bytes(s.matricule).length == 0)          revert Batch_MissingMatricule(i);
            if (bytes(s.metadataCID).length == 0)        revert Batch_MissingCID(i);
            if (s.sha256Hash == bytes32(0))              revert Batch_MissingHash(i);
            if (bytes(s.department).length == 0)         revert Batch_MissingDepartment(i);
            if (s.graduationYear < 2000 || s.graduationYear > 2100) revert Batch_InvalidGraduationYear(i);

            // INTEGRATION: Ensure the admin's proposed moyenne matches the on-chain ledger!
            uint16 actualMoyenne = calculateOnChainMoyenne(s.wallet);
            if (s.moyenne != actualMoyenne) revert Batch_InvalidMoyenne(i, s.moyenne, actualMoyenne);

            batch.students.push(s);
            unchecked { ++i; }
        }

        emit BatchProposed(batchId, msg.sender, students.length, description, batch.expiresAt);
    }

    function deliberate(uint256 batchId, string calldata note) external onlyRole(COUNCIL_ROLE) {
        Batch storage batch = _batches[batchId];
        if (block.timestamp > batch.expiresAt)    revert Batch_Expired(batchId);
        if (batch.status != BatchStatus.Proposed) revert Batch_InvalidStatus(batchId, batch.status, BatchStatus.Proposed);

        uint256 count = batch.students.length;
        for (uint256 i = 0; i < count; ) {
            uint16 m = batch.students[i].moyenne;
            if (m < PASS_GRADE) revert Batch_StudentFailed(i, m);
            unchecked { ++i; }
        }

        batch.status           = BatchStatus.Deliberated;
        batch.deliberatedAt    = block.timestamp;
        batch.deliberatedBy    = msg.sender;
        batch.deliberationNote = note;

        emit BatchDeliberated(batchId, msg.sender, block.timestamp, note);
    }

    function signByDean(uint256 batchId) external onlyRole(DEAN_ROLE) {
        Batch storage batch = _batches[batchId];
        if (block.timestamp > batch.expiresAt)        revert Batch_Expired(batchId);
        if (batch.status != BatchStatus.Deliberated)  revert Batch_InvalidStatus(batchId, batch.status, BatchStatus.Deliberated);
        batch.status       = BatchStatus.SignedByDean;
        batch.deanSignedAt = block.timestamp;
        emit BatchSignedByDean(batchId, msg.sender, block.timestamp);
    }

    function signByRector(uint256 batchId) external onlyRole(RECTOR_ROLE) {
        Batch storage batch = _batches[batchId];
        if (block.timestamp > batch.expiresAt)        revert Batch_Expired(batchId);
        if (batch.status != BatchStatus.SignedByDean) revert Batch_InvalidStatus(batchId, batch.status, BatchStatus.SignedByDean);
        batch.status         = BatchStatus.SignedByRector;
        batch.rectorSignedAt = block.timestamp;
        emit BatchSignedByRector(batchId, msg.sender, block.timestamp);
    }

    function mintBatch(uint256 batchId) external onlyRole(ADMIN_ROLE) nonReentrant returns (uint256[] memory tokenIds) {
        Batch storage batch = _batches[batchId];
        if (block.timestamp > batch.expiresAt)             revert Batch_Expired(batchId);
        if (batch.status != BatchStatus.SignedByRector)    revert Batch_InvalidStatus(batchId, batch.status, BatchStatus.SignedByRector);

        uint256 count = batch.students.length;
        tokenIds = new uint256[](count);

        for (uint256 i = 0; i < count; ) {
            StudentEntry storage s = batch.students[i];
            if (_matriculeUsed[s.matricule]) revert Batch_MatriculeAlreadyMinted(s.matricule);

            uint256 tokenId = _nextTokenId++;
            _safeMint(s.wallet, tokenId);

            _diplomaRecords[tokenId] = DiplomaRecord({
                studentName      : s.studentName,
                matricule        : s.matricule,
                dateOfBirth      : s.dateOfBirth,
                placeOfBirth     : s.placeOfBirth,
                metadataCID      : s.metadataCID,
                sha256Hash       : s.sha256Hash,
                specialty        : s.specialty,
                cycle            : s.cycle,
                mention          : _mentionFromMoyenne(s.moyenne),
                moyenne          : s.moyenne,
                graduationYear   : s.graduationYear,
                department       : s.department,
                batchId          : batchId,
                mintedAt         : block.timestamp,
                valid            : true,
                revocationReason : ""
            });

            _matriculeUsed[s.matricule] = true;
            _studentTokens[s.wallet].push(tokenId);
            tokenIds[i] = tokenId;
            unchecked { ++i; }
        }

        batch.status = BatchStatus.Minted;
        emit DiplomasMinted(batchId, tokenIds);
    }

    function cancelBatch(uint256 batchId, string calldata reason) external onlyRole(ADMIN_ROLE) {
        Batch storage batch = _batches[batchId];
        BatchStatus st = batch.status;
        if (st == BatchStatus.Minted || st == BatchStatus.Cancelled) revert Batch_CannotCancel(batchId);
        if (bytes(reason).length == 0) revert Batch_MissingCancelReason();
        
        batch.status       = BatchStatus.Cancelled;
        batch.cancelReason = reason;
        emit BatchCancelled(batchId, msg.sender, reason);
    }

    // =========================================================================
    // Revocation & Verification
    // =========================================================================

    function revokeDiploma(uint256 tokenId, string calldata reason) external onlyRole(ADMIN_ROLE) {
        if (_ownerOf(tokenId) == address(0))   revert Token_DoesNotExist(tokenId);
        if (!_diplomaRecords[tokenId].valid)   revert Token_AlreadyRevoked(tokenId);
        if (bytes(reason).length == 0)         revert Token_MissingRevocationReason();

        _diplomaRecords[tokenId].valid            = false;
        _diplomaRecords[tokenId].revocationReason = reason;

        emit DiplomaRevoked(tokenId, msg.sender, reason, block.timestamp);
    }

    function verifyDiploma(uint256 tokenId, bytes32 pdfHash) external returns (bool isAuthentic) {
        if (_ownerOf(tokenId) == address(0)) revert Token_DoesNotExist(tokenId);

        DiplomaRecord storage rec = _diplomaRecords[tokenId];
        isAuthentic = rec.valid && (rec.sha256Hash == pdfHash);

        verificationCount += 1;
        emit DiplomaVerified(tokenId, msg.sender, isAuthentic, verificationCount);
    }

    // =========================================================================
    // View Functions
    // =========================================================================

    function getStudentDiplomas(address student) external view returns (uint256[] memory) { return _studentTokens[student]; }
    function isMatriculeUsed(string calldata matricule) external view returns (bool) { return _matriculeUsed[matricule]; }
    function getDiplomaRecord(uint256 tokenId) external view returns (DiplomaRecord memory) {
        if (_ownerOf(tokenId) == address(0)) revert Token_DoesNotExist(tokenId);
        return _diplomaRecords[tokenId];
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert Token_DoesNotExist(tokenId);
        return string(abi.encodePacked("ipfs://", _diplomaRecords[tokenId].metadataCID));
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}