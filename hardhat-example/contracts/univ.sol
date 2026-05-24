// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title  UniversityDiploma
 * @author University of Blida 1 — PFE Project (DiploChain)
 * @notice Soulbound NFT (ERC-721) for high-security diploma issuance
 * under the Algerian LMD system.
 *
 * ═══════════════════════════════════════════════════════════════════
 * AUTOMATED GATEKEEPER RULES:
 * To be proposed for a diploma, a student MUST have:
 * 1. Exactly 180 ECTS credits.
 * 2. A PFE Project Note >= 10.00.
 *
 * GOVERNANCE WORKFLOW:
 * PROPOSED → SIGNED_BY_DEAN → SIGNED_BY_RECTOR → FINALIZED (Minted)
 *
 * Batches expire after 7 days automatically.
 * ═══════════════════════════════════════════════════════════════════
 */
contract UniversityDiploma is ERC721, AccessControl, ReentrancyGuard {

    // =========================================================================
    // Constants & Roles
    // =========================================================================

    uint256 public constant PROPOSAL_EXPIRY = 7 days;
    uint256 public constant MAX_BATCH_SIZE  = 150;
    
    // Grades stored as uint16 scaled ×100 (e.g., 10.00 stored as 1000)
    uint16  public constant PASS_GRADE       = 1000;
    uint16  public constant REQUIRED_CREDITS = 180;

    bytes32 public constant ADMIN_ROLE  = keccak256("ADMIN_ROLE");
    bytes32 public constant DEAN_ROLE   = keccak256("DEAN_ROLE");
    bytes32 public constant RECTOR_ROLE = keccak256("RECTOR_ROLE");

    // =========================================================================
    // Enumerations & Structs
    // =========================================================================

    enum BatchStatus {
        Proposed,       // 0 — submitted by admin, awaiting dean
        SignedByDean,   // 1 — dean approved, awaiting rector
        SignedByRector, // 2 — fully approved, ready to finalize/mint
        Finalized,      // 3 — NFTs minted
        Cancelled       // 4 — cancelled before finalization
    }

    struct StudentEntry {
        address wallet;
        string  studentName;
        string  matricule;
        string  department;
        uint16  graduationYear;
        uint16  totalCredits; // Must equal 180
        uint16  pfeNote;      // Must be >= 1000
        string  ipfsCID;      // The IPFS hash containing the PDF diploma and metadata
    }

    struct Batch {
        BatchStatus status;
        address     proposer;
        uint256     proposedAt;
        uint256     expiresAt;
        uint256     deanSignedAt;
        uint256     rectorSignedAt;
        uint256     finalizedAt;
        string      description;
        string      cancelReason;
        uint256     studentCount;
        mapping(uint256 => StudentEntry) students;
    }

    struct DiplomaRecord {
        string  studentName;
        string  matricule;
        string  department;
        uint16  graduationYear;
        uint16  pfeNote;
        string  ipfsCID;
        uint256 batchId;
        uint256 mintedAt;
        bool    valid;
        string  revocationReason;
    }

    // =========================================================================
    // State Variables
    // =========================================================================

    uint256 private _nextTokenId;
    uint256 private _nextBatchId;

    mapping(uint256 => Batch) private _batches;
    mapping(uint256 => DiplomaRecord) private _diplomaRecords;
    
    mapping(string => bool) private _matriculeUsed;
    mapping(string => uint256) private _matriculeToToken;
    mapping(address => uint256[]) private _studentTokens;

    // =========================================================================
    // Events & Errors
    // =========================================================================

    event BatchProposed(uint256 indexed batchId, address indexed proposer, uint256 studentCount);
    event BatchSignedByDean(uint256 indexed batchId, address indexed dean);
    event BatchSignedByRector(uint256 indexed batchId, address indexed rector);
    event BatchFinalized(uint256 indexed batchId, uint256 diplomasMinted);
    event BatchCancelled(uint256 indexed batchId, address indexed cancelledBy, string reason);
    event DiplomaRevoked(uint256 indexed tokenId, address indexed revokedBy, string reason);

    error SBT_TransferNotAllowed();
    error Rule_InsufficientCredits(string matricule, uint16 provided);
    error Rule_FailedPFE(string matricule, uint16 note);
    error Batch_InvalidStatus();
    error Batch_Expired(uint256 batchId);
    error Batch_MatriculeAlreadyMinted(string matricule);
    error Diploma_NotFound(string matricule);

    // =========================================================================
    // Constructor & Overrides
    // =========================================================================

    constructor(address admin) ERC721("UniversityDiploma", "UDIP") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    // Block all transfers (Soulbound Token)
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0)) revert SBT_TransferNotAllowed();
        return super._update(to, tokenId, auth);
    }

    // =========================================================================
    // STEP 1: Automated Gatekeeper & Batch Proposal
    // =========================================================================

    function proposeBatch(
        StudentEntry[] calldata inputs,
        string calldata description
    ) external onlyRole(ADMIN_ROLE) returns (uint256 batchId) {
        require(inputs.length > 0 && inputs.length <= MAX_BATCH_SIZE, "Invalid batch size");

        batchId = _nextBatchId++;
        Batch storage batch = _batches[batchId];
        
        batch.status       = BatchStatus.Proposed;
        batch.proposer     = msg.sender;
        batch.proposedAt   = block.timestamp;
        batch.expiresAt    = block.timestamp + PROPOSAL_EXPIRY;
        batch.description  = description;
        batch.studentCount = inputs.length;

        for (uint256 i = 0; i < inputs.length; i++) {
            StudentEntry calldata s = inputs[i];
            
            // 🚨 AUTOMATED SMART CONTRACT RULES ENFORCEMENT
            if (s.totalCredits != REQUIRED_CREDITS) revert Rule_InsufficientCredits(s.matricule, s.totalCredits);
            if (s.pfeNote < PASS_GRADE) revert Rule_FailedPFE(s.matricule, s.pfeNote);
            if (_matriculeUsed[s.matricule]) revert Batch_MatriculeAlreadyMinted(s.matricule);

            batch.students[i] = s;
        }

        emit BatchProposed(batchId, msg.sender, inputs.length);
    }

    // =========================================================================
    // STEP 2 & 3: Governance Signatures
    // =========================================================================

    function signByDean(uint256 batchId) external onlyRole(DEAN_ROLE) {
        Batch storage batch = _batches[batchId];
        if (block.timestamp > batch.expiresAt) revert Batch_Expired(batchId);
        if (batch.status != BatchStatus.Proposed) revert Batch_InvalidStatus();

        batch.status = BatchStatus.SignedByDean;
        batch.deanSignedAt = block.timestamp;
        emit BatchSignedByDean(batchId, msg.sender);
    }

    function signByRector(uint256 batchId) external onlyRole(RECTOR_ROLE) {
        Batch storage batch = _batches[batchId];
        if (block.timestamp > batch.expiresAt) revert Batch_Expired(batchId);
        if (batch.status != BatchStatus.SignedByDean) revert Batch_InvalidStatus();

        batch.status = BatchStatus.SignedByRector;
        batch.rectorSignedAt = block.timestamp;
        emit BatchSignedByRector(batchId, msg.sender);
    }

    // =========================================================================
    // STEP 4: Finalization & Minting
    // =========================================================================

    function finalizeBatch(
        uint256 batchId,
        string[] calldata ipfsCIDs
    ) external onlyRole(ADMIN_ROLE) nonReentrant {
        Batch storage batch = _batches[batchId];
        if (block.timestamp > batch.expiresAt) revert Batch_Expired(batchId);
        if (batch.status != BatchStatus.SignedByRector) revert Batch_InvalidStatus();
        if (ipfsCIDs.length != batch.studentCount) revert Batch_InvalidStatus();

        uint256 total = batch.studentCount;

        for (uint256 i = 0; i < total; i++) {
            StudentEntry storage s = batch.students[i];
            s.ipfsCID = ipfsCIDs[i];

            // Double check just in case a matricule was minted in a different batch concurrently
            if (_matriculeUsed[s.matricule]) revert Batch_MatriculeAlreadyMinted(s.matricule);

            uint256 tokenId = _nextTokenId++;
            _safeMint(s.wallet, tokenId);

            _diplomaRecords[tokenId] = DiplomaRecord({
                studentName:    s.studentName,
                matricule:      s.matricule,
                department:     s.department,
                graduationYear: s.graduationYear,
                pfeNote:        s.pfeNote,
                ipfsCID:        s.ipfsCID,
                batchId:        batchId,
                mintedAt:       block.timestamp,
                valid:          true,
                revocationReason: ""
            });

            _matriculeUsed[s.matricule] = true;
            _matriculeToToken[s.matricule] = tokenId;
            _studentTokens[s.wallet].push(tokenId);
        }

        batch.status = BatchStatus.Finalized;
        batch.finalizedAt = block.timestamp;
        
        emit BatchFinalized(batchId, total);
    }

    // =========================================================================
    // Admin Utilities (Cancel & Revoke)
    // =========================================================================

    function cancelBatch(uint256 batchId, string calldata reason) external onlyRole(ADMIN_ROLE) {
        Batch storage batch = _batches[batchId];
        BatchStatus st = batch.status;
        
        require(st != BatchStatus.Finalized && st != BatchStatus.Cancelled, "Cannot cancel");
        require(bytes(reason).length > 0, "Missing reason");

        batch.status = BatchStatus.Cancelled;
        batch.cancelReason = reason;
        emit BatchCancelled(batchId, msg.sender, reason);
    }

    function revokeDiploma(uint256 tokenId, string calldata reason) external onlyRole(ADMIN_ROLE) {
        require(_diplomaRecords[tokenId].valid, "Already revoked or does not exist");
        require(bytes(reason).length > 0, "Missing reason");

        _diplomaRecords[tokenId].valid = false;
        _diplomaRecords[tokenId].revocationReason = reason;
        emit DiplomaRevoked(tokenId, msg.sender, reason);
    }

    // =========================================================================
    // Views & Verification
    // =========================================================================

    /**
     * @notice Verify a diploma's authenticity using the student's Matricule and IPFS CID.
     */
    function verifyDiploma(
        string calldata matricule,
        string calldata providedCID
    ) external view returns (bool isAuthentic, bool isValid) {
        if (!_matriculeUsed[matricule]) revert Diploma_NotFound(matricule);
        
        uint256 tokenId = _matriculeToToken[matricule];
        DiplomaRecord storage rec = _diplomaRecords[tokenId];
        
        isValid = rec.valid;
        
        // Compare the stored IPFS CID with the provided one
        bool cidMatches = keccak256(abi.encodePacked(rec.ipfsCID)) == 
                          keccak256(abi.encodePacked(providedCID));
        
        isAuthentic = rec.valid && cidMatches;
    }

    /**
     * @notice Fetch the entire on-chain diploma record using just the Matricule.
     */
    function getDiplomaByMatricule(
        string calldata matricule
    ) external view returns (DiplomaRecord memory) {
        if (!_matriculeUsed[matricule]) revert Diploma_NotFound(matricule);
        
        uint256 tokenId = _matriculeToToken[matricule];
        return _diplomaRecords[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_diplomaRecords[tokenId].valid, "Token is revoked or invalid");
        return string(abi.encodePacked("ipfs://", _diplomaRecords[tokenId].ipfsCID));
    }
    
    function getDiplomaRecord(uint256 tokenId) external view returns (DiplomaRecord memory) {
        return _diplomaRecords[tokenId];
    }
    
    function getTokenByMatricule(string calldata matricule) external view returns (uint256 tokenId, bool exists) {
        exists = _matriculeUsed[matricule];
        tokenId = _matriculeToToken[matricule];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}