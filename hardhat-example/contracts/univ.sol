// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title  UniversityDiploma
 * @author University of Blida 1 — PFE Project (DiploChain)
 * @notice Soulbound NFT (ERC-721) for high-security diploma issuance
 * under the Algerian LMD system with on-chain jury deliberation.
 *
 * ═══════════════════════════════════════════════════════════════════
 * SIMPLIFIED DELIBERATION RULES:
 *
 * L3 (Licence) — Annual Compensation:
 * annualAverage = (S5 + S6) / 2
 * PASS  if annualAverage >= 10.00  (>= 1000 scaled)
 * RACHAT if 9.90 <= annualAverage < 10.00 (jury may bump)
 * FAIL  if annualAverage < 9.90
 *
 * M2 (Master) — Independent Semesters:
 * PASS  if S3 >= 10.00 AND PFE >= 10.00
 * RACHAT if either is in [9.90, 10.00) — jury may bump
 * FAIL  otherwise
 *
 * Governance workflow:
 * PROPOSED → DELIBERATED → SIGNED_BY_DEAN → SIGNED_BY_RECTOR → FINALIZED
 * Any non-finalized batch can be CANCELLED by admin.
 * Batches expire after 7 days.
 * ═══════════════════════════════════════════════════════════════════
 */
contract UniversityDiploma is ERC721, AccessControl, ReentrancyGuard {

    // =========================================================================
    // Constants
    // =========================================================================

    uint256 public constant PROPOSAL_EXPIRY  = 7 days;
    uint256 public constant MAX_BATCH_SIZE   = 150;

    /// @notice Grades stored as uint16 scaled ×100 for 2 decimal precision
    /// e.g. 13.50 stored as 1350,  10.00 stored as 1000
    uint16  public constant PASS_GRADE       = 1000; // 10.00 / 20
    uint16  public constant RACHAT_THRESHOLD = 990;  //  9.90 / 20
    uint16  public constant MAX_GRADE        = 2000; // 20.00 / 20

    // =========================================================================
    // Roles
    // =========================================================================

    bytes32 public constant ADMIN_ROLE   = keccak256("ADMIN_ROLE");
    bytes32 public constant DEAN_ROLE    = keccak256("DEAN_ROLE");
    bytes32 public constant RECTOR_ROLE  = keccak256("RECTOR_ROLE");
    bytes32 public constant COUNCIL_ROLE = keccak256("COUNCIL_ROLE");

    // =========================================================================
    // Enumerations
    // =========================================================================

    enum BatchStatus {
        Proposed,       // 0 — submitted by admin, awaiting deliberation
        Deliberated,    // 1 — council has deliberated, awaiting dean
        SignedByDean,   // 2 — dean approved, awaiting rector
        SignedByRector, // 3 — fully approved, ready to finalize
        Finalized,      // 4 — NFTs minted
        Cancelled       // 5 — cancelled before finalization
    }

    enum Specialty { SIQ, ISIL, AI, Reseau }
    enum Cycle     { L3, M2 }
    enum Mention   { Passable, AssezBien, Bien, TresBien }

    /// @notice Final deliberation outcome per student
    enum DeliberationResult {
        Pending,   // 0 — not yet deliberated
        Admis,     // 1 — passed (average >= 10.00)
        Rachat,    // 2 — borderline [9.90, 10.00) — jury bumped to pass
        Ajourne    // 3 — failed (average < 9.90)
    }

    // =========================================================================
    // Structs
    // =========================================================================

    /**
     * @notice Per-student entry submitted inside a proposed batch.
     * @dev    s1Grade = S5 for L3, S3 for M2 (scaled ×100)
     * s2Grade = S6 for L3, PFE defense for M2 (scaled ×100)
     * gradeTreeRoot = Merkle root of off-chain module grades
     * baseMoyenne   = pre-computed annual average (scaled ×100)
     * computed off-chain from s1Grade + s2Grade,
     * stored on-chain for deliberation engine
     */
    struct StudentEntry {
        address   wallet;
        string    studentName;
        string    matricule;
        string    dateOfBirth;
        string    placeOfBirth;
        string    metadataCID;     // IPFS CID of JSON metadata
        bytes32   sha256Hash;      // SHA-256 of original diploma PDF
        bytes32   gradeTreeRoot;   // Merkle root of all module grades
        Specialty specialty;
        Cycle     cycle;
        uint16    graduationYear;
        string    department;
        uint16    s1Grade;         // Semester 1 average × 100 (S5 for L3, S3 for M2)
        uint16    s2Grade;         // Semester 2 average × 100 (S6 for L3, PFE for M2)
        uint16    baseMoyenne;     // Annual average × 100 (pre-computed off-chain)
    }

    /**
     * @notice Rachat: jury bumps a borderline student from 9.90–9.99 to pass.
     * @dev    bumpedMoyenne must be > baseMoyenne and >= PASS_GRADE.
     * reason is mandatory for audit trail.
     */
    struct Rachat {
        uint256 studentIndex;  // Index in batch.students
        uint16  bumpedMoyenne; // New moyenne after rachat (must be >= PASS_GRADE)
        string  reason;        // Mandatory justification
    }

    /**
     * @notice Per-student deliberation result stored on-chain (the PV).
     */
    struct StudentPV {
        uint16            s1Grade;
        uint16            s2Grade;
        uint16            baseMoyenne;
        uint16            finalMoyenne;      // After rachat if applied
        Mention           mention;
        DeliberationResult result;
        bool              rachatApplied;
        bool              diplomaEligible;   // true = NFT will be minted
        string            ipfsTranscriptCID; // IPFS CID of official transcript PDF
    }

    /**
     * @notice A batch moving through the approval pipeline.
     * @dev    mappings inside struct — cannot be returned from view functions.
     * Use individual getters.
     */
    struct Batch {
        BatchStatus status;
        address     proposer;
        uint256     proposedAt;
        uint256     expiresAt;
        uint256     deliberatedAt;
        address     deliberatedBy;
        uint256     deanSignedAt;
        uint256     rectorSignedAt;
        uint256     finalizedAt;
        string      description;
        string      cancelReason;
        string      deliberationNote;
        uint256     studentCount;
        mapping(uint256 => StudentEntry) students;
        mapping(uint256 => Rachat)       rachats;
        mapping(uint256 => bool)         hasRachat;
        mapping(uint256 => string)       transcriptCIDs; // per-student IPFS transcript
    }

    /**
     * @notice Immutable on-chain diploma record per minted token.
     */
    struct DiplomaRecord {
        string    studentName;
        string    matricule;
        string    dateOfBirth;
        string    placeOfBirth;
        string    metadataCID;
        bytes32   sha256Hash;
        bytes32   gradeTreeRoot;
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

    // =========================================================================
    // State Variables
    // =========================================================================

    uint256 private _nextTokenId;
    uint256 private _nextBatchId;

    mapping(uint256 => Batch)                             private _batches;
    mapping(uint256 => DiplomaRecord)                     private _diplomaRecords;
    mapping(string  => bool)                              private _matriculeUsed;
    mapping(string  => uint256)                           private _matriculeToToken;
    mapping(address => uint256[])                         private _studentTokens;
    mapping(uint256 => mapping(uint256 => StudentPV))     private _pvRecords;
    mapping(uint256 => uint256)                           public  verificationCount;

    // =========================================================================
    // Events
    // =========================================================================

    event BatchProposed(
        uint256 indexed batchId,
        address indexed proposer,
        uint256 studentCount,
        string  description,
        uint256 expiresAt
    );
    event BatchDeliberated(
        uint256 indexed batchId,
        address indexed council,
        uint256 timestamp,
        uint256 rachatCount,
        string  note
    );
    event RachatApplied(
        uint256 indexed batchId,
        uint256 indexed studentIndex,
        uint16  baseMoyenne,
        uint16  bumpedMoyenne,
        string  reason
    );
    event BatchSignedByDean(
        uint256 indexed batchId,
        address indexed dean,
        uint256 timestamp
    );
    event BatchSignedByRector(
        uint256 indexed batchId,
        address indexed rector,
        uint256 timestamp
    );
    event BatchFinalized(
        uint256 indexed batchId,
        uint256[] tokenIds,
        uint256 totalStudents,
        uint256 diplomasMinted
    );
    event BatchCancelled(
        uint256 indexed batchId,
        address indexed cancelledBy,
        string  reason
    );
    event DiplomaVerified(
        uint256 indexed tokenId,
        address indexed verifier,
        bool    isAuthentic,
        uint256 count
    );
    event DiplomaRevoked(
        uint256 indexed tokenId,
        address indexed revokedBy,
        string  reason,
        uint256 timestamp
    );
    event DeanAssigned(address indexed dean,     address indexed assignedBy);
    event DeanRemoved(address indexed dean,      address indexed removedBy);
    event RectorAssigned(address indexed rector, address indexed assignedBy);
    event RectorRemoved(address indexed rector,  address indexed removedBy);
    event CouncilAssigned(address indexed council, address indexed assignedBy);
    event CouncilRemoved(address indexed council,  address indexed removedBy);

    // =========================================================================
    // Custom Errors
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
    error Batch_InvalidGrade(uint256 index, uint16 grade);
    error Rachat_InvalidStudentIndex(uint256 studentIndex);
    error Rachat_BumpBelowBase(uint256 studentIndex, uint16 base, uint16 bumped);
    error Rachat_BumpBelowPassGrade(uint256 studentIndex, uint16 bumped);
    error Rachat_BumpAboveMax(uint256 studentIndex, uint16 bumped);
    error Rachat_MissingReason(uint256 studentIndex);
    error Rachat_StudentNotBorderline(uint256 studentIndex, uint16 moyenne);
    error Index_OutOfBounds();
    error Token_DoesNotExist(uint256 tokenId);
    error Token_AlreadyRevoked(uint256 tokenId);
    error Token_MissingRevocationReason();

    // =========================================================================
    // Constructor
    // =========================================================================

    constructor(address admin) ERC721("UniversityDiploma", "UDIP") {
        if (admin == address(0)) revert Role_ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    // =========================================================================
    // Role Management
    // =========================================================================

    function assignDean(address d) external onlyRole(ADMIN_ROLE) {
        if (d == address(0)) revert Role_ZeroAddress();
        _grantRole(DEAN_ROLE, d);
        emit DeanAssigned(d, msg.sender);
    }
    function removeDean(address d) external onlyRole(ADMIN_ROLE) {
        _revokeRole(DEAN_ROLE, d);
        emit DeanRemoved(d, msg.sender);
    }
    function assignRector(address r) external onlyRole(ADMIN_ROLE) {
        if (r == address(0)) revert Role_ZeroAddress();
        _grantRole(RECTOR_ROLE, r);
        emit RectorAssigned(r, msg.sender);
    }
    function removeRector(address r) external onlyRole(ADMIN_ROLE) {
        _revokeRole(RECTOR_ROLE, r);
        emit RectorRemoved(r, msg.sender);
    }
    function assignCouncil(address c) external onlyRole(ADMIN_ROLE) {
        if (c == address(0)) revert Role_ZeroAddress();
        _grantRole(COUNCIL_ROLE, c);
        emit CouncilAssigned(c, msg.sender);
    }
    function removeCouncil(address c) external onlyRole(ADMIN_ROLE) {
        _revokeRole(COUNCIL_ROLE, c);
        emit CouncilRemoved(c, msg.sender);
    }

    // =========================================================================
    // Soulbound — Block All Transfers
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
    // Deliberation Engine
    // =========================================================================

    /**
     * @notice Compute the deliberation result for one student.
     * @dev    L3: annual compensation — (S5 + S6) / 2
     * M2: independent semesters — S3 AND PFE must both pass
     *
     * PASS   : average >= PASS_GRADE  (>= 10.00)
     * RACHAT : RACHAT_THRESHOLD <= average < PASS_GRADE (9.90–9.99)
     * → jury may bump to pass via Rachat struct
     * Ajourne: average < RACHAT_THRESHOLD (< 9.90) — cannot rachat
     *
     * @param  baseMoyenne   Annual average × 100 (pre-computed off-chain)
     * @param  s1Grade       S1 average × 100
     * @param  s2Grade       S2 average × 100
     * @param  cycle         L3 or M2
     * @param  rachatApplied True if jury applied a rachat for this student
     * @param  bumpedMoyenne Bumped moyenne after rachat (only if rachatApplied)
     */
    function _computeResult(
        uint16 baseMoyenne,
        uint16 s1Grade,
        uint16 s2Grade,
        Cycle  cycle,
        bool   rachatApplied,
        uint16 bumpedMoyenne
    ) internal pure returns (
        uint16            finalMoyenne,
        DeliberationResult result,
        bool              diplomaEligible,
        Mention           mention
    ) {
        finalMoyenne = rachatApplied ? bumpedMoyenne : baseMoyenne;
        
        if (cycle == Cycle.L3) {
            // ── L3: Annual compensation ──────────────────────────────────
            // baseMoyenne = (S5 + S6) / 2  (computed off-chain, passed in)
            if (finalMoyenne >= PASS_GRADE) {
                result          = DeliberationResult.Admis;
                diplomaEligible = true;
            } else if (finalMoyenne >= RACHAT_THRESHOLD) {
                // Borderline — only eligible if rachat was applied by jury
                result          = rachatApplied
                    ? DeliberationResult.Rachat
                    : DeliberationResult.Ajourne;
                diplomaEligible = rachatApplied;
            } else {
                result          = DeliberationResult.Ajourne;
                diplomaEligible = false;
            }

        } else {
            // ── M2: Independent semesters ────────────────────────────────
            // S3 (mémoire S1) and PFE defense must BOTH pass independently
            bool s1Passes = s1Grade >= PASS_GRADE ||
                            (rachatApplied && s1Grade >= RACHAT_THRESHOLD);
            bool s2Passes = s2Grade >= PASS_GRADE ||
                            (rachatApplied && s2Grade >= RACHAT_THRESHOLD);
                            
            if (s1Passes && s2Passes) {
                result          = rachatApplied
                    ? DeliberationResult.Rachat
                    : DeliberationResult.Admis;
                diplomaEligible = true;
                // For M2, final moyenne = average of both for mention
                finalMoyenne = uint16((uint256(s1Grade) + uint256(s2Grade)) / 2);
                if (rachatApplied) finalMoyenne = bumpedMoyenne;
            } else {
                result          = DeliberationResult.Ajourne;
                diplomaEligible = false;
            }
        }

        // Mention only assigned to passing students
        mention = diplomaEligible
            ? _mentionFromMoyenne(finalMoyenne)
            : Mention.Passable;
    }

    function _mentionFromMoyenne(uint16 m) internal pure returns (Mention) {
        if (m >= 1600) return Mention.TresBien;
        if (m >= 1400) return Mention.Bien;
        if (m >= 1200) return Mention.AssezBien;
        return Mention.Passable;
    }

    // =========================================================================
    // STEP 1 — Admin: Propose Batch
    // =========================================================================

    /**
     * @notice Admin proposes a batch of students for deliberation.
     * @dev    s1Grade and s2Grade are the semester averages × 100.
     * baseMoyenne is pre-computed off-chain as (s1+s2)/2 for L3.
     * For M2, baseMoyenne can be set to min(s1,s2) or avg — used
     * only for display; actual pass logic uses s1Grade and s2Grade.
     * gradeTreeRoot is the Merkle root of all module grades for
     * cryptographic verification via verifySubjectMark().
     */
    function proposeBatch(
        StudentEntry[] calldata inputs,
        string calldata description
    ) external onlyRole(ADMIN_ROLE) returns (uint256 batchId) {
        if (inputs.length == 0)             revert Batch_EmptyStudentList();
        if (inputs.length > MAX_BATCH_SIZE) revert Batch_TooLarge(inputs.length, MAX_BATCH_SIZE);

        batchId = _nextBatchId++;
        Batch storage batch       = _batches[batchId];
        batch.status              = BatchStatus.Proposed;
        batch.proposer            = msg.sender;
        batch.proposedAt          = block.timestamp;
        batch.expiresAt           = block.timestamp + PROPOSAL_EXPIRY;
        batch.description         = description;
        batch.studentCount        = inputs.length;
        
        for (uint256 i = 0; i < inputs.length; ) {
            StudentEntry calldata s = inputs[i];
            
            // Validation
            if (s.wallet == address(0))                         revert Batch_InvalidStudentWallet(i);
            if (bytes(s.studentName).length == 0)               revert Batch_MissingName(i);
            if (bytes(s.matricule).length == 0)                 revert Batch_MissingMatricule(i);
            if (bytes(s.metadataCID).length == 0)               revert Batch_MissingCID(i);
            if (s.sha256Hash == bytes32(0))                     revert Batch_MissingHash(i);
            if (bytes(s.department).length == 0)                revert Batch_MissingDepartment(i);
            if (s.graduationYear < 2000 || s.graduationYear > 2100) revert Batch_InvalidGraduationYear(i);
            if (s.s1Grade > MAX_GRADE)                          revert Batch_InvalidGrade(i, s.s1Grade);
            if (s.s2Grade > MAX_GRADE)                          revert Batch_InvalidGrade(i, s.s2Grade);
            
            // Copy to storage
            StudentEntry storage dst = batch.students[i];
            dst.wallet          = s.wallet;
            dst.studentName     = s.studentName;
            dst.matricule       = s.matricule;
            dst.dateOfBirth     = s.dateOfBirth;
            dst.placeOfBirth    = s.placeOfBirth;
            dst.metadataCID     = s.metadataCID;
            dst.sha256Hash      = s.sha256Hash;
            dst.gradeTreeRoot   = s.gradeTreeRoot;
            dst.specialty       = s.specialty;
            dst.cycle           = s.cycle;
            dst.graduationYear  = s.graduationYear;
            dst.department      = s.department;
            dst.s1Grade         = s.s1Grade;
            dst.s2Grade         = s.s2Grade;
            dst.baseMoyenne     = s.baseMoyenne;
            
            unchecked { ++i; }
        }

        emit BatchProposed(batchId, msg.sender, inputs.length, description, batch.expiresAt);
    }

    // =========================================================================
    // STEP 2 — Council: Deliberate
    // =========================================================================

    /**
     * @notice Internal helper to isolate stack variables during PV recording.
     */
    function _processAndRecordPV(
        uint256 batchId,
        uint256 index,
        string memory transcriptCID
    ) internal {
        Batch storage batch = _batches[batchId];
        StudentEntry storage s = batch.students[index];
        bool hasR = batch.hasRachat[index];
        uint16 bump = hasR ? batch.rachats[index].bumpedMoyenne : 0;

        (
            uint16            finalMoy,
            DeliberationResult result,
            bool              eligible,
            Mention           mention
        ) = _computeResult(s.baseMoyenne, s.s1Grade, s.s2Grade, s.cycle, hasR, bump);

        _pvRecords[batchId][index] = StudentPV({
            s1Grade:           s.s1Grade,
            s2Grade:           s.s2Grade,
            baseMoyenne:       s.baseMoyenne,
            finalMoyenne:      finalMoy,
            mention:           mention,
            result:            result,
            rachatApplied:     hasR,
            diplomaEligible:   eligible,
            ipfsTranscriptCID: transcriptCID
        });
    }

    /**
     * @notice Council (jury) deliberates the batch and applies rachats.
     * @dev    Rachats are only allowed for borderline students:
     * RACHAT_THRESHOLD (9.90) <= baseMoyenne < PASS_GRADE (10.00)
     * The bumpedMoyenne must be >= PASS_GRADE (10.00).
     * Council also attaches the IPFS CID of each student's transcript.
     *
     * @param  batchId        The batch to deliberate
     * @param  rachats        Array of jury bumps for borderline students
     * @param  transcriptCIDs IPFS CIDs of official transcript PDFs (one per student)
     * @param  note           Council's deliberation note (appears in PV)
     */
    function deliberate(
        uint256           batchId,
        Rachat[]  calldata rachats,
        string[]  calldata transcriptCIDs,
        string    calldata note
    ) external onlyRole(COUNCIL_ROLE) {
        Batch storage batch = _batches[batchId];
        if (block.timestamp > batch.expiresAt) revert Batch_Expired(batchId);
        if (batch.status != BatchStatus.Proposed)
            revert Batch_InvalidStatus(batchId, batch.status, BatchStatus.Proposed);
            
        require(
            transcriptCIDs.length == batch.studentCount,
            "transcriptCIDs length must match student count"
        );

        // ── Apply rachats ─────────────────────────────────────────────────
        for (uint256 i = 0; i < rachats.length; ) {
            Rachat calldata r = rachats[i];
            if (r.studentIndex >= batch.studentCount)
                revert Rachat_InvalidStudentIndex(r.studentIndex);
            if (bytes(r.reason).length == 0)
                revert Rachat_MissingReason(r.studentIndex);
            if (r.bumpedMoyenne > MAX_GRADE)
                revert Rachat_BumpAboveMax(r.studentIndex, r.bumpedMoyenne);
                
            uint16 baseM = batch.students[r.studentIndex].baseMoyenne;

            // Student must be borderline to receive a rachat
            if (baseM >= PASS_GRADE || baseM < RACHAT_THRESHOLD)
                revert Rachat_StudentNotBorderline(r.studentIndex, baseM);
                
            // Bumped moyenne must be above base
            if (r.bumpedMoyenne <= baseM)
                revert Rachat_BumpBelowBase(r.studentIndex, baseM, r.bumpedMoyenne);
                
            // Bumped moyenne must reach passing threshold
            if (r.bumpedMoyenne < PASS_GRADE)
                revert Rachat_BumpBelowPassGrade(r.studentIndex, r.bumpedMoyenne);

            batch.rachats[r.studentIndex]   = r;
            batch.hasRachat[r.studentIndex] = true;

            emit RachatApplied(batchId, r.studentIndex, baseM, r.bumpedMoyenne, r.reason);
            unchecked { ++i; }
        }

        // ── Store transcript CIDs & Compute PV for every student ──────────
        for (uint256 i = 0; i < batch.studentCount; ) {
            // Write to storage
            batch.transcriptCIDs[i] = transcriptCIDs[i];
            
            // Call internal helper to offload stack load
            _processAndRecordPV(batchId, i, transcriptCIDs[i]);
            
            unchecked { ++i; }
        }

        batch.status           = BatchStatus.Deliberated;
        batch.deliberatedAt    = block.timestamp;
        batch.deliberatedBy    = msg.sender;
        batch.deliberationNote = note;
        
        emit BatchDeliberated(batchId, msg.sender, block.timestamp, rachats.length, note);
    }

    // =========================================================================
    // STEP 3 — Dean: Sign
    // =========================================================================

    function signByDean(uint256 batchId) external onlyRole(DEAN_ROLE) {
        Batch storage batch = _batches[batchId];
        if (block.timestamp > batch.expiresAt) revert Batch_Expired(batchId);
        if (batch.status != BatchStatus.Deliberated)
            revert Batch_InvalidStatus(batchId, batch.status, BatchStatus.Deliberated);
            
        batch.status       = BatchStatus.SignedByDean;
        batch.deanSignedAt = block.timestamp;
        emit BatchSignedByDean(batchId, msg.sender, block.timestamp);
    }

    // =========================================================================
    // STEP 4 — Rector: Sign
    // =========================================================================

    function signByRector(uint256 batchId) external onlyRole(RECTOR_ROLE) {
        Batch storage batch = _batches[batchId];
        if (block.timestamp > batch.expiresAt) revert Batch_Expired(batchId);
        if (batch.status != BatchStatus.SignedByDean)
            revert Batch_InvalidStatus(batchId, batch.status, BatchStatus.SignedByDean);
            
        batch.status         = BatchStatus.SignedByRector;
        batch.rectorSignedAt = block.timestamp;
        emit BatchSignedByRector(batchId, msg.sender, block.timestamp);
    }

    // =========================================================================
    // STEP 5 — Admin: Finalize (mint NFTs)
    // =========================================================================

    /**
     * @notice Admin finalizes batch — mints diploma NFTs for eligible students.
     * @dev    Only students with diplomaEligible = true receive an NFT.
     * Ajourne students have their PV stored but no NFT minted.
     * Uses pre-computed PV from deliberate() — no re-computation.
     */
    function finalizeBatch(
        uint256 batchId
    ) external onlyRole(ADMIN_ROLE) nonReentrant returns (uint256[] memory tokenIds) {
        Batch storage batch = _batches[batchId];
        if (block.timestamp > batch.expiresAt) revert Batch_Expired(batchId);
        if (batch.status != BatchStatus.SignedByRector)
            revert Batch_InvalidStatus(batchId, batch.status, BatchStatus.SignedByRector);
            
        uint256 total       = batch.studentCount;
        uint256[] memory tmp = new uint256[](total);
        uint256 mintedCount;
        
        for (uint256 i = 0; i < total; ) {
            StudentPV storage pv = _pvRecords[batchId][i];
            
            if (pv.diplomaEligible) {
                StudentEntry storage s = batch.students[i];
                if (_matriculeUsed[s.matricule])
                    revert Batch_MatriculeAlreadyMinted(s.matricule);
                    
                uint256 tokenId = _nextTokenId++;
                _safeMint(s.wallet, tokenId);

                _diplomaRecords[tokenId] = DiplomaRecord({
                    studentName:      s.studentName,
                    matricule:        s.matricule,
                    dateOfBirth:      s.dateOfBirth,
                    placeOfBirth:     s.placeOfBirth,
                    metadataCID:      s.metadataCID,
                    sha256Hash:       s.sha256Hash,
                    gradeTreeRoot:    s.gradeTreeRoot,
                    specialty:        s.specialty,
                    cycle:            s.cycle,
                    mention:          pv.mention,
                    moyenne:          pv.finalMoyenne,
                    graduationYear:   s.graduationYear,
                    department:       s.department,
                    batchId:          batchId,
                    mintedAt:         block.timestamp,
                    valid:            true,
                    revocationReason: ""
                });
                
                _matriculeUsed[s.matricule]   = true;
                _matriculeToToken[s.matricule] = tokenId;
                _studentTokens[s.wallet].push(tokenId);
                tmp[mintedCount++] = tokenId;
            }

            unchecked { ++i; }
        }

        // Trim array to actual minted count
        tokenIds = new uint256[](mintedCount);
        for (uint256 i = 0; i < mintedCount; ) {
            tokenIds[i] = tmp[i];
            unchecked { ++i; }
        }

        batch.status      = BatchStatus.Finalized;
        batch.finalizedAt = block.timestamp;
        emit BatchFinalized(batchId, tokenIds, total, mintedCount);
    }

    // =========================================================================
    // Cancel Batch
    // =========================================================================

    function cancelBatch(
        uint256 batchId,
        string calldata reason
    ) external onlyRole(ADMIN_ROLE) {
        Batch storage batch = _batches[batchId];
        BatchStatus st = batch.status;
        
        if (st == BatchStatus.Finalized || st == BatchStatus.Cancelled)
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

    function revokeDiploma(
        uint256 tokenId,
        string calldata reason
    ) external onlyRole(ADMIN_ROLE) {
        if (_ownerOf(tokenId) == address(0))  revert Token_DoesNotExist(tokenId);
        if (!_diplomaRecords[tokenId].valid)  revert Token_AlreadyRevoked(tokenId);
        if (bytes(reason).length == 0)        revert Token_MissingRevocationReason();
        
        _diplomaRecords[tokenId].valid            = false;
        _diplomaRecords[tokenId].revocationReason = reason;
        emit DiplomaRevoked(tokenId, msg.sender, reason, block.timestamp);
    }

    // =========================================================================
    // Verification
    // =========================================================================

    /**
     * @notice Verify diploma authenticity against its PDF SHA-256 hash.
     * @dev    Increments verificationCount — use verifyDiplomaView for free reads.
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

    /**
     * @notice Free read-only verification — no state change, no gas cost.
     */
    function verifyDiplomaView(
        uint256 tokenId,
        bytes32 pdfHash
    ) external view returns (bool isAuthentic, bool exists, bool isValid) {
        exists = _ownerOf(tokenId) != address(0);
        if (!exists) return (false, false, false);
        
        DiplomaRecord storage rec = _diplomaRecords[tokenId];
        isValid     = rec.valid;
        isAuthentic = rec.valid && (rec.sha256Hash == pdfHash);
    }

    /**
     * @notice Cryptographically verify a single module grade belongs to a diploma.
     * @dev    Uses Merkle proof against gradeTreeRoot stored in the diploma record.
     * The leaf is keccak256(ueName, subjectName, ccMark, examMark).
     * Proof is generated off-chain from the grade tree stored on IPFS.
     *
     * @param  tokenId     The diploma NFT token ID
     * @param  ueName      Unit name (UE) e.g. "Algorithmique"
     * @param  subjectName Subject name e.g. "TD Algo"
     * @param  ccMark      CC grade × 100
     * @param  examMark    Exam grade × 100
     * @param  proof       Merkle proof array from off-chain tree
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
        
        bytes32 leaf = keccak256(abi.encodePacked(ueName, subjectName, ccMark, examMark));
        return MerkleProof.verify(proof, _diplomaRecords[tokenId].gradeTreeRoot, leaf);
    }

    // =========================================================================
    // View Functions
    // =========================================================================

    function getDiplomaRecord(uint256 tokenId)
        external view returns (DiplomaRecord memory)
    {
        if (_ownerOf(tokenId) == address(0)) revert Token_DoesNotExist(tokenId);
        return _diplomaRecords[tokenId];
    }

    function isDiplomaValid(uint256 tokenId) external view returns (bool) {
        if (_ownerOf(tokenId) == address(0)) revert Token_DoesNotExist(tokenId);
        return _diplomaRecords[tokenId].valid;
    }

    function getStudentDiplomas(address student)
        external view returns (uint256[] memory)
    {
        return _studentTokens[student];
    }

    function getTokenByMatricule(string calldata matricule)
        external view returns (uint256 tokenId, bool exists)
    {
        exists  = _matriculeUsed[matricule];
        tokenId = _matriculeToToken[matricule];
    }

    function isMatriculeUsed(string calldata m) external view returns (bool) {
        return _matriculeUsed[m];
    }

    function getStudentPV(uint256 batchId, uint256 idx)
        external view returns (StudentPV memory)
    {
        return _pvRecords[batchId][idx];
    }

    function getBatchStudent(uint256 batchId, uint256 idx)
        external view returns (StudentEntry memory)
    {
        if (idx >= _batches[batchId].studentCount) revert Index_OutOfBounds();
        return _batches[batchId].students[idx];
    }

    function getTranscriptLink(uint256 batchId, uint256 idx)
        external view returns (string memory)
    {
        string memory cid = _batches[batchId].transcriptCIDs[idx];
        require(bytes(cid).length > 0, "No transcript available");
        return string(abi.encodePacked("ipfs://", cid));
    }

    function getBatchStatus(uint256 batchId) external view returns (BatchStatus) {
        return _batches[batchId].status;
    }

    function getBatchStudentCount(uint256 batchId) external view returns (uint256) {
        return _batches[batchId].studentCount;
    }

    function getBatchDescription(uint256 batchId) external view returns (string memory) {
        return _batches[batchId].description;
    }

    function getBatchExpiry(uint256 batchId) external view returns (uint256) {
        return _batches[batchId].expiresAt;
    }

    function getBatchDeliberation(uint256 batchId) external view returns (
        uint256 deliberatedAt,
        address deliberatedBy,
        string memory note
    ) {
        Batch storage b = _batches[batchId];
        return (b.deliberatedAt, b.deliberatedBy, b.deliberationNote);
    }

    function getBatchSignatures(uint256 batchId) external view returns (
        uint256 deanSignedAt,
        uint256 rectorSignedAt,
        uint256 finalizedAt
    ) {
        Batch storage b = _batches[batchId];
        return (b.deanSignedAt, b.rectorSignedAt, b.finalizedAt);
    }

    function getBatchCancelReason(uint256 batchId) external view returns (string memory) {
        return _batches[batchId].cancelReason;
    }

    function getBatchResults(uint256 batchId) external view returns (
        uint256 total,
        uint256 admis,
        uint256 rachat,
        uint256 ajourne
    ) {
        uint256 count = _batches[batchId].studentCount;
        total = count;
        for (uint256 i = 0; i < count; ) {
            DeliberationResult r = _pvRecords[batchId][i].result;
            if      (r == DeliberationResult.Admis)   admis++;
            else if (r == DeliberationResult.Rachat)  rachat++;
            else if (r == DeliberationResult.Ajourne) ajourne++;
            unchecked { ++i; }
        }
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

    // =========================================================================
    // Pure Helpers (useful for frontend pre-computation)
    // =========================================================================

    /// @notice Compute annual average for L3: (s1 + s2) / 2, scaled ×100
    function computeAnnualAverage(uint16 s1, uint16 s2)
        external pure returns (uint16)
    {
        return uint16((uint256(s1) + uint256(s2)) / 2);
    }

    /// @notice Get mention from moyenne scaled ×100
    function mentionFor(uint16 m) external pure returns (Mention) {
        if (m >= 1600) return Mention.TresBien;
        if (m >= 1400) return Mention.Bien;
        if (m >= 1200) return Mention.AssezBien;
        return Mention.Passable;
    }

    /// @notice Check if a student is borderline (eligible for rachat)
    function isBorderline(uint16 moyenne) external pure returns (bool) {
        return moyenne >= RACHAT_THRESHOLD && moyenne < PASS_GRADE;
    }
}