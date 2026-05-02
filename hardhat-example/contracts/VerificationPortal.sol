// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Update the interface to use the Struct we created earlier
interface ICredential {
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

    function verifyCredential(uint256 tokenId) external view returns (VerificationResult memory);
    function getStudentCredentials(address student) external view returns (uint256[] memory);
}

interface IGrades {
    function getStudentGPA(address student) external view returns (uint8, uint256);
}

/**
 * @title VerificationPortal
 * @notice Public read-only verification for employers and institutions
 */
contract VerificationPortal {

    ICredential public credentialContract;
    IGrades     public gradesContract;

    // To fix the return side, we group the response arrays
    struct FullProfileResponse {
        uint256[] tokenIds;
        bool[]    validities;
        string[]  credTypes;
        string[]  mentions;
        string[]  academicYears;
        uint8     gpa;
        uint256   totalModules;
    }

    struct VerificationLog {
        address checkedWallet;
        address checkedBy;
        string  employerName;
        uint256 checkedAt;
        bool    resultValid;
    }

    VerificationLog[] public verificationLogs;

    event CredentialVerified(
        address indexed studentWallet,
        address indexed verifier,
        bool    valid,
        uint256 timestamp
    );

    constructor(address _credential, address _grades) {
        credentialContract = ICredential(_credential);
        gradesContract     = IGrades(_grades);
    }

    /**
     * @notice Returns a full student profile in one stack-safe call
     */
    function verifyStudent(
        address studentWallet,
        string memory employerName
    ) public returns (FullProfileResponse memory response) {
        
        uint256[] memory ids = credentialContract.getStudentCredentials(studentWallet);
        uint256 n = ids.length;

        response.tokenIds = ids;
        response.validities = new bool[](n);
        response.credTypes = new string[](n);
        response.mentions = new string[](n);
        response.academicYears = new string[](n);

        bool anyValid = false;

        // --- SCOPE BLOCK START ---
        {
            for (uint256 i = 0; i < n; i++) {
                // We keep 'res' inside this block so it's cleared after the loop
                ICredential.VerificationResult memory res = credentialContract.verifyCredential(ids[i]);

                response.validities[i] = res.isValid;
                response.credTypes[i]  = res.credTypeName;
                response.mentions[i]   = res.mention;
                response.academicYears[i] = res.academicYear;
                
                if (res.isValid) anyValid = true;
            }
        }
        // --- SCOPE BLOCK END (Stack is now clean) ---

        // Now we can safely load GPA without hitting the stack limit
        (response.gpa, response.totalModules) = gradesContract.getStudentGPA(studentWallet);

        // Record log
        _logVerification(studentWallet, employerName, anyValid);

        emit CredentialVerified(studentWallet, msg.sender, anyValid, block.timestamp);
        return response;
    }

    // Helper to move even more variables off the main stack
    function _logVerification(address _student, string memory _emp, bool _valid) internal {
        verificationLogs.push(VerificationLog({
            checkedWallet: _student,
            checkedBy:     msg.sender,
            employerName:  _emp,
            checkedAt:     block.timestamp,
            resultValid:   _valid
        }));
    }
    /**
     * @notice Quick check — updated to handle the struct return
     */
    function hasValidDiploma(address studentWallet) public view returns (bool) {
        uint256[] memory tokens = credentialContract.getStudentCredentials(studentWallet);
        for (uint256 i = 0; i < tokens.length; i++) {
            ICredential.VerificationResult memory res = credentialContract.verifyCredential(tokens[i]);
            if (res.isValid) return true;
        }
        return false;
    }

    function getVerificationCount() public view returns (uint256) {
        return verificationLogs.length;
    }
}