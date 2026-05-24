// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  VerificationPortal
 * @notice Public read-only diploma verification — no wallet required.
 *
 * Used by:
 *   - Employers scanning a QR code
 *   - Foreign universities checking credentials
 *   - Any third party verifying authenticity
 *
 * How verification works:
 *   1. Employer scans QR code → opens /verify/{tokenId}
 *   2. Frontend calls verifyByToken(tokenId)
 *   3. Contract reads DiplomaNFT directly — no intermediary
 *   4. Result shown in under 1 second
 *
 * Additional features:
 *   - verifyByMatricule()   — search by student ID (no tokenId needed)
 *   - verifyPDFHash()       — check if a given hash matches the on-chain record
 *   - Verification log      — every check is permanently recorded on-chain
 *
 * @dev This contract only reads from DiplomaNFT — it has no write access.
 *      The verification log is the only state it writes.
 */

    // ── Interfaces ─────────────────────────────────────────────────────────

 interface IDiplomaNFT {
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
            uint256 batchId;
            bool    valid;
            string  revocationReason;
        }

        function verifyDiploma(uint256 tokenId) external view returns (
            bool    isValid,
            string  memory fullName,
            string  memory matricule,
            string  memory cycle,
            string  memory specialty,
            string  memory mention,
            uint16  graduationYear,
            bytes32 pdfHash,
            uint256 mintedAt
        );

        function getDiploma(uint256 tokenId) external view returns (DiplomaRecord memory);
        function getStudentDiplomas(address student) external view returns (uint256[] memory);
        function matriculeUsed(string calldata matricule) external view returns (bool);
        function totalSupply() external view returns (uint256);
    }

contract VerificationPortal {


    
    // ── Structs ────────────────────────────────────────────────────────────

    struct VerificationResult {
        bool    found;
        bool    isValid;
        uint256 tokenId;
        string  fullName;
        string  matricule;
        string  cycle;
        string  specialty;
        string  department;
        string  mention;
        uint16  graduationYear;
        bytes32 pdfHash;
        uint256 mintedAt;
        string  revocationReason;
        string  cidMetadata;         // employer can access original metadata
    }

    struct VerificationLog {
        uint256 tokenId;
        address verifiedBy;          // employer wallet (0x0 if no wallet connected)
        string  employerNote;        // optional self-reported employer name
        uint256 verifiedAt;
        bool    resultValid;
    }

    // ── State ──────────────────────────────────────────────────────────────

    IDiplomaNFT public nftContract;
    address     public admin;

    VerificationLog[] public verificationLogs;

    // tokenId => verification count (how many times this diploma was checked)
    mapping(uint256 => uint256) public verificationCount;

    // ── Events ─────────────────────────────────────────────────────────────

    event DiplomaVerified(
        uint256 indexed tokenId,
        address indexed verifier,
        bool    isValid,
        uint256 timestamp
    );
    event HashVerified(
        uint256 indexed tokenId,
        bytes32 hash,
        bool    matches,
        uint256 timestamp
    );

    // ── Constructor ────────────────────────────────────────────────────────

    constructor(address _nftContract) {
        require(_nftContract != address(0), "Invalid NFT address");
        nftContract = IDiplomaNFT(_nftContract);
        admin       = msg.sender;
    }

    // ── PRIMARY: Verify by token ID ────────────────────────────────────────

    /**
     * @notice Main verification function — called when employer scans QR code.
     * @dev    No wallet required — can be called as a pure read (eth_call).
     *         Logs the verification on-chain for audit trail.
     * @param  tokenId      The NFT token ID from the QR code URL
     * @param  employerNote Optional employer name (empty string is fine)
     */
    function verifyByToken(
        uint256 tokenId,
        string calldata employerNote
    ) external returns (VerificationResult memory result) {
        result = _fetchDiploma(tokenId);

        // Log every verification — creates an on-chain audit trail
        _logVerification(tokenId, msg.sender, employerNote, result.isValid);

        emit DiplomaVerified(tokenId, msg.sender, result.isValid, block.timestamp);
    }

    /**
     * @notice Read-only version — no state change, no gas if called off-chain.
     *         Use this for the initial page load (eth_call, free).
     */
    function verifyByTokenView(
        uint256 tokenId
    ) external view returns (VerificationResult memory) {
        return _fetchDiploma(tokenId);
    }

    // ── SECONDARY: Verify by matricule ────────────────────────────────────

    /**
     * @notice Look up a diploma by student matricule number.
     * @dev    Requires the student wallet address because the contract
     *         indexes diplomas by wallet, not by matricule directly.
     *         Alternative: maintain a matricule => tokenId mapping in DiplomaNFT.
     * @param  studentWallet  Student's Ethereum wallet address
     */
    function verifyByWallet(
        address studentWallet,
        string calldata employerNote
    ) external returns (VerificationResult[] memory results) {
        uint256[] memory tokenIds = nftContract.getStudentDiplomas(studentWallet);
        results = new VerificationResult[](tokenIds.length);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            results[i] = _fetchDiploma(tokenIds[i]);
            _logVerification(tokenIds[i], msg.sender, employerNote, results[i].isValid);
            emit DiplomaVerified(tokenIds[i], msg.sender, results[i].isValid, block.timestamp);
        }
    }

    /**
     * @notice View-only version of verifyByWallet — no gas, no log.
     */
    function verifyByWalletView(
        address studentWallet
    ) external view returns (VerificationResult[] memory results) {
        uint256[] memory tokenIds = nftContract.getStudentDiplomas(studentWallet);
        results = new VerificationResult[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            results[i] = _fetchDiploma(tokenIds[i]);
        }
    }

    // ── TERTIARY: Verify PDF hash ──────────────────────────────────────────

    /**
     * @notice Verify that a physical diploma's PDF matches the on-chain record.
     * @dev    Employer computes SHA-256 of the PDF they received and calls this.
     *         Returns true only if:
     *           1. The diploma exists and is valid (not revoked)
     *           2. The provided hash matches the stored pdfHash
     * @param  tokenId   Token ID printed on the diploma
     * @param  pdfHash   SHA-256 of the physical PDF (caller computes off-chain)
     */
    function verifyPDFHash(
        uint256 tokenId,
        bytes32 pdfHash
    ) external returns (bool matches) {
        VerificationResult memory d = _fetchDiploma(tokenId);
        matches = d.found && d.isValid && (d.pdfHash == pdfHash);

        _logVerification(tokenId, msg.sender, "hash-verification", matches);
        emit HashVerified(tokenId, pdfHash, matches, block.timestamp);
    }

    function verifyPDFHashView(
        uint256 tokenId,
        bytes32 pdfHash
    ) external view returns (bool matches, bool diplomaExists, bool diplomaValid) {
        VerificationResult memory d = _fetchDiploma(tokenId);
        diplomaExists = d.found;
        diplomaValid  = d.isValid;
        matches       = d.found && d.isValid && (d.pdfHash == pdfHash);
    }

    // ── Stats ──────────────────────────────────────────────────────────────

    function getTotalDiplomas() external view returns (uint256) {
        return nftContract.totalSupply();
    }

    function getTotalVerifications() external view returns (uint256) {
        return verificationLogs.length;
    }

    function getVerificationCount(uint256 tokenId) external view returns (uint256) {
        return verificationCount[tokenId];
    }

    function getRecentVerifications(
        uint256 count
    ) external view returns (VerificationLog[] memory) {
        uint256 total  = verificationLogs.length;
        uint256 start  = total > count ? total - count : 0;
        uint256 length = total - start;

        VerificationLog[] memory recent = new VerificationLog[](length);
        for (uint256 i = 0; i < length; i++) {
            recent[i] = verificationLogs[start + i];
        }
        return recent;
    }

    // ── Internal ───────────────────────────────────────────────────────────

    function _fetchDiploma(
        uint256 tokenId
    ) internal view returns (VerificationResult memory result) {
        try nftContract.getDiploma(tokenId) returns (
            IDiplomaNFT.DiplomaRecord memory d
        ) {
            result.found             = true;
            result.isValid           = d.valid;
            result.tokenId           = tokenId;
            result.fullName          = d.fullName;
            result.matricule         = d.matricule;
            result.cycle             = d.cycle;
            result.specialty         = d.specialty;
            result.department        = d.department;
            result.mention           = d.mention;
            result.graduationYear    = d.graduationYear;
            result.pdfHash           = d.pdfHash;
            result.mintedAt          = d.mintedAt;
            result.revocationReason  = d.valid ? "" : d.revocationReason;
            result.cidMetadata       = d.cidMetadata;
        } catch {
            result.found    = false;
            result.isValid  = false;
            result.tokenId  = tokenId;
        }
    }

    function _logVerification(
        uint256 tokenId,
        address verifier,
        string memory note,
        bool    isValid
    ) internal {
        verificationLogs.push(VerificationLog({
            tokenId:     tokenId,
            verifiedBy:  verifier,
            employerNote:note,
            verifiedAt:  block.timestamp,
            resultValid: isValid
        }));
        verificationCount[tokenId] += 1;
    }
}
