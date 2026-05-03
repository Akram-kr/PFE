// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title  UniversityDiploma
 * @author University of Blida 1 — PFE Project (DiploChain)
 * @notice Soulbound NFT (ERC-721) for high-security diploma issuance.
 *
 * Governance flow per batch:
 *   PROPOSED → SIGNED_BY_DEAN → SIGNED_BY_RECTOR → MINTED
 *   Any non-minted batch can be CANCELLED by admin at any time.
 *   Batches automatically expire after PROPOSAL_EXPIRY (7 days).
 *
 * Security properties (v2):
 *   - Non-transferable Soulbound tokens
 *   - Multi-sig: Admin proposes → Dean signs → Rector signs → Admin mints
 *   - Proposal expiry (7 days) — prevents stale batches
 *   - Matricule uniqueness — one diploma per student ID, ever
 *   - Full identity on-chain (incl. dateOfBirth, placeOfBirth)
 *   - Revocation requires a mandatory reason string
 *   - Public verificationCount per token — on-chain audit trail
 *   - getStudentDiplomas(wallet) — employer / student lookup
 */
contract UniversityDiploma is ERC721, AccessControl, ReentrancyGuard {

    // =========================================================================
    // Constants
    // =========================================================================

    uint256 public constant PROPOSAL_EXPIRY = 7 days;
    uint256 public constant MAX_BATCH_SIZE  = 300;

    // =========================================================================
    // Roles
    // =========================================================================

    bytes32 public constant ADMIN_ROLE  = keccak256("ADMIN_ROLE");
    bytes32 public constant DEAN_ROLE   = keccak256("DEAN_ROLE");
    bytes32 public constant RECTOR_ROLE = keccak256("RECTOR_ROLE");

    // =========================================================================
    // Enumerations
    // =========================================================================

    enum BatchStatus {
        Proposed,        // 0 — submitted by admin, awaiting signatures
        SignedByDean,    // 1 — dean approved, awaiting rector
        SignedByRector,  // 2 — fully approved, ready to mint
        Minted,          // 3 — tokens have been minted
        Cancelled        // 4 — cancelled before minting
    }

    enum Specialty {
        SIQ,     // 0 — Sécurité Informatique et Qualité
        ISIL,    // 1 — Ingénierie des Systèmes d'Information et Logiciel
        AI,      // 2 — Intelligence Artificielle
        Reseau   // 3 — Réseaux Informatiques
    }

    enum Cycle {
        L3,  // 0 — Licence (3 ans)
        M2   // 1 — Master (2 ans)
    }

    enum Mention {
        Passable,    // 0 — 10 ≤ moy < 12
        AssezBien,   // 1 — 12 ≤ moy < 14
        Bien,        // 2 — 14 ≤ moy < 16
        TresBien     // 3 — 16 ≤ moy ≤ 20
    }

    // =========================================================================
    // Structs
    // =========================================================================

    /**
     * @notice Per-student entry submitted inside a proposed batch.
     */
    struct StudentEntry {
        address   wallet;
        string    studentName;
        string    matricule;
        string    dateOfBirth;    // e.g. "15/06/2001"
        string    placeOfBirth;   // e.g. "Blida"
        string    metadataCID;
        bytes32   sha256Hash;
        Specialty specialty;
        Cycle     cycle;
        Mention   mention;
        uint16    graduationYear;
        string    department;
    }

    /**
     * @notice Batch moving through the approval pipeline.
     */
    struct Batch {
        StudentEntry[] students;
        BatchStatus    status;
        address        proposer;
        uint256        proposedAt;
        uint256        expiresAt;       // proposedAt + PROPOSAL_EXPIRY
        uint256        deanSignedAt;
        uint256        rectorSignedAt;
        string         description;
        string         cancelReason;    // populated by cancelBatch()
    }

    /**
     * @notice Full immutable on-chain record per minted diploma token.
     */
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
        uint16    graduationYear;
        string    department;
        uint256   batchId;
        uint256   mintedAt;
        bool      valid;
        string    revocationReason;  // populated by revokeDiploma()
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

    /// @notice How many times each token has been publicly verified.
    mapping(uint256 => uint256) public verificationCount;

    // =========================================================================
    // Events
    // =========================================================================

    event BatchProposed(
        uint256 indexed batchId,
        address indexed proposer,
        uint256         studentCount,
        string          description,
        uint256         expiresAt
    );
    event BatchSignedByDean(uint256 indexed batchId, address indexed dean, uint256 timestamp);
    event BatchSignedByRector(uint256 indexed batchId, address indexed rector, uint256 timestamp);
    event DiplomasMinted(uint256 indexed batchId, uint256[] tokenIds);
    event BatchCancelled(uint256 indexed batchId, address indexed cancelledBy, string reason);
    event DiplomaVerified(uint256 indexed tokenId, address indexed verifier, bool isAuthentic, uint256 count);
    event DiplomaRevoked(uint256 indexed tokenId, address indexed revokedBy, string reason, uint256 timestamp);
    event DeanAssigned(address indexed dean, address indexed assignedBy);
    event DeanRemoved(address indexed dean, address indexed removedBy);
    event RectorAssigned(address indexed rector, address indexed assignedBy);
    event RectorRemoved(address indexed rector, address indexed removedBy);

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
    error Batch_MatriculeAlreadyMinted(string matricule);
    error Token_DoesNotExist(uint256 tokenId);
    error Token_AlreadyRevoked(uint256 tokenId);
    error Token_MissingRevocationReason();

    // =========================================================================
    // Constructor
    // =========================================================================

    /**
     * @param admin Address granted ADMIN_ROLE. Dean and Rector are assigned
     *              afterwards via assignDean() / assignRector().
     */
    constructor(address admin) ERC721("UniversityDiploma", "UDIP") {
        if (admin == address(0)) revert Role_ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    // =========================================================================
    // Role Management (admin-only)
    // =========================================================================

    function assignDean(address dean) external onlyRole(ADMIN_ROLE) {
        if (dean == address(0)) revert Role_ZeroAddress();
        _grantRole(DEAN_ROLE, dean);
        emit DeanAssigned(dean, msg.sender);
    }

    function removeDean(address dean) external onlyRole(ADMIN_ROLE) {
        _revokeRole(DEAN_ROLE, dean);
        emit DeanRemoved(dean, msg.sender);
    }

    function assignRector(address rector) external onlyRole(ADMIN_ROLE) {
        if (rector == address(0)) revert Role_ZeroAddress();
        _grantRole(RECTOR_ROLE, rector);
        emit RectorAssigned(rector, msg.sender);
    }

    function removeRector(address rector) external onlyRole(ADMIN_ROLE) {
        _revokeRole(RECTOR_ROLE, rector);
        emit RectorRemoved(rector, msg.sender);
    }

    // =========================================================================
    // Soulbound: block all transfers
    // =========================================================================

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0)) revert SBT_TransferNotAllowed();
        return super._update(to, tokenId, auth);
    }

    // =========================================================================
    // Multi-Sig Batch Governance
    // =========================================================================

    /**
     * @notice Admin proposes a new batch of diplomas for approval.
     *         The batch expires after PROPOSAL_EXPIRY (7 days).
     */
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
            if (s.graduationYear < 2000 || s.graduationYear > 2100)
                                                         revert Batch_InvalidGraduationYear(i);
            batch.students.push(s);
            unchecked { ++i; }
        }

        emit BatchProposed(batchId, msg.sender, students.length, description, batch.expiresAt);
    }

    /**
     * @notice Dean signs a proposed batch. Reverts if the batch has expired.
     */
    function signByDean(uint256 batchId) external onlyRole(DEAN_ROLE) {
        Batch storage batch = _batches[batchId];
        if (block.timestamp > batch.expiresAt)    revert Batch_Expired(batchId);
        if (batch.status != BatchStatus.Proposed)
            revert Batch_InvalidStatus(batchId, batch.status, BatchStatus.Proposed);
        batch.status       = BatchStatus.SignedByDean;
        batch.deanSignedAt = block.timestamp;
        emit BatchSignedByDean(batchId, msg.sender, block.timestamp);
    }

    /**
     * @notice Rector signs a dean-approved batch. Reverts if the batch has expired.
     */
    function signByRector(uint256 batchId) external onlyRole(RECTOR_ROLE) {
        Batch storage batch = _batches[batchId];
        if (block.timestamp > batch.expiresAt)        revert Batch_Expired(batchId);
        if (batch.status != BatchStatus.SignedByDean)
            revert Batch_InvalidStatus(batchId, batch.status, BatchStatus.SignedByDean);
        batch.status         = BatchStatus.SignedByRector;
        batch.rectorSignedAt = block.timestamp;
        emit BatchSignedByRector(batchId, msg.sender, block.timestamp);
    }

    /**
     * @notice Admin mints all diplomas in a fully-approved batch.
     *         Reverts if the batch has expired or any matricule is already minted.
     */
    function mintBatch(
        uint256 batchId
    ) external onlyRole(ADMIN_ROLE) nonReentrant returns (uint256[] memory tokenIds) {
        Batch storage batch = _batches[batchId];
        if (block.timestamp > batch.expiresAt)             revert Batch_Expired(batchId);
        if (batch.status != BatchStatus.SignedByRector)
            revert Batch_InvalidStatus(batchId, batch.status, BatchStatus.SignedByRector);

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
                mention          : s.mention,
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

    /**
     * @notice Admin cancels a batch that has not yet been minted.
     *         A non-empty reason is mandatory for the audit trail.
     *         Works on Proposed, SignedByDean, SignedByRector — and even expired batches.
     */
    function cancelBatch(
        uint256 batchId,
        string calldata reason
    ) external onlyRole(ADMIN_ROLE) {
        Batch storage batch = _batches[batchId];
        BatchStatus st = batch.status;
        if (st == BatchStatus.Minted || st == BatchStatus.Cancelled)
            revert Batch_CannotCancel(batchId);
        if (bytes(reason).length == 0)
            revert Batch_MissingCancelReason();
        batch.status       = BatchStatus.Cancelled;
        batch.cancelReason = reason;
        emit BatchCancelled(batchId, msg.sender, reason);
    }

    // =========================================================================
    // Revocation
    // =========================================================================

    /**
     * @notice Admin revokes a diploma. A non-empty reason is required.
     *         The token stays in the student's wallet but is permanently marked invalid.
     */
    function revokeDiploma(
        uint256 tokenId,
        string calldata reason
    ) external onlyRole(ADMIN_ROLE) {
        if (_ownerOf(tokenId) == address(0))   revert Token_DoesNotExist(tokenId);
        if (!_diplomaRecords[tokenId].valid)   revert Token_AlreadyRevoked(tokenId);
        if (bytes(reason).length == 0)         revert Token_MissingRevocationReason();

        _diplomaRecords[tokenId].valid             = false;
        _diplomaRecords[tokenId].revocationReason  = reason;

        emit DiplomaRevoked(tokenId, msg.sender, reason, block.timestamp);
    }

    // =========================================================================
    // Public Verification
    // =========================================================================

    /**
     * @notice Verify the authenticity of a diploma and increment its verificationCount.
     *         Returns false if the diploma is revoked or the PDF hash mismatches.
     */
    function verifyDiploma(
        uint256 tokenId,
        bytes32 pdfHash
    ) external returns (bool isAuthentic) {
        if (_ownerOf(tokenId) == address(0)) revert Token_DoesNotExist(tokenId);

        DiplomaRecord storage rec = _diplomaRecords[tokenId];
        isAuthentic = rec.valid && (rec.sha256Hash == pdfHash);

        verificationCount[tokenId] += 1;
        emit DiplomaVerified(tokenId, msg.sender, isAuthentic, verificationCount[tokenId]);
    }

    // =========================================================================
    // View Functions
    // =========================================================================

    /**
     * @notice Returns all token IDs held by a student wallet.
     */
    function getStudentDiplomas(address student) external view returns (uint256[] memory) {
        return _studentTokens[student];
    }

    /**
     * @notice Returns true if a matricule already has a minted diploma.
     */
    function isMatriculeUsed(string calldata matricule) external view returns (bool) {
        return _matriculeUsed[matricule];
    }

    /**
     * @notice Returns the full on-chain record for a given token.
     */
    function getDiplomaRecord(uint256 tokenId) external view returns (DiplomaRecord memory) {
        if (_ownerOf(tokenId) == address(0)) revert Token_DoesNotExist(tokenId);
        return _diplomaRecords[tokenId];
    }

    /**
     * @notice Returns whether a diploma is still valid (not revoked).
     */
    function isDiplomaValid(uint256 tokenId) external view returns (bool) {
        if (_ownerOf(tokenId) == address(0)) revert Token_DoesNotExist(tokenId);
        return _diplomaRecords[tokenId].valid;
    }

    function getBatchStatus(uint256 batchId) external view returns (BatchStatus) {
        return _batches[batchId].status;
    }

    function getBatchStudentCount(uint256 batchId) external view returns (uint256) {
        return _batches[batchId].students.length;
    }

    function getBatchDescription(uint256 batchId) external view returns (string memory) {
        return _batches[batchId].description;
    }

    function getBatchExpiry(uint256 batchId) external view returns (uint256) {
        return _batches[batchId].expiresAt;
    }

    function getBatchCancelReason(uint256 batchId) external view returns (string memory) {
        return _batches[batchId].cancelReason;
    }

    function nextTokenId() external view returns (uint256) { return _nextTokenId; }
    function nextBatchId() external view returns (uint256) { return _nextBatchId; }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert Token_DoesNotExist(tokenId);
        return string(abi.encodePacked("ipfs://", _diplomaRecords[tokenId].metadataCID));
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
