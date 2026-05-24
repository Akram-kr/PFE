// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FileStorage
 * @notice End-to-End Encrypted, Sharded, Distributed Storage System
 * @dev Files are encrypted client-side with AES-GCM before upload.
 *      Each file is split into exactly SHARD_COUNT shards and stored on IPFS.
 *      Only CIDs, metadata, and the encryption IV are stored on-chain.
 *      The encryption key NEVER touches the blockchain.
 */
contract FileStorage {

    // ─────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────

    /// @notice Every file must be split into exactly 3 shards before upload
    uint256 public constant SHARD_COUNT = 3;

    /// @notice Maximum size of a single file (100 MB in bytes)
    uint256 public constant MAX_FILE_SIZE = 100 * 1024 * 1024;

    /// @notice AES-GCM IV must be exactly 12 bytes, encoded as 24 hex characters
    uint256 public constant IV_LENGTH = 24;

    // ─────────────────────────────────────────────
    // Data Structures
    // ─────────────────────────────────────────────

    /**
     * @notice Represents a single uploaded file
     * @dev ipfsHashes always has exactly SHARD_COUNT (3) entries
     *      fileHash is the SHA-256 of the ORIGINAL file (before encryption)
     *      used for integrity verification after reassembly + decryption
     */
    struct File {
        string[3] ipfsHashes;   // CID of each shard [shard0, shard1, shard2]
        string fileName;         // original file name (e.g. "report.pdf")
        string fileExtension;    // file extension (e.g. "pdf", "png", "docx")
        uint256 fileSize;        // size of original file in bytes (before encryption)
        uint256 timestamp;       // block.timestamp when file was uploaded
        string encryptionIv;     // AES-GCM IV (24 hex chars = 12 bytes), stored for decryption
        bytes32 fileHash;        // SHA-256 of original file — used for integrity check after decryption
        uint256 version;         // version number, starts at 1, increments on update
        bool exists;             // soft-delete flag — false means deleted
    }

    /**
     * @notice Represents an encrypted AES key shared with another wallet
     * @dev The AES key is encrypted client-side with the recipient's ETH public key (ECIES)
     *      so only the recipient's private key can decrypt it
     */
    struct SharedAccess {
        bytes encryptedKey;  // AES key encrypted with recipient's ETH public key
        bool active;         // false = revoked
    }

    /// @notice Helper struct to track who shared what with whom
    struct ShareReference {
        address owner;
        uint256 fileIndex;
    }

    /**
     * @notice Input struct for batch uploads
     */
    struct FileInput {
        string[3] ipfsHashes;
        string fileName;
        string fileExtension;
        uint256 fileSize;
        string encryptionIv;
        bytes32 fileHash;
    }

    // ─────────────────────────────────────────────
    // State Variables
    // ─────────────────────────────────────────────

    /// @notice All files for each user address
    mapping(address => File[]) private userFiles;

    /// @notice Total bytes used per wallet (based on original file sizes)
    mapping(address => uint256) public totalStorageUsed;

    /**
     * @notice Sharing access control
     * @dev owner => fileIndex => recipient => SharedAccess
     */
    mapping(address => mapping(uint256 => mapping(address => SharedAccess))) private sharedAccess;

    /**
     * @notice Tracks which files have been shared with a given address
     * @dev recipient => list of (owner, fileIndex) pairs
     */
    mapping(address => ShareReference[]) private sharedWithMe;

    // ─────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────

    event FileUploaded(
        address indexed user,
        uint256 indexed fileIndex,
        string fileName,
        uint256 fileSize,
        string fileExtension,
        uint256 timestamp,
        bytes32 fileHash
    );

    event FileDeleted(
        address indexed user,
        uint256 indexed fileIndex,
        string fileName,
        uint256 freedSize
    );

    event FileUpdated(
        address indexed user,
        uint256 indexed fileIndex,
        uint256 newVersion,
        bytes32 newFileHash
    );

    event FileRenamed(
        address indexed user,
        uint256 indexed fileIndex,
        string oldName,
        string newName
    );

    event FileShared(
        address indexed owner,
        address indexed recipient,
        uint256 indexed fileIndex
    );

    event FileShareRevoked(
        address indexed owner,
        address indexed recipient,
        uint256 indexed fileIndex
    );

    // ─────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────

    modifier validFile(address user, uint256 index) {
        require(index < userFiles[user].length, "Invalid file index");
        require(userFiles[user][index].exists, "File has been deleted");
        _;
    }

    // ─────────────────────────────────────────────
    // Internal Upload Logic
    // ─────────────────────────────────────────────

    function _validateUploadInputs(
        string[3] memory _ipfsHashes,
        string memory _fileName,
        string memory _encryptionIv,
        uint256 _fileSize,
        bytes32 _fileHash
    ) internal pure {
        require(bytes(_ipfsHashes[0]).length > 0, "Shard 0 CID cannot be empty");
        require(bytes(_ipfsHashes[1]).length > 0, "Shard 1 CID cannot be empty");
        require(bytes(_ipfsHashes[2]).length > 0, "Shard 2 CID cannot be empty");
        require(bytes(_fileName).length > 0, "File name cannot be empty");
        require(_fileSize > 0, "File size must be positive");
        require(_fileSize <= MAX_FILE_SIZE, "File exceeds 100MB limit");
        require(bytes(_encryptionIv).length == IV_LENGTH, "IV must be exactly 24 hex characters");
        require(_fileHash != bytes32(0), "File hash cannot be zero");
    }

    function _upload(
        string[3] memory _ipfsHashes,
        string memory _fileName,
        string memory _fileExtension,
        uint256 _fileSize,
        string memory _encryptionIv,
        bytes32 _fileHash
    ) internal {
        _validateUploadInputs(_ipfsHashes, _fileName, _encryptionIv, _fileSize, _fileHash);

        {
            File memory newFile = File({
                ipfsHashes    : _ipfsHashes,
                fileName      : _fileName,
                fileExtension : _fileExtension,
                fileSize      : _fileSize,
                timestamp     : block.timestamp,
                encryptionIv  : _encryptionIv,
                fileHash      : _fileHash,
                version       : 1,
                exists        : true
            });

            userFiles[msg.sender].push(newFile);
            totalStorageUsed[msg.sender] += _fileSize;

            uint256 newIndex = userFiles[msg.sender].length - 1;

            emit FileUploaded(
                msg.sender, newIndex, _fileName, _fileSize,
                _fileExtension, block.timestamp, _fileHash
            );
        }
    }

    // ─────────────────────────────────────────────
    // Public Write Functions
    // ─────────────────────────────────────────────

    function uploadFile(
        string[3] memory _ipfsHashes,
        string memory _fileName,
        string memory _fileExtension,
        uint256 _fileSize,
        string memory _encryptionIv,
        bytes32 _fileHash
    ) public {
        _upload(_ipfsHashes, _fileName, _fileExtension, _fileSize, _encryptionIv, _fileHash);
    }

    function uploadMultipleFiles(FileInput[] memory files) public {
        require(files.length > 0, "No files provided");
        require(files.length <= 10, "Maximum 10 files per batch");

        for (uint256 i = 0; i < files.length; i++) {
            _upload(
                files[i].ipfsHashes,
                files[i].fileName,
                files[i].fileExtension,
                files[i].fileSize,
                files[i].encryptionIv,
                files[i].fileHash
            );
        }
    }

    function deleteFile(uint256 index) public validFile(msg.sender, index) {
        File storage fileToDelete = userFiles[msg.sender][index];
        totalStorageUsed[msg.sender] -= fileToDelete.fileSize;
        fileToDelete.exists = false;
        emit FileDeleted(msg.sender, index, fileToDelete.fileName, fileToDelete.fileSize);
    }

    function updateFile(
        uint256 index,
        string[3] memory _ipfsHashes,
        uint256 _fileSize,
        string memory _encryptionIv,
        bytes32 _fileHash
    ) public validFile(msg.sender, index) {
        require(bytes(_ipfsHashes[0]).length > 0, "Shard 0 CID cannot be empty");
        require(bytes(_ipfsHashes[1]).length > 0, "Shard 1 CID cannot be empty");
        require(bytes(_ipfsHashes[2]).length > 0, "Shard 2 CID cannot be empty");
        require(_fileSize > 0 && _fileSize <= MAX_FILE_SIZE, "Invalid file size");
        require(bytes(_encryptionIv).length == IV_LENGTH, "IV must be exactly 24 hex characters");
        require(_fileHash != bytes32(0), "File hash cannot be zero");

        File storage f = userFiles[msg.sender][index];

        totalStorageUsed[msg.sender] -= f.fileSize;
        totalStorageUsed[msg.sender] += _fileSize;

        f.ipfsHashes   = _ipfsHashes;
        f.fileSize     = _fileSize;
        f.encryptionIv = _encryptionIv;
        f.fileHash     = _fileHash;
        f.timestamp    = block.timestamp;
        f.version      += 1;

        emit FileUpdated(msg.sender, index, f.version, _fileHash);
    }

    function renameFile(
        uint256 index,
        string memory newName
    ) public validFile(msg.sender, index) {
        require(bytes(newName).length > 0, "New name cannot be empty");
        string memory oldName = userFiles[msg.sender][index].fileName;
        userFiles[msg.sender][index].fileName = newName;
        emit FileRenamed(msg.sender, index, oldName, newName);
    }

    function shareFile(
        uint256 index,
        address recipient,
        bytes memory encryptedKeyForRecipient
    ) public validFile(msg.sender, index) {
        require(recipient != address(0), "Invalid recipient address");
        require(recipient != msg.sender, "Cannot share with yourself");
        require(encryptedKeyForRecipient.length > 0, "Encrypted key cannot be empty");

        sharedAccess[msg.sender][index][recipient] = SharedAccess({
            encryptedKey : encryptedKeyForRecipient,
            active       : true
        });

        sharedWithMe[recipient].push(ShareReference({
            owner     : msg.sender,
            fileIndex : index
        }));

        emit FileShared(msg.sender, recipient, index);
    }

    function revokeShare(uint256 index, address recipient) public {
        require(index < userFiles[msg.sender].length, "Invalid file index");
        require(sharedAccess[msg.sender][index][recipient].active, "No active share to revoke");
        sharedAccess[msg.sender][index][recipient].active = false;
        emit FileShareRevoked(msg.sender, recipient, index);
    }

    // ─────────────────────────────────────────────
    // Public Read Functions
    // ─────────────────────────────────────────────

    function getUserFiles() public view returns (File[] memory) {
        uint256 count = _countActiveFiles(msg.sender);
        File[] memory result = new File[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < userFiles[msg.sender].length; i++) {
            if (userFiles[msg.sender][i].exists) {
                result[j] = userFiles[msg.sender][i];
                j++;
            }
        }
        return result;
    }

    function getFileAt(uint256 index) public view validFile(msg.sender, index) returns (File memory) {
        return userFiles[msg.sender][index];
    }

    function getFileCount() public view returns (uint256) {
        return _countActiveFiles(msg.sender);
    }

    function getSharedKey(
        address owner,
        uint256 fileIndex
    ) public view returns (bytes memory) {
        SharedAccess memory access = sharedAccess[owner][fileIndex][msg.sender];
        require(access.active, "No active access grant for this file");
        return access.encryptedKey;
    }

    function getSharedFile(
        address owner,
        uint256 fileIndex
    ) public view returns (File memory file, bytes memory encryptedKey) {
        SharedAccess memory access = sharedAccess[owner][fileIndex][msg.sender];
        require(access.active, "No active access grant for this file");
        require(fileIndex < userFiles[owner].length, "Invalid file index");
        require(userFiles[owner][fileIndex].exists, "File has been deleted");
        file         = userFiles[owner][fileIndex];
        encryptedKey = access.encryptedKey;
    }

    function getFilesSharedWithMe() public view returns (
        address[] memory owners,
        uint256[] memory fileIndices,
        File[]    memory files,
        bytes[]   memory encryptedKeys
    ) {
        ShareReference[] memory refs = sharedWithMe[msg.sender];
        uint256 activeCount = _countActiveShares(refs);

        owners       = new address[](activeCount);
        fileIndices  = new uint256[](activeCount);
        files        = new File[](activeCount);
        encryptedKeys = new bytes[](activeCount);

        _populateSharedFiles(refs, owners, fileIndices, files, encryptedKeys);
    }

    function hasAccess(
        address owner,
        uint256 fileIndex,
        address viewer
    ) public view returns (bool) {
        if (owner == viewer) return true;
        return sharedAccess[owner][fileIndex][viewer].active;
    }

    // ─────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────

    function _countActiveFiles(address user) internal view returns (uint256 count) {
        for (uint256 i = 0; i < userFiles[user].length; i++) {
            if (userFiles[user][i].exists) count++;
        }
    }

    function _countActiveShares(ShareReference[] memory refs) internal view returns (uint256 count) {
        for (uint256 i = 0; i < refs.length; i++) {
            ShareReference memory ref = refs[i];
            if (
                sharedAccess[ref.owner][ref.fileIndex][msg.sender].active &&
                ref.fileIndex < userFiles[ref.owner].length &&
                userFiles[ref.owner][ref.fileIndex].exists
            ) count++;
        }
    }

    function _populateSharedFiles(
        ShareReference[] memory refs,
        address[] memory owners,
        uint256[] memory fileIndices,
        File[]    memory files,
        bytes[]   memory encryptedKeys
    ) internal view {
        uint256 j = 0;
        for (uint256 i = 0; i < refs.length; i++) {
            ShareReference memory ref  = refs[i];
            SharedAccess   memory acc  = sharedAccess[ref.owner][ref.fileIndex][msg.sender];
            if (
                acc.active &&
                ref.fileIndex < userFiles[ref.owner].length &&
                userFiles[ref.owner][ref.fileIndex].exists
            ) {
                owners[j]       = ref.owner;
                fileIndices[j]  = ref.fileIndex;
                files[j]        = userFiles[ref.owner][ref.fileIndex];
                encryptedKeys[j] = acc.encryptedKey;
                j++;
            }
        }
    }
}
