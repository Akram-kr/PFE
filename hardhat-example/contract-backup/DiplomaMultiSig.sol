// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Minimal interface — only what MultiSig needs from DiplomaNFT
interface IDiplomaNFT {
    struct DiplomaInput {
        address student;
        string  fullName;
        string  matricule;
        string  dateOfBirth;
        string  placeOfBirth;
        string  cycle;
        string  specialty;
        string  department;
        string  mention;
        uint16  graduationYear;
        string  cidMetadata;
        bytes32 pdfHash;
    }
    function mintBatch(DiplomaInput[] calldata inputs, uint256 batchId) external;
    function revokeDiploma(uint256 tokenId, string calldata reason) external;
}

/**
 * @title  DiplomaMultiSig
 * @notice Multi-signature governance for diploma issuance at University of Blida 1.
 *
 * Workflow:
 *   1. ADMIN calls propose()     — submits a batch of diploma data + IPFS CIDs
 *   2. DEAN  calls sign()        — approves the batch
 *   3. RECTOR calls sign()       — approves the batch (threshold = 2)
 *   4. Anyone calls execute()    — mints the NFTs (after threshold reached)
 *      OR
 *   4. ADMIN/RECTOR calls cancel() — cancels the proposal
 *
 * Security properties:
 *   - Minimum 2-of-3 threshold (configurable at deploy: Dean, Rector, ViceRector)
 *   - Each signer can only sign once per proposal
 *   - Proposals expire after PROPOSAL_EXPIRY (7 days) — prevents stale batches
 *   - Only executed proposals unlock minting — no single point of control
 *   - Full audit trail via events
 *
 * @dev DiplomaInput[] stored off-chain via IPFS CID in the proposal.
 *      The on-chain proposal stores only the hash of the batch data
 *      for integrity, plus the metadata CID array for the NFT contract.
 */
contract DiplomaMultiSig {

    // ── Constants ──────────────────────────────────────────────────────────

    uint256 public constant PROPOSAL_EXPIRY = 7 days;
    uint256 public constant MAX_BATCH_SIZE  = 300;

    // ── Proposal states ────────────────────────────────────────────────────

    enum ProposalStatus {
        PENDING,    // Proposed, waiting for signatures
        APPROVED,   // Threshold reached, ready to execute
        EXECUTED,   // mintBatch() called successfully
        CANCELLED,  // Cancelled before execution
        EXPIRED     // Passed PROPOSAL_EXPIRY without enough signatures
    }

    // ── Structs ────────────────────────────────────────────────────────────

    /**
     * @notice On-chain proposal metadata
     * @dev    DiplomaInput[] is NOT stored on-chain (too expensive).
     *         It is stored on IPFS and referenced by batchDataCID.
     *         The batchHash is keccak256 of the encoded inputs,
     *         computed off-chain and verified before execution.
     */
    struct Proposal {
        uint256        proposalId;
        address        proposedBy;     // Admin who created the proposal
        string         description;    // e.g. "Promotion 2024-2025 — ISIL L3"
        string         batchDataCID;   // IPFS CID of the full DiplomaInput[] JSON
        bytes32        batchHash;      // keccak256 of encoded batch — integrity check
        uint256        studentCount;   // Number of students in batch
        ProposalStatus status;
        uint256        proposedAt;
        uint256        expiresAt;
        uint256        signatureCount;
        uint256        executedAt;
        string         cancelReason;
    }

    struct SignerInfo {
        address wallet;
        string  name;    // "Doyen" / "Recteur" / "Vice-Recteur"
        bool    active;
    }

    // ── State ──────────────────────────────────────────────────────────────

    IDiplomaNFT public nftContract;
    address     public admin;
    uint8       public threshold;         // min signatures required

    uint256 private _proposalCounter;

    // Registered signers (Dean, Rector, ViceRector)
    address[]                         public signers;
    mapping(address => SignerInfo)    public signerInfo;
    mapping(address => bool)          public isSigner;

    // Authorized proposers (Admins / Scolarité)
    mapping(address => bool)          public isProposer;

    // proposalId => Proposal
    mapping(uint256 => Proposal)      public proposals;

    // proposalId => signer => has signed
    mapping(uint256 => mapping(address => bool)) public hasSigned;

    // ── Events ─────────────────────────────────────────────────────────────

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposedBy,
        string  description,
        uint256 studentCount,
        string  batchDataCID,
        uint256 expiresAt
    );
    event ProposalSigned(
        uint256 indexed proposalId,
        address indexed signer,
        uint256 signatureCount,
        uint256 threshold
    );
    event ProposalApproved(
        uint256 indexed proposalId,
        uint256 signatureCount
    );
    event ProposalExecuted(
        uint256 indexed proposalId,
        uint256 studentCount,
        uint256 executedAt
    );
    event ProposalCancelled(
        uint256 indexed proposalId,
        address indexed cancelledBy,
        string  reason
    );
    event SignerAdded(address indexed signer, string name);
    event SignerRemoved(address indexed signer);
    event ThresholdChanged(uint8 oldThreshold, uint8 newThreshold);

    // ── Modifiers ──────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == admin, "Admin only");
        _;
    }

    modifier onlyProposer() {
        require(isProposer[msg.sender] || msg.sender == admin, "Not a proposer");
        _;
    }

    modifier onlySigner() {
        require(isSigner[msg.sender], "Not an authorized signer");
        _;
    }

    modifier proposalActive(uint256 proposalId) {
        require(proposalId < _proposalCounter, "Proposal does not exist");
        Proposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.PENDING, "Proposal not in PENDING state");
        require(block.timestamp <= p.expiresAt,     "Proposal has expired");
        _;
    }

    // ── Constructor ────────────────────────────────────────────────────────

    /**
     * @param _nftContract   Address of DiplomaNFT (must be set via setMultiSig after)
     * @param _signers       Initial signer wallets [Dean, Rector, (optional ViceRector)]
     * @param _signerNames   Names matching _signers array
     * @param _threshold     Minimum signatures required (e.g. 2)
     */
    constructor(
        address          _nftContract,
        address[] memory _signers,
        string[]  memory _signerNames,
        uint8            _threshold
    ) {
        require(_nftContract != address(0),           "Invalid NFT contract");
        require(_signers.length >= _threshold,         "Not enough signers for threshold");
        require(_threshold >= 2,                       "Minimum threshold is 2");
        require(_signers.length == _signerNames.length,"Signers/names length mismatch");

        admin       = msg.sender;
        nftContract = IDiplomaNFT(_nftContract);
        threshold   = _threshold;

        isProposer[msg.sender] = true;

        for (uint256 i = 0; i < _signers.length; i++) {
            require(_signers[i] != address(0), "Invalid signer address");
            require(!isSigner[_signers[i]],    "Duplicate signer");
            _addSigner(_signers[i], _signerNames[i]);
        }
    }

    // ── Proposer management ────────────────────────────────────────────────

    function addProposer(address proposer) external onlyAdmin {
        require(proposer != address(0), "Invalid address");
        isProposer[proposer] = true;
    }

    function removeProposer(address proposer) external onlyAdmin {
        isProposer[proposer] = false;
    }

    // ── Signer management ──────────────────────────────────────────────────

    function addSigner(
        address signer,
        string calldata signerName
    ) external onlyAdmin {
        require(!isSigner[signer], "Already a signer");
        _addSigner(signer, signerName);
    }

    function removeSigner(address signer) external onlyAdmin {
        require(isSigner[signer],                "Not a signer");
        require(signers.length - 1 >= threshold, "Would break threshold");

        isSigner[signer]          = false;
        signerInfo[signer].active = false;

        // Remove from array
        for (uint256 i = 0; i < signers.length; i++) {
            if (signers[i] == signer) {
                signers[i] = signers[signers.length - 1];
                signers.pop();
                break;
            }
        }
        emit SignerRemoved(signer);
    }

    function setThreshold(uint8 newThreshold) external onlyAdmin {
        require(newThreshold >= 2,              "Minimum threshold is 2");
        require(newThreshold <= signers.length, "Threshold exceeds signer count");
        uint8 old = threshold;
        threshold  = newThreshold;
        emit ThresholdChanged(old, newThreshold);
    }

    // ── STEP 1: Propose a diploma batch ───────────────────────────────────

    /**
     * @notice Admin proposes a batch of diplomas for signing.
     * @dev    The full DiplomaInput[] is stored on IPFS (batchDataCID).
     *         The batchHash is keccak256 of the ABI-encoded inputs,
     *         computed off-chain and stored for integrity verification.
     *         Signers verify the IPFS data matches the hash before signing.
     *
     * @param description   Human-readable label e.g. "Promotion 2025 ISIL L3"
     * @param batchDataCID  IPFS CID of the JSON array of DiplomaInput objects
     * @param batchHash     keccak256 of abi.encode(DiplomaInput[]) — integrity
     * @param studentCount  Number of students in the batch
     */
    function propose(
        string calldata description,
        string calldata batchDataCID,
        bytes32         batchHash,
        uint256         studentCount
    ) external onlyProposer returns (uint256 proposalId) {
        require(bytes(description).length  > 0,  "Description required");
        require(bytes(batchDataCID).length > 0,  "Batch data CID required");
        require(batchHash != bytes32(0),          "Batch hash required");
        require(studentCount > 0,                 "Empty batch");
        require(studentCount <= MAX_BATCH_SIZE,   "Batch too large");

        proposalId = _proposalCounter++;

        proposals[proposalId] = Proposal({
            proposalId:    proposalId,
            proposedBy:    msg.sender,
            description:   description,
            batchDataCID:  batchDataCID,
            batchHash:     batchHash,
            studentCount:  studentCount,
            status:        ProposalStatus.PENDING,
            proposedAt:    block.timestamp,
            expiresAt:     block.timestamp + PROPOSAL_EXPIRY,
            signatureCount:0,
            executedAt:    0,
            cancelReason:  ""
        });

        emit ProposalCreated(
            proposalId,
            msg.sender,
            description,
            studentCount,
            batchDataCID,
            block.timestamp + PROPOSAL_EXPIRY
        );
    }

    // ── STEP 2: Dean / Rector signs ────────────────────────────────────────

    /**
     * @notice Authorized signer (Dean or Rector) approves a proposal.
     * @dev    Before signing, the signer should:
     *         1. Fetch the JSON from IPFS using batchDataCID
     *         2. Verify keccak256(abi.encode(data)) == proposal.batchHash
     *         3. Review each student's data
     *         Only then call sign() to register approval on-chain.
     */
    function sign(
        uint256 proposalId
    ) external onlySigner proposalActive(proposalId) {
        require(!hasSigned[proposalId][msg.sender], "Already signed");

        hasSigned[proposalId][msg.sender] = true;
        proposals[proposalId].signatureCount += 1;

        uint256 count = proposals[proposalId].signatureCount;

        emit ProposalSigned(proposalId, msg.sender, count, threshold);

        // Auto-approve when threshold reached
        if (count >= threshold) {
            proposals[proposalId].status = ProposalStatus.APPROVED;
            emit ProposalApproved(proposalId, count);
        }
    }

    // ── STEP 3: Execute — mint the NFTs ───────────────────────────────────

    /**
     * @notice Execute an approved proposal — mints all diplomas in the batch.
     * @dev    inputs[] must match the batchHash stored in the proposal.
     *         The contract verifies the hash before calling mintBatch().
     *         This ensures no tampering between proposal and execution.
     *
     * @param proposalId  The approved proposal ID
     * @param inputs      The DiplomaInput[] — must match the stored batchHash
     */
    function execute(
        uint256                          proposalId,
        IDiplomaNFT.DiplomaInput[] calldata inputs
    ) external {
        require(proposalId < _proposalCounter,  "Proposal does not exist");
        Proposal storage p = proposals[proposalId];

        require(p.status == ProposalStatus.APPROVED, "Proposal not approved");
        require(block.timestamp <= p.expiresAt,      "Proposal has expired");
        require(inputs.length == p.studentCount,     "Input count mismatch");

        // ── Integrity check: verify inputs match the stored hash ──────────
        bytes32 computedHash = keccak256(abi.encode(inputs));
        require(computedHash == p.batchHash, "Batch data does not match proposal hash");

        // ── Mark executed before external call (reentrancy guard) ─────────
        p.status     = ProposalStatus.EXECUTED;
        p.executedAt = block.timestamp;

        // ── Mint all diplomas ─────────────────────────────────────────────
        nftContract.mintBatch(inputs, proposalId);

        emit ProposalExecuted(proposalId, inputs.length, block.timestamp);
    }

    // ── Cancel proposal ────────────────────────────────────────────────────

    /**
     * @notice Cancel a pending or approved proposal.
     * @dev    Only the proposer, a signer, or admin can cancel.
     *         Executed proposals cannot be cancelled.
     */
    function cancel(
        uint256 proposalId,
        string calldata reason
    ) external {
        require(proposalId < _proposalCounter, "Proposal does not exist");
        Proposal storage p = proposals[proposalId];

        require(
            p.status == ProposalStatus.PENDING ||
            p.status == ProposalStatus.APPROVED,
            "Cannot cancel executed or already cancelled proposal"
        );
        require(
            msg.sender == p.proposedBy ||
            isSigner[msg.sender]       ||
            msg.sender == admin,
            "Not authorized to cancel"
        );
        require(bytes(reason).length > 0, "Reason required");

        p.status       = ProposalStatus.CANCELLED;
        p.cancelReason = reason;

        emit ProposalCancelled(proposalId, msg.sender, reason);
    }

    // ── Mark expired ───────────────────────────────────────────────────────

    /**
     * @notice Anyone can mark an expired proposal as EXPIRED.
     * @dev    Purely a state cleanup — no funds involved.
     */
    function markExpired(uint256 proposalId) external {
        require(proposalId < _proposalCounter, "Does not exist");
        Proposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.PENDING, "Not pending");
        require(block.timestamp > p.expiresAt,      "Not yet expired");
        p.status = ProposalStatus.EXPIRED;
    }

    // ── Read ───────────────────────────────────────────────────────────────

    function getProposal(uint256 proposalId)
        external view returns (Proposal memory)
    {
        return proposals[proposalId];
    }

    function getSigners() external view returns (address[] memory) {
        return signers;
    }

    function hasSignerSigned(
        uint256 proposalId,
        address signer
    ) external view returns (bool) {
        return hasSigned[proposalId][signer];
    }

    function getProposalCount() external view returns (uint256) {
        return _proposalCounter;
    }

    function isExpired(uint256 proposalId) external view returns (bool) {
        return block.timestamp > proposals[proposalId].expiresAt &&
               proposals[proposalId].status == ProposalStatus.PENDING;
    }

    function getSignatureStatus(uint256 proposalId)
        external view returns (
            uint256 signed,
            uint256 needed,
            bool    approved,
            address[] memory whoSigned
        )
    {
        Proposal storage p = proposals[proposalId];
        signed   = p.signatureCount;
        needed   = threshold;
        approved = p.status == ProposalStatus.APPROVED ||
                   p.status == ProposalStatus.EXECUTED;

        // Build list of who signed
        uint256 count = 0;
        for (uint256 i = 0; i < signers.length; i++) {
            if (hasSigned[proposalId][signers[i]]) count++;
        }
        whoSigned = new address[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < signers.length; i++) {
            if (hasSigned[proposalId][signers[i]]) {
                whoSigned[j++] = signers[i];
            }
        }
    }

    // ── Internal ───────────────────────────────────────────────────────────

    function _addSigner(address signer, string memory signerName) internal {
        isSigner[signer] = true;
        signers.push(signer);
        signerInfo[signer] = SignerInfo({
            wallet: signer,
            name:   signerName,
            active: true
        });
        emit SignerAdded(signer, signerName);
    }
}
