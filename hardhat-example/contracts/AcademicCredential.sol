// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title AcademicCredential
 * @notice Soulbound NFT diplomas for Algerian LMD system
 * @dev Added scoping blocks to ensure the compiler clears stack slots immediately.
 */
contract AcademicCredential is ERC721 {

    // ... [Enums and Structs remain the same as your previous version] ...
    
    enum CredentialType {
        LICENCE, MASTER, DOCTORAT, ATTESTATION_REUSSITE, 
        ATTESTATION_INSCRIPTION, RELEVE_DE_NOTES, CERTIFICAT_SCOLARITE 
    }

    struct CredentialInput {
        CredentialType credType;
        string  fullName;
        string  matricule;
        string  faculty;
        string  department;
        string  mention;
        string  academicYear;
        string  ipfsCID;
        bytes32 documentHash;
    }

    struct Credential {
        CredentialType credType;
        string  fullName;
        string  matricule;
        string  faculty;
        string  department;
        string  mention;
        string  academicYear;
        string  ipfsCID;
        bytes32 documentHash;
        address issuedBy;
        address issuedTo;
        uint256 issuedAt;
        bool    valid;
        string  revocationReason;
    }

    struct VerificationResult {
        bool    isValid;
        string  credTypeName;
        string  fullName;
        string  matricule;
        string  mention;
        string  academicYear;
        bytes32 documentHash;
        uint256 issuedAt;
    }

    uint256 private _tokenIdCounter;
    mapping(uint256 => Credential) public credentials;
    mapping(address => uint256[])  public studentTokens;
    mapping(address => bool)       public authorizedIssuers;
    address public daoContract;

    event CredentialIssued(uint256 indexed tokenId, address indexed student, CredentialType credType, string matricule);
    event CredentialRevoked(uint256 indexed tokenId, address indexed revokedBy, string reason);

    modifier onlyIssuer() {
        require(authorizedIssuers[msg.sender], "Not authorized issuer");
        _;
    }

    constructor(address _dao) ERC721("UniChain DZ Credential", "UNIDZ") {
        daoContract = _dao;
        authorizedIssuers[msg.sender] = true;
    }

    function addIssuer(address issuer) external {
        require(authorizedIssuers[msg.sender], "Not authorized");
        authorizedIssuers[issuer] = true;
    }

    // ── Issue credential (Updated with Blocks) ──────────────────────────────

    function issueCredential(
        address student,
        CredentialInput calldata inp
    ) external onlyIssuer returns (uint256) {
        require(student != address(0), "Invalid student address");

        uint256 tokenId = _tokenIdCounter++;
        _safeMint(student, tokenId);

        studentTokens[student].push(tokenId);

        emit CredentialIssued(tokenId, student, inp.credType, inp.matricule);
        return tokenId;
    }

    // ── Verify (Updated with Blocks) ────────────────────────────────────────

    function verifyCredential(uint256 tokenId) external view returns (VerificationResult memory result) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        Credential storage c = credentials[tokenId];

        result.isValid = c.valid;
        result.credTypeName = _getCredentialTypeName(c.credType);
        result.fullName = c.fullName;
        result.matricule = c.matricule;
        result.mention = c.mention;
        result.academicYear = c.academicYear;
        result.documentHash = c.documentHash;
        result.issuedAt = c.issuedAt;
        return result;
    }

    function _getCredentialTypeName(CredentialType credType) internal pure returns (string memory) {
        if (credType == CredentialType.LICENCE) return "Licence (Bac+3)";
        if (credType == CredentialType.MASTER) return "Master (Bac+5)";
        if (credType == CredentialType.DOCTORAT) return "Doctorat";
        if (credType == CredentialType.ATTESTATION_REUSSITE) return "Attestation de Reussite";
        if (credType == CredentialType.ATTESTATION_INSCRIPTION) return "Attestation d'Inscription";
        if (credType == CredentialType.RELEVE_DE_NOTES) return "Releve de Notes";
        return "Certificat de Scolarite";
    }

    function revokeCredential(uint256 tokenId, string calldata reason) external onlyIssuer {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(credentials[tokenId].valid, "Already revoked");

        credentials[tokenId].valid = false;
        credentials[tokenId].revocationReason = reason;

        emit CredentialRevoked(tokenId, msg.sender, reason);
    }

    function getStudentCredentials(address student) external view returns (uint256[] memory) {
        return studentTokens[student];
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0), "Soulbound: non-transferable");
        return super._update(to, tokenId, auth);
    }
}
