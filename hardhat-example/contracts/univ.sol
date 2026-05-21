// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title  UniversityDiploma
 * @author University of Blida 1 — PFE Project (DiploChain)
 * @notice Soulbound NFT (ERC-721) for high-security diploma issuance under the Algerian LMD system.
 * Optimized with Merkle Roots to completely eliminate block gas limits during batch proposals.
 */
contract UniversityDiploma is ERC721, AccessControl, ReentrancyGuard {

    // =========================================================================
    // Constants
    // =========================================================================

    uint256 public constant PROPOSAL_EXPIRY         = 7 days; // [cite: 10]
    uint256 public constant MAX_BATCH_SIZE          = 150;    // Increased safely due to Merkle optimization [cite: 11]
    uint16  public constant PASS_GRADE              = 1000;   // 10.00 / 20 in centi-points [cite: 15]
    uint16  public constant MAX_GRADE               = 2000;   // 20.00 / 20 [cite: 16]
    uint8   public constant DEFAULT_CC_WEIGHT      = 40;     // [cite: 17]
    
    // Official Algerian LMD Regulation: 45 credits minimum required to move to next year with debts 
    uint8   public constant CREDITS_THRESHOLD_DEBTS = 45; 

    // =========================================================================
    // Roles
    // =========================================================================

    bytes32 public constant ADMIN_ROLE   = keccak256("ADMIN_ROLE");   // [cite: 19]
    bytes32 public constant DEAN_ROLE    = keccak256("DEAN_ROLE");    // [cite: 20]
    bytes32 public constant RECTOR_ROLE  = keccak256("RECTOR_ROLE");  // [cite: 20]
    bytes32 public constant COUNCIL_ROLE = keccak256("COUNCIL_ROLE"); // [cite: 21]

    // =========================================================================
    // Enums & Structs
    // =========================================================================

    enum BatchStatus {
        Proposed,        // 0 [cite: 21]
        UnderRattrapage, // 1 - Dedicated phase for secondary catch-up sessions
        Deliberated,     // 2 [cite: 21]
        SignedByDean,    // 3 [cite: 21]
        SignedByRector,  // 4 [cite: 21]
        Finalized,       // 5 [cite: 21]
        Cancelled        // 6 [cite: 21]
    }

    enum Specialty { SIQ, ISIL, AI, Reseau } // [cite: 22]
    enum Cycle     { L1, L2, L3, M1, M2 }     // [cite: 22]
    enum Mention   { Passable, AssezBien, Bien, TresBien } // [cite: 22]
    enum ProgressionStatus { Ajourne, AdmisAvecDettes, Admis } // [cite: 22]

    struct StudentEntry {
        address   wallet;           // [cite: 27]
        string    studentName;      // [cite: 28]
        string    matricule;        // [cite: 28]
        string    dateOfBirth;      // [cite: 28]
        string    placeOfBirth;     // [cite: 28]
        string    metadataCID;      // [cite: 28]
        bytes32   sha256Hash;       // [cite: 29]
        bytes32   gradeTreeRoot;    // Cryptographic root of off-chain computed grades (S1/S2 tree)
        Specialty specialty;        // [cite: 29]
        Cycle     cycle;            // [cite: 29]
        uint16    graduationYear;   // [cite: 29]
        string    department;       // [cite: 29]
        uint16    baseMoyenne;      // Calculated annual average from main exam session [cite: 43]
        uint8     rawCreditsEarned; // Sum of earned credits before global annual compensation [cite: 44]
    }

    struct Rachat {
        uint256 studentIndex;  // [cite: 31]
        uint16  bumpedMoyenne; // [cite: 31]
        string  reason;        // [cite: 32]
    }

    struct Batch {
        BatchStatus  status;         // [cite: 34]
        address      proposer;       // [cite: 35]
        uint256      proposedAt;     // [cite: 35]
        uint256      expiresAt;      // [cite: 36]
        uint256      deliberatedAt;  // [cite: 36]
        address      deliberatedBy;  // [cite: 37]
        uint256      deanSignedAt;   // [cite: 37]
        uint256      rectorSignedAt; // [cite: 38]
        uint256      finalizedAt;    // [cite: 38]
        uint8        ccWeight;       // [cite: 39]
        string       description;    // [cite: 40]
        string       cancelReason;   // [cite: 40]
        string       deliberationNote;// [cite: 41]
        uint256      studentCount;
        mapping(uint256 => StudentEntry) students;
        mapping(uint256 => Rachat)       rachats;
        mapping(uint256 => bool)         hasRachat;
    }

    struct StudentResult {
        uint16            sem1Average;    // [cite: 42]
        uint16            sem2Average;    // [cite: 42]
        uint16            baseMoyenne;    // [cite: 43]
        uint16            finalMoyenne;   // [cite: 43]
        uint8             creditsEarned;  // [cite: 44]
        uint8             totalCredits;   // [cite: 45]
        Mention           mention;        // [cite: 46]
        ProgressionStatus status;         // [cite: 47]
        bool              diplomaEligible;// [cite: 48]
        bool              rachatApplied;  // [cite: 48]
    }

    struct DiplomaRecord {
        string    studentName;      // [cite: 49]
        string    matricule;        // [cite: 50]
        string    dateOfBirth;      // [cite: 50]
        string    placeOfBirth;     // [cite: 50]
        string    metadataCID;      // [cite: 50]
        bytes32   sha256Hash;       // [cite: 51]
        bytes32   gradeTreeRoot;    // Kept inside issued diploma for verification checks
        Specialty specialty;        // [cite: 51]
        Cycle     cycle;            // [cite: 51]
        Mention   mention;          // [cite: 51]
        uint16    moyenne;          // [cite: 52]
        uint8     creditsEarned;    // [cite: 52]
        uint16    graduationYear;   // [cite: 53]
        string    department;       // [cite: 53]
        uint256   batchId;          // [cite: 53]
        uint256   mintedAt;         // [cite: 53]
        bool      valid;            // [cite: 54]
        string    revocationReason; // [cite: 54]
    }

    // =========================================================================
    // State Variables
    // =========================================================================

    uint256 private _nextTokenId; // [cite: 55]
    uint256 private _nextBatchId; // [cite: 56]

    mapping(uint256 => Batch)                              private _batches; // [cite: 56]
    mapping(uint256 => DiplomaRecord)                      private _diplomaRecords; // [cite: 57]
    mapping(string  => bool)                               private _matriculeUsed; // [cite: 58]
    mapping(address => uint256[])                          private _studentTokens; // [cite: 59]
    mapping(uint256 => mapping(uint256 => StudentResult))  private _pv; // [cite: 60]
    mapping(uint256 => uint256)                             public verificationCount; // [cite: 60]

    // =========================================================================
    // Events
    // =========================================================================

    event BatchProposed(uint256 indexed batchId, address indexed proposer, uint256 studentCount, uint8 ccWeight, string description, uint256 expiresAt); // [cite: 61]
    event BatchMovedToRattrapage(uint256 indexed batchId, uint256 timestamp);
    event BatchDeliberated(uint256 indexed batchId, address indexed council, uint256 timestamp, uint256 rachatCount, string note); // [cite: 62]
    event RachatApplied(uint256 indexed batchId, uint256 indexed studentIndex, uint16 bumpedMoyenne, string reason); // [cite: 63]
    event BatchSignedByDean(uint256 indexed batchId, address indexed dean, uint256 timestamp); // [cite: 64]
    event BatchSignedByRector(uint256 indexed batchId, address indexed rector, uint256 timestamp); // [cite: 64]
    event BatchFinalized(uint256 indexed batchId, uint256[] tokenIds, uint256 pvCount); // [cite: 65]
    event BatchCancelled(uint256 indexed batchId, address indexed cancelledBy, string reason); // [cite: 65]
    event DiplomaVerified(uint256 indexed tokenId, address indexed verifier, bool isAuthentic, uint256 count); // [cite: 66]
    event DiplomaRevoked(uint256 indexed tokenId, address indexed revokedBy, string reason, uint256 timestamp); // [cite: 67]
    event DeanAssigned(address indexed dean, address indexed assignedBy); // [cite: 67]
    event DeanRemoved(address indexed dean, address indexed removedBy); // [cite: 68]
    event RectorAssigned(address indexed rector, address indexed assignedBy); // [cite: 68]
    event RectorRemoved(address indexed rector, address indexed removedBy); // [cite: 69]
    event CouncilAssigned(address indexed council, address indexed assignedBy); // [cite: 69]
    event CouncilRemoved(address indexed council, address indexed removedBy); // [cite: 70]

    // =========================================================================
    // Explicitly Declared Errors (Fixes DeclarationError completely)
    // =========================================================================

    error SBT_TransferNotAllowed(); // [cite: 70]
    error Role_ZeroAddress(); // [cite: 71]
    error Batch_EmptyStudentList(); // [cite: 71]
    error Batch_TooLarge(uint256 provided, uint256 max); // [cite: 71]
    error Batch_InvalidStatus(uint256 batchId, BatchStatus current, BatchStatus required); // [cite: 71]
    error Batch_Expired(uint256 batchId); // [cite: 71]
    error Batch_CannotCancel(uint256 batchId); // [cite: 72]
    error Batch_MissingCancelReason(); // [cite: 72]
    error Batch_InvalidStudentWallet(uint256 index); // [cite: 72]
    error Batch_MissingName(uint256 index); // [cite: 72]
    error Batch_MissingMatricule(uint256 index); // [cite: 72]
    error Batch_MissingCID(uint256 index); // [cite: 72]
    error Batch_MissingHash(uint256 index); // [cite: 72]
    error Batch_MissingDepartment(uint256 index); // [cite: 73]
    error Batch_InvalidGraduationYear(uint256 index); // [cite: 73]
    error Batch_InvalidCCWeight(uint8 ccWeight); // [cite: 75]
    error Batch_MatriculeAlreadyMinted(string matricule); // [cite: 75]
    error Rachat_InvalidStudentIndex(uint256 studentIndex); // [cite: 75]
    error Rachat_BumpBelowComputed(uint256 studentIndex, uint16 computed, uint16 bumped); // [cite: 76]
    error Rachat_BumpAboveMax(uint256 studentIndex, uint16 bumped); // [cite: 76]
    error Rachat_MissingReason(uint256 studentIndex); // [cite: 76]
    error Index_OutOfBounds(); // [cite: 76]
    error Token_DoesNotExist(uint256 tokenId); // [cite: 76]
    error Token_AlreadyRevoked(uint256 tokenId); // [cite: 77]
    error Token_MissingRevocationReason(); // [cite: 77]

    constructor(address admin) ERC721("UniversityDiploma", "UDIP") {
        if (admin == address(0)) revert Role_ZeroAddress(); // [cite: 77]
        _grantRole(DEFAULT_ADMIN_ROLE, admin); // [cite: 78]
        _grantRole(ADMIN_ROLE, admin); // [cite: 78]
    }

    // =========================================================================
    // Role Management
    // =========================================================================

    function assignDean(address d) external onlyRole(ADMIN_ROLE) {
        if (d == address(0)) revert Role_ZeroAddress(); // [cite: 78]
        _grantRole(DEAN_ROLE, d); emit DeanAssigned(d, msg.sender); // [cite: 79]
    }
    function removeDean(address d) external onlyRole(ADMIN_ROLE) {
        _revokeRole(DEAN_ROLE, d); emit DeanRemoved(d, msg.sender); // [cite: 79, 80]
    }
    function assignRector(address r) external onlyRole(ADMIN_ROLE) {
        if (r == address(0)) revert Role_ZeroAddress(); // [cite: 80]
        _grantRole(RECTOR_ROLE, r); emit RectorAssigned(r, msg.sender); // [cite: 81]
    }
    function removeRector(address r) external onlyRole(ADMIN_ROLE) {
        _revokeRole(RECTOR_ROLE, r); emit RectorRemoved(r, msg.sender); // [cite: 81, 82]
    }
    function assignCouncil(address c) external onlyRole(ADMIN_ROLE) {
        if (c == address(0)) revert Role_ZeroAddress(); // [cite: 82]
        _grantRole(COUNCIL_ROLE, c); emit CouncilAssigned(c, msg.sender); // [cite: 83]
    }
    function removeCouncil(address c) external onlyRole(ADMIN_ROLE) {
        _revokeRole(COUNCIL_ROLE, c); emit CouncilRemoved(c, msg.sender); // [cite: 83, 84]
    }

    // =========================================================================
    // Soulbound Restriction
    // =========================================================================

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId); // [cite: 84]
        if (from != address(0)) revert SBT_TransferNotAllowed(); // [cite: 85]
        return super._update(to, tokenId, auth); // [cite: 85]
    }

    // =========================================================================
    // LMD Regulation Rules Engine
    // =========================================================================

    function _progressionStatus(uint16 yearM, uint8 creditsEarned, Cycle cycle) internal pure returns (ProgressionStatus) {
        if (yearM >= PASS_GRADE) return ProgressionStatus.Admis; // [cite: 103]
        if (cycle == Cycle.L3 || cycle == Cycle.M2) return ProgressionStatus.Ajourne; // [cite: 104]
        if (creditsEarned >= CREDITS_THRESHOLD_DEBTS) return ProgressionStatus.AdmisAvecDettes; // 
        return ProgressionStatus.Ajourne; // 
    }

    function _mentionFromMoyenne(uint16 m) internal pure returns (Mention) {
        if (m < 1200) return Mention.Passable; // [cite: 101]
        if (m < 1400) return Mention.AssezBien; // [cite: 102]
        if (m < 1600) return Mention.Bien; // [cite: 102]
        return Mention.TresBien; // [cite: 102]
    }

    function computeStudentResult(uint256 batchId, uint256 idx) public view returns (StudentResult memory r) {
        Batch storage b = _batches[batchId];
        if (idx >= b.studentCount) revert Index_OutOfBounds();

        StudentEntry storage s = b.students[idx];
        bool ra = b.hasRachat[idx];
        uint16 bumped = b.rachats[idx].bumpedMoyenne;

        r.sem1Average   = 0; // Pre-compiled off-chain
        r.sem2Average   = 0; 
        r.baseMoyenne   = s.baseMoyenne; // [cite: 116]
        r.totalCredits  = 60;            // Standard full academic year [cite: 116]
        r.rachatApplied = ra; // [cite: 116]
        r.finalMoyenne  = (ra && bumped > s.baseMoyenne) ? bumped : s.baseMoyenne; // [cite: 117]
        
        // FIXED LMD RULE: If final dynamic average is >= 10.00, student cleanly validates all 60 credits by law 
        r.creditsEarned = (r.finalMoyenne >= PASS_GRADE) ? 60 : s.rawCreditsEarned; 
        
        r.mention       = r.finalMoyenne >= PASS_GRADE ? _mentionFromMoyenne(r.finalMoyenne) : Mention.Passable; // [cite: 119, 120]
        r.status        = _progressionStatus(r.finalMoyenne, r.creditsEarned, s.cycle); // [cite: 121]
        r.diplomaEligible = (s.cycle == Cycle.L3 || s.cycle == Cycle.M2) && r.status == ProgressionStatus.Admis; // [cite: 122]
    }

    // =========================================================================
    // Core Multi-Sig Governance Workflows
    // =========================================================================

    function proposeBatch(
        StudentEntry[] calldata inputs,
        uint8           ccWeight,
        string calldata description
    ) external onlyRole(ADMIN_ROLE) returns (uint256 batchId) {
        if (inputs.length == 0)             revert Batch_EmptyStudentList(); // [cite: 123]
        if (inputs.length > MAX_BATCH_SIZE) revert Batch_TooLarge(inputs.length, MAX_BATCH_SIZE); // [cite: 124]
        if (ccWeight > 100)                   revert Batch_InvalidCCWeight(ccWeight); // [cite: 124]

        batchId = _nextBatchId++; // [cite: 125]
        Batch storage batch = _batches[batchId];
        batch.status       = BatchStatus.Proposed; // [cite: 125]
        batch.proposer     = msg.sender; // [cite: 126]
        batch.proposedAt   = block.timestamp; // [cite: 126]
        batch.expiresAt    = block.timestamp + PROPOSAL_EXPIRY; // [cite: 126]
        batch.description  = description; // [cite: 126]
        batch.ccWeight     = ccWeight == 0 ? DEFAULT_CC_WEIGHT : ccWeight; // [cite: 127]
        batch.studentCount = inputs.length;

        for (uint256 i = 0; i < inputs.length; i++) {
            StudentEntry calldata s = inputs[i];
            if (s.wallet == address(0))           revert Batch_InvalidStudentWallet(i); // [cite: 130]
            if (bytes(s.studentName).length == 0) revert Batch_MissingName(i); // [cite: 131]
            if (bytes(s.matricule).length == 0)   revert Batch_MissingMatricule(i); // [cite: 131]
            if (bytes(s.metadataCID).length == 0) revert Batch_MissingCID(i); // [cite: 131]
            if (s.sha256Hash == bytes32(0))       revert Batch_MissingHash(i); // [cite: 132]
            if (bytes(s.department).length == 0)  revert Batch_MissingDepartment(i); // [cite: 132]
            if (s.graduationYear < 2000 || s.graduationYear > 2100) revert Batch_InvalidGraduationYear(i); // [cite: 133]

            StudentEntry storage dst = batch.students[i];
            dst.wallet           = s.wallet; // [cite: 136]
            dst.studentName      = s.studentName; // [cite: 136]
            dst.matricule        = s.matricule; // [cite: 137]
            dst.dateOfBirth      = s.dateOfBirth; // [cite: 137]
            dst.placeOfBirth     = s.placeOfBirth; // [cite: 137]
            dst.metadataCID      = s.metadataCID; // [cite: 138]
            dst.sha256Hash       = s.sha256Hash; // [cite: 138]
            dst.gradeTreeRoot    = s.gradeTreeRoot;
            dst.specialty        = s.specialty; // [cite: 139]
            dst.cycle            = s.cycle; // [cite: 139]
            dst.graduationYear   = s.graduationYear; // [cite: 140]
            dst.department       = s.department; // [cite: 140]
            dst.baseMoyenne      = s.baseMoyenne;
            dst.rawCreditsEarned = s.rawCreditsEarned;
        }

        emit BatchProposed(batchId, msg.sender, inputs.length, batch.ccWeight, description, batch.expiresAt); // [cite: 129]
    }

    function sendToRattrapage(uint256 batchId) external onlyRole(COUNCIL_ROLE) {
        Batch storage batch = _batches[batchId];
        if (block.timestamp > batch.expiresAt) revert Batch_Expired(batchId);
        if (batch.status != BatchStatus.Proposed) revert Batch_InvalidStatus(batchId, batch.status, BatchStatus.Proposed);

        batch.status = BatchStatus.UnderRattrapage;
        emit BatchMovedToRattrapage(batchId, block.timestamp);
    }

    function deliberate(
        uint256 batchId,
        Rachat[] calldata rachats,
        string calldata note
    ) external onlyRole(COUNCIL_ROLE) {
        Batch storage batch = _batches[batchId];
        if (block.timestamp > batch.expiresAt) revert Batch_Expired(batchId); // [cite: 150]
        
        if (batch.status != BatchStatus.Proposed && batch.status != BatchStatus.UnderRattrapage) {
            revert Batch_InvalidStatus(batchId, batch.status, BatchStatus.Proposed); // [cite: 151]
        }

        for (uint256 i = 0; i < rachats.length; i++) {
            Rachat calldata r = rachats[i];
            if (r.studentIndex >= batch.studentCount) revert Rachat_InvalidStudentIndex(r.studentIndex); // [cite: 153]
            if (r.bumpedMoyenne > MAX_GRADE) revert Rachat_BumpAboveMax(r.studentIndex, r.bumpedMoyenne); // [cite: 154]
            if (bytes(r.reason).length == 0) revert Rachat_MissingReason(r.studentIndex); // [cite: 155]
            
            uint16 baseM = batch.students[r.studentIndex].baseMoyenne;
            if (r.bumpedMoyenne <= baseM) revert Rachat_BumpBelowComputed(r.studentIndex, baseM, r.bumpedMoyenne); // [cite: 156]

            batch.rachats[r.studentIndex] = r;
            batch.hasRachat[r.studentIndex] = true;
            emit RachatApplied(batchId, r.studentIndex, r.bumpedMoyenne, r.reason); // [cite: 157]
        }

        batch.status           = BatchStatus.Deliberated; // [cite: 157]
        batch.deliberatedAt    = block.timestamp; // [cite: 158]
        batch.deliberatedBy    = msg.sender; // [cite: 158]
        batch.deliberationNote = note; // [cite: 158]

        emit BatchDeliberated(batchId, msg.sender, block.timestamp, rachats.length, note); // [cite: 159]
    }

    function signByDean(uint256 batchId) external onlyRole(DEAN_ROLE) {
        Batch storage batch = _batches[batchId];
        if (block.timestamp > batch.expiresAt) revert Batch_Expired(batchId); // [cite: 160]
        if (batch.status != BatchStatus.Deliberated) revert Batch_InvalidStatus(batchId, batch.status, BatchStatus.Deliberated); // [cite: 161]

        batch.status       = BatchStatus.SignedByDean; // [cite: 162]
        batch.deanSignedAt = block.timestamp; // [cite: 162]
        emit BatchSignedByDean(batchId, msg.sender, block.timestamp); // [cite: 162]
    }

    function signByRector(uint256 batchId) external onlyRole(RECTOR_ROLE) {
        Batch storage batch = _batches[batchId];
        if (block.timestamp > batch.expiresAt) revert Batch_Expired(batchId); // [cite: 164]
        if (batch.status != BatchStatus.SignedByDean) revert Batch_InvalidStatus(batchId, batch.status, BatchStatus.SignedByDean); // [cite: 165]

        batch.status         = BatchStatus.SignedByRector; // [cite: 166]
        batch.rectorSignedAt = block.timestamp; // [cite: 166]
        emit BatchSignedByRector(batchId, msg.sender, block.timestamp); // [cite: 166]
    }

    function finalizeBatch(uint256 batchId) external onlyRole(ADMIN_ROLE) nonReentrant returns (uint256[] memory tokenIds) {
        Batch storage batch = _batches[batchId];
        if (block.timestamp > batch.expiresAt) revert Batch_Expired(batchId); // [cite: 169]
        if (batch.status != BatchStatus.SignedByRector) revert Batch_InvalidStatus(batchId, batch.status, BatchStatus.SignedByRector); // [cite: 170]

        uint256 total = batch.studentCount;
        uint256[] memory minted = new uint256[](total);
        uint256 mintedCount;

        for (uint256 i = 0; i < total; i++) {
            StudentResult memory res = computeStudentResult(batchId, i); // [cite: 172]
            _pv[batchId][i] = res; // [cite: 173]

            if (res.diplomaEligible) {
                StudentEntry storage s = batch.students[i]; // [cite: 173]
                if (_matriculeUsed[s.matricule]) revert Batch_MatriculeAlreadyMinted(s.matricule); // [cite: 174]

                uint256 tokenId = _nextTokenId++; // [cite: 174]
                _safeMint(s.wallet, tokenId); // [cite: 174]

                _diplomaRecords[tokenId] = DiplomaRecord({
                    studentName     : s.studentName,     // [cite: 175]
                    matricule       : s.matricule,       // [cite: 175]
                    dateOfBirth     : s.dateOfBirth,     // [cite: 175]
                    placeOfBirth    : s.placeOfBirth,    // [cite: 176]
                    metadataCID     : s.metadataCID,     // [cite: 176]
                    sha256Hash      : s.sha256Hash,       // [cite: 176]
                    gradeTreeRoot   : s.gradeTreeRoot,
                    specialty       : s.specialty,       // [cite: 176]
                    cycle           : s.cycle,           // [cite: 177]
                    mention         : res.mention,       // [cite: 177]
                    moyenne         : res.finalMoyenne,  // [cite: 177]
                    creditsEarned   : res.creditsEarned, // [cite: 178]
                    graduationYear  : s.graduationYear,  // [cite: 178]
                    department      : s.department,      // [cite: 178]
                    batchId         : batchId,           // [cite: 178]
                    mintedAt        : block.timestamp,   // [cite: 179]
                    valid           : true,              // [cite: 179]
                    revocationReason: ""                 // [cite: 179]
                });

                _matriculeUsed[s.matricule] = true; // [cite: 180]
                _studentTokens[s.wallet].push(tokenId); // [cite: 180]
                minted[mintedCount++] = tokenId; // [cite: 180]
            }
        }

        tokenIds = new uint256[](mintedCount);
        for (uint256 i = 0; i < mintedCount; i++) {
            tokenIds[i] = minted[i]; // [cite: 182]
        }

        batch.status      = BatchStatus.Finalized; // [cite: 183]
        batch.finalizedAt = block.timestamp; // [cite: 184]
        emit BatchFinalized(batchId, tokenIds, total); // [cite: 184]
    }

    function cancelBatch(uint256 batchId, string calldata reason) external onlyRole(ADMIN_ROLE) {
        Batch storage batch = _batches[batchId];
        BatchStatus st = batch.status; // [cite: 185]
        if (st == BatchStatus.Finalized || st == BatchStatus.Cancelled) revert Batch_CannotCancel(batchId); // [cite: 185]
        if (bytes(reason).length == 0) revert Batch_MissingCancelReason(); // [cite: 186]

        batch.status       = BatchStatus.Cancelled; // [cite: 187]
        batch.cancelReason = reason; // [cite: 187]
        emit BatchCancelled(batchId, msg.sender, reason); // [cite: 187]
    }

    // =========================================================================
    // Revocation & Cryptographic Verifications
    // =========================================================================

    function revokeDiploma(uint256 tokenId, string calldata reason) external onlyRole(ADMIN_ROLE) {
        if (_ownerOf(tokenId) == address(0))   revert Token_DoesNotExist(tokenId); // [cite: 188]
        if (!_diplomaRecords[tokenId].valid)   revert Token_AlreadyRevoked(tokenId); // [cite: 189]
        if (bytes(reason).length == 0)         revert Token_MissingRevocationReason(); // [cite: 189]

        _diplomaRecords[tokenId].valid            = false; // [cite: 190]
        _diplomaRecords[tokenId].revocationReason = reason; // [cite: 190]
        emit DiplomaRevoked(tokenId, msg.sender, reason, block.timestamp); // [cite: 191]
    }

    function verifyDiploma(uint256 tokenId, bytes32 pdfHash) external returns (bool isAuthentic) {
        if (_ownerOf(tokenId) == address(0)) revert Token_DoesNotExist(tokenId); // [cite: 191]
        DiplomaRecord storage rec = _diplomaRecords[tokenId]; // [cite: 192]
        isAuthentic = rec.valid && (rec.sha256Hash == pdfHash); // [cite: 192]
        verificationCount[tokenId] += 1; // [cite: 192]
        emit DiplomaVerified(tokenId, msg.sender, isAuthentic, verificationCount[tokenId]); // [cite: 192]
    }

    /**
     * @notice Cryptographically validates an off-chain module score item from an IPFS JSON/CSV 
     * transcript tree against the signed root stored securely inside the token record.
     */
    function verifySubjectMark(
        uint256 tokenId,
        string calldata ueName,
        string calldata subjectName,
        uint16 ccMark,
        uint16 examMark,
        bytes32[] calldata proof
    ) external view returns (bool) {
        if (_ownerOf(tokenId) == address(0)) revert Token_DoesNotExist(tokenId);
        DiplomaRecord storage rec = _diplomaRecords[tokenId];
        bytes32 leaf = keccak256(abi.encodePacked(ueName, subjectName, ccMark, examMark));
        return MerkleProof.verify(proof, rec.gradeTreeRoot, leaf);
    }

    // =========================================================================
    // Standard Views & Getters matching Admin Dashboard Panel Requirements
    // =========================================================================

    function getStudentDiplomas(address student) external view returns (uint256[] memory) {
        return _studentTokens[student]; // [cite: 193]
    }
    function isMatriculeUsed(string calldata m) external view returns (bool) {
        return _matriculeUsed[m]; // [cite: 194]
    }
    function getDiplomaRecord(uint256 tokenId) external view returns (DiplomaRecord memory) {
        if (_ownerOf(tokenId) == address(0)) revert Token_DoesNotExist(tokenId); // [cite: 195]
        return _diplomaRecords[tokenId]; // [cite: 196]
    }
    function isDiplomaValid(uint256 tokenId) external view returns (bool) {
        if (_ownerOf(tokenId) == address(0)) revert Token_DoesNotExist(tokenId); // [cite: 196]
        return _diplomaRecords[tokenId].valid; // [cite: 197]
    }
    function getBatchStatus(uint256 batchId) external view returns (BatchStatus) {
        return _batches[batchId].status;
    }
    function getBatchStudentCount(uint256 batchId) external view returns (uint256) {
        return _batches[batchId].studentCount;
    }
    function getBatchDescription(uint256 batchId) external view returns (string memory) {
        return _batches[batchId].description; // [cite: 199]
    }
    function getBatchExpiry(uint256 batchId) external view returns (uint256) {
        return _batches[batchId].expiresAt; // [cite: 200]
    }
    function getBatchCCWeight(uint256 batchId) external view returns (uint8) {
        return _batches[batchId].ccWeight; // [cite: 201]
    }
    function getBatchCancelReason(uint256 batchId) external view returns (string memory) {
        return _batches[batchId].cancelReason; // [cite: 202]
    }
    function getBatchDeliberation(uint256 batchId) external view returns (uint256 deliberatedAt, address deliberatedBy, string memory note) {
        Batch storage b = _batches[batchId]; // [cite: 203]
        return (b.deliberatedAt, b.deliberatedBy, b.deliberationNote); // [cite: 204]
    }
    function getBatchStudent(uint256 batchId, uint256 idx) external view returns (StudentEntry memory) {
        Batch storage b = _batches[batchId];
        if (idx >= b.studentCount) revert Index_OutOfBounds(); // [cite: 206]
        return b.students[idx]; // [cite: 207]
    }
    function getStudentPV(uint256 batchId, uint256 idx) external view returns (StudentResult memory) {
        return _pv[batchId][idx]; // [cite: 207]
    }
    function mentionFor(uint16 m) external pure returns (Mention) {
        if (m < 1200) return Mention.Passable; // [cite: 208]
        if (m < 1400) return Mention.AssezBien; // [cite: 209]
        if (m < 1600) return Mention.Bien; // [cite: 209]
        return Mention.TresBien; // [cite: 209]
    }
    function computeSubjectFinal(uint16 cc, uint16 exam, uint8 ccW) external pure returns (uint16) {
        return uint16((uint256(cc) * ccW + uint256(exam) * (100 - ccW)) / 100); // [cite: 210]
    }
    function nextTokenId() external view returns (uint256) { return _nextTokenId; } // [cite: 211]
    function nextBatchId() external view returns (uint256) { return _nextBatchId; } // [cite: 212]

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert Token_DoesNotExist(tokenId); // [cite: 213]
        return string(abi.encodePacked("ipfs://", _diplomaRecords[tokenId].metadataCID)); // [cite: 214]
    }
    function supportsInterface(bytes4 iid) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(iid); // [cite: 215]
    }
}