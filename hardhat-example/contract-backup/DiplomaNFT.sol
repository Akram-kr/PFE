// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  DiplomaNFT
 * @notice Soulbound ERC-721 diploma NFT for University of Blida 1.
 *
 * Key properties:
 *   - Non-transferable (Soulbound) — any transfer attempt reverts
 *   - Only the authorized MultiSig contract can mint
 *   - Batch minting handles entire graduating classes in one tx
 *   - Each token stores: student data, IPFS metadata CID, PDF hash
 *   - tokenURI returns the IPFS CID directly (metadata JSON on IPFS)
 *   - Public verifyDiploma() for the employer portal
 *
 * Metadata JSON structure stored on IPFS:
 * {
 *   "name": "Diplôme de Licence — Amira Benali",
 *   "description": "Diplôme officiel — Université de Blida 1",
 *   "image": "ipfs://CID_of_diploma_image",
 *   "attributes": [
 *     { "trait_type": "Nom",          "value": "Amira Benali"      },
 *     { "trait_type": "Matricule",    "value": "20241234"           },
 *     { "trait_type": "Cycle",        "value": "L3"                 },
 *     { "trait_type": "Spécialité",   "value": "ISIL"               },
 *     { "trait_type": "Département",  "value": "Informatique"       },
 *     { "trait_type": "Mention",      "value": "Bien"               },
 *     { "trait_type": "Année",        "value": "2024-2025"          }
 *   ]
 * }
 */
contract DiplomaNFT {

    // ── ERC-721 minimal implementation (no OZ dependency for clarity) ──────
    // Using OpenZeppelin is fine — replace with:
    // import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
    // contract DiplomaNFT is ERC721 { ... }
    // and remove the ERC-721 section below.

    // ─── ERC-721 Storage ──────────────────────────────────────────────────
    string private _name   = "Diplome Universite Blida 1";
    string private _symbol = "DIPUB1";

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;

    // ── Diploma structs ────────────────────────────────────────────────────

    /**
     * @notice Input struct for each student in a batch
     * @dev    Struct avoids "stack too deep" when batch-minting
     */
    struct DiplomaInput {
        address student;
        string  fullName;
        string  matricule;
        string  dateOfBirth;
        string  placeOfBirth;
        string  cycle;           // "L3" or "M2"
        string  specialty;       // "SIQ", "ISIL", "AI", "Réseau"
        string  department;      // "Informatique"
        string  mention;         // "Passable", "Assez Bien", "Bien", "Très Bien"
        uint16  graduationYear;  // e.g. 2025
        string  cidMetadata;     // ipfs://CID  — JSON metadata on IPFS
        bytes32 pdfHash;         // SHA-256 of the original PDF diploma
    }

    /**
     * @notice On-chain diploma record — stored per tokenId
     */
    struct DiplomaRecord {
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
        uint256 mintedAt;
        uint256 batchId;      // links back to the MultiSig proposal
        bool    valid;        // false = revoked (exceptional cases only)
        string  revocationReason;
    }

    // ── State ──────────────────────────────────────────────────────────────

    uint256 private _tokenIdCounter;

    mapping(uint256 => DiplomaRecord) public diplomas;
    mapping(address => uint256[])     public studentTokens;
    mapping(string  => bool)          public matriculeUsed;  // prevent duplicates

    // Only this address can call mintBatch and revoke
    address public multiSigContract;
    address public daoContract;
    address public admin;

    bool private _multiSigSet;

    // ── Events ─────────────────────────────────────────────────────────────

    event DiplomaMinted(
        uint256 indexed tokenId,
        address indexed student,
        string  matricule,
        string  specialty,
        string  cycle,
        uint256 batchId
    );
    event DiplomaRevoked(
        uint256 indexed tokenId,
        address indexed revokedBy,
        string  reason
    );
    event MultiSigSet(address indexed multiSig);

    // ── ERC-721 Events ─────────────────────────────────────────────────────
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    // ── Modifiers ──────────────────────────────────────────────────────────

    modifier onlyMultiSig() {
        require(msg.sender == multiSigContract, "Only MultiSig can mint");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Admin only");
        _;
    }

    modifier tokenExists(uint256 tokenId) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        _;
    }

    // ── Constructor ────────────────────────────────────────────────────────

    constructor(address _dao) {
        admin       = msg.sender;
        daoContract = _dao;
    }

    // ── One-time MultiSig setup ────────────────────────────────────────────

    /**
     * @notice Set the authorized MultiSig contract address.
     * @dev    Can only be called ONCE after DiplomaMultiSig is deployed.
     *         This prevents any other address from ever minting.
     */
    function setMultiSig(address _multiSig) external onlyAdmin {
        require(!_multiSigSet,          "MultiSig already set");
        require(_multiSig != address(0),"Invalid address");
        multiSigContract = _multiSig;
        _multiSigSet     = true;
        emit MultiSigSet(_multiSig);
    }

    // ── Batch minting ──────────────────────────────────────────────────────

    /**
     * @notice Mint diplomas for an entire graduating batch.
     * @dev    Called by DiplomaMultiSig.execute() after threshold signatures.
     *         Uses DiplomaInput[] struct to avoid stack too deep.
     *         Gas note: ~80k gas per mint. For 200 students ≈ 16M gas.
     *         Split large batches into sub-batches if needed.
     * @param  inputs  Array of student diploma data
     * @param  batchId The MultiSig proposal ID this batch belongs to
     */
    function mintBatch(
        DiplomaInput[] calldata inputs,
        uint256 batchId
    ) external onlyMultiSig {
        require(inputs.length > 0,   "Empty batch");
        require(inputs.length <= 300,"Batch too large-split into sub-batches");

        for (uint256 i = 0; i < inputs.length; i++) {
            _mintOne(inputs[i], batchId);
        }
    }

    /**
     * @dev Internal single mint — separated to keep mintBatch() shallow
     */
   function _mintOne(
    DiplomaInput calldata inp,
    uint256 batchId
) internal {
    require(inp.student != address(0), "Invalid student address");
    require(bytes(inp.cidMetadata).length > 0, "Metadata CID required");
    require(inp.pdfHash != bytes32(0), "PDF hash required");
    require(!matriculeUsed[inp.matricule], "Matricule already used");

    uint256 tokenId = _tokenIdCounter++;

    // ERC-721 ownership
    _owners[tokenId] = inp.student;
    _balances[inp.student] += 1;

    // Use a storage pointer to avoid "Stack Too Deep"
    // We initialize the struct with basic data, then fill strings one by one
    DiplomaRecord storage record = diplomas[tokenId];
    
    record.student = inp.student;
    record.fullName = inp.fullName;
    record.matricule = inp.matricule;
    record.dateOfBirth = inp.dateOfBirth;
    record.placeOfBirth = inp.placeOfBirth;
    record.cycle = inp.cycle;
    record.specialty = inp.specialty;
    record.department = inp.department;
    record.mention = inp.mention;
    record.graduationYear = inp.graduationYear;
    record.cidMetadata = inp.cidMetadata;
    record.pdfHash = inp.pdfHash;
    record.mintedAt = block.timestamp;
    record.batchId = batchId;
    record.valid = true;

    studentTokens[inp.student].push(tokenId);
    matriculeUsed[inp.matricule] = true;

    emit Transfer(address(0), inp.student, tokenId);
    emit DiplomaMinted(tokenId, inp.student, inp.matricule, inp.specialty, inp.cycle, batchId);
}

    // ── Revocation ─────────────────────────────────────────────────────────

    /**
     * @notice Revoke a diploma in exceptional cases (fraud, error).
     * @dev    Only callable by MultiSig (requires Dean + Rector signature).
     *         The NFT is NOT burned — it stays on-chain but marked invalid.
     *         This ensures the revocation is also permanently recorded.
     */
    function revokeDiploma(
        uint256 tokenId,
        string calldata reason
    ) external onlyMultiSig tokenExists(tokenId) {
        require(diplomas[tokenId].valid,       "Already revoked");
        require(bytes(reason).length > 0,      "Reason required");

        diplomas[tokenId].valid             = false;
        diplomas[tokenId].revocationReason  = reason;

        emit DiplomaRevoked(tokenId, msg.sender, reason);
    }

    // ── Public verification ────────────────────────────────────────────────

    /**
    /**
     * @notice Employer-facing verification.
     * @dev Returning the struct avoids stack depth issues.
     * @param tokenId The unique ID of the diploma NFT.
     * @return A DiplomaRecord struct containing all student and academic data.
     */
    function verifyDiploma(uint256 tokenId) 
        external 
        view 
        tokenExists(tokenId) 
        returns (DiplomaRecord memory) 
    {
        return diplomas[tokenId];
    }
    /**
     * @notice Get all token IDs owned by a student wallet.
     */
    function getStudentDiplomas(
        address student
    ) external view returns (uint256[] memory) {
        return studentTokens[student];
    }

    /**
     * @notice Full diploma record — for the student dashboard.
     */
    function getDiploma(
        uint256 tokenId
    ) external view tokenExists(tokenId) returns (DiplomaRecord memory) {
        return diplomas[tokenId];
    }

    // ── ERC-721 interface (Soulbound) ──────────────────────────────────────

    function name()   external view returns (string memory) { return _name;   }
    function symbol() external view returns (string memory) { return _symbol; }

    function ownerOf(uint256 tokenId)
        external view tokenExists(tokenId) returns (address)
    {
        return _owners[tokenId];
    }

    function balanceOf(address owner) external view returns (uint256) {
        require(owner != address(0), "Zero address");
        return _balances[owner];
    }

    /**
     * @notice tokenURI returns the IPFS metadata CID for this diploma.
     * @dev    Follows ERC-721 metadata standard.
     *         Returns "ipfs://CID" — frontend resolves via Pinata gateway.
     */
    function tokenURI(uint256 tokenId)
        external view tokenExists(tokenId) returns (string memory)
    {
        return diplomas[tokenId].cidMetadata;
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    // ── Soulbound: block ALL transfers ─────────────────────────────────────

    /**
     * @notice Transfers are permanently disabled.
     * @dev    Reverts on any transfer attempt including approve/safeTransfer.
     *         Minting (from == address(0)) is the only allowed operation.
     */
    function transferFrom(address, address, uint256) external pure {
        revert("Soulbound: diploma is non-transferable");
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert("Soulbound: diploma is non-transferable");
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert("Soulbound: diploma is non-transferable");
    }

    function approve(address, uint256) external pure {
        revert("Soulbound: approvals disabled");
    }

    function setApprovalForAll(address, bool) external pure {
        revert("Soulbound: approvals disabled");
    }

    function getApproved(uint256) external pure returns (address) {
        return address(0);
    }

    function isApprovedForAll(address, address) external pure returns (bool) {
        return false;
    }

    // ── ERC-165 ────────────────────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == 0x80ac58cd || // ERC-721
            interfaceId == 0x5b5e139f || // ERC-721Metadata
            interfaceId == 0x01ffc9a7;   // ERC-165
    }
}
