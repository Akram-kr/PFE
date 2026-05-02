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

    /// @notice Maximum total storage per wallet (1 GB in bytes)
    uint256 public constant MAX_STORAGE_BYTES = 1 * 1024 * 1024 * 1024;

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
     *      Stores the AES key encrypted specifically for the recipient
     */
    mapping(address => mapping(uint256 => mapping(address => SharedAccess))) private sharedAccess;

    /**
     * @notice Tracks which files have been shared with a given address
     * @dev recipient => list of (owner, fileIndex) pairs
     *      Used by getFilesSharedWithMe() to avoid scanning all wallets
     */
    mapping(address => ShareReference[]) private sharedWithMe;

    /// @notice Helper struct to track who shared what with whom
    struct ShareReference {
        address owner;
        uint256 fileIndex;
    }

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

    /// @dev Reverts if the file index is out of bounds or the file was soft-deleted
    modifier validFile(address user, uint256 index) {
        require(index < userFiles[user].length, "Invalid file index");
        require(userFiles[user][index].exists, "File has been deleted");
        _;
    }

    // ─────────────────────────────────────────────
    // Internal Upload Logic
    // ─────────────────────────────────────────────

    /**
     * @notice Validates all file inputs before storage
     */
    function _validateUploadInputs(
        string[3] memory _ipfsHashes,
        string memory _fileName,
        string memory _encryptionIv,
        uint256 _fileSize,
        bytes32 _fileHash
    ) internal view {
        // Validate all 3 shard CIDs are non-empty
        require(bytes(_ipfsHashes[0]).length > 0, "Shard 0 CID cannot be empty");
        require(bytes(_ipfsHashes[1]).length > 0, "Shard 1 CID cannot be empty");
        require(bytes(_ipfsHashes[2]).length > 0, "Shard 2 CID cannot be empty");

        // Validate file metadata
        require(bytes(_fileName).length > 0, "File name cannot be empty");
        require(_fileSize > 0, "File size must be positive");
        require(_fileSize <= MAX_FILE_SIZE, "File exceeds 100MB limit");

        // Validate AES-GCM IV 
        require(bytes(_encryptionIv).length == IV_LENGTH, "IV must be exactly 24 hex characters");

        // Validate file hash
        require(_fileHash != bytes32(0), "File hash cannot be zero");

        // Enforce per-wallet storage quota
        require(
            totalStorageUsed[msg.sender] + _fileSize <= MAX_STORAGE_BYTES,
            "Storage quota exceeded (1GB max)"
        );
    }

    /**
     * @notice Core upload logic with reduced stack usage via separated validation
     */
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
                ipfsHashes: _ipfsHashes,
                fileName: _fileName,
                fileExtension: _fileExtension,
                fileSize: _fileSize,
                timestamp: block.timestamp,
                encryptionIv: _encryptionIv,
                fileHash: _fileHash,
                version: 1,
                exists: true
            });

            userFiles[msg.sender].push(newFile);
            totalStorageUsed[msg.sender] += _fileSize;

            uint256 newIndex = userFiles[msg.sender].length - 1;

            emit FileUploaded(
                msg.sender,
                newIndex,
                _fileName,
                _fileSize,
                _fileExtension,
                block.timestamp,
                _fileHash
            );
        }
    }

    // ─────────────────────────────────────────────
    // Public Write Functions
    // ─────────────────────────────────────────────

    /**
     * @notice Upload a single encrypted, sharded file
     * @param _ipfsHashes Fixed array of exactly 3 IPFS CIDs, one per shard
     * @param _fileName   Original file name before encryption
     * @param _fileExtension File extension (pdf, png, etc.)
     * @param _fileSize   Size of the original file in bytes (before encryption)
     * @param _encryptionIv AES-GCM IV used during encryption (24 hex chars)
     * @param _fileHash   SHA-256 hash of the original file (computed client-side before encryption)
     */
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

    /**
     * @notice Upload multiple files in a single transaction (saves gas)
     * @dev Uses a struct array to avoid the "parallel arrays" anti-pattern
     *      Maximum 10 files per batch to prevent out-of-gas errors
     */
    struct FileInput {
        string[3] ipfsHashes;
        string fileName;
        string fileExtension;
        uint256 fileSize;
        string encryptionIv;
        bytes32 fileHash;
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

    /**
     * @notice Soft-delete a file
     * @dev Uses a soft-delete flag (exists = false) instead of physically removing
     *      the array entry. This preserves file indices for shared access mappings.
     *      Storage counter is reduced by the deleted file's size.
     * @param index Index of the file in the caller's file array
     */
    function deleteFile(uint256 index) public validFile(msg.sender, index) {
        File storage fileToDelete = userFiles[msg.sender][index];

        totalStorageUsed[msg.sender] -= fileToDelete.fileSize;
        fileToDelete.exists = false;

        emit FileDeleted(msg.sender, index, fileToDelete.fileName, fileToDelete.fileSize);
    }

    /**
     * @notice Update an existing file with new shards (creates a new version)
     * @dev Replaces the CIDs, IV, and hash in-place but increments the version counter.
     *      The file size difference is reflected in the storage counter.
     *      Old IPFS shards are NOT unpinned here — that must be done on the frontend via Pinata API.
     * @param index       Index of the file to update
     * @param _ipfsHashes New array of 3 CIDs for the updated shards
     * @param _fileSize   New file size (may differ from original)
     * @param _encryptionIv New AES-GCM IV (a new IV must be generated for every encryption)
     * @param _fileHash   SHA-256 of the new version of the file
     */
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

        // Adjust storage counter for size difference
        totalStorageUsed[msg.sender] -= f.fileSize;
        require(
            totalStorageUsed[msg.sender] + _fileSize <= MAX_STORAGE_BYTES,
            "Storage quota exceeded"
        );
        totalStorageUsed[msg.sender] += _fileSize;

        // Update fields in-place
        f.ipfsHashes = _ipfsHashes;
        f.fileSize = _fileSize;
        f.encryptionIv = _encryptionIv;
        f.fileHash = _fileHash;
        f.timestamp = block.timestamp;
        f.version += 1;

        emit FileUpdated(msg.sender, index, f.version, _fileHash);
    }

    /**
     * @notice Rename a file without touching its content
     * @param index   Index of the file to rename
     * @param newName New display name for the file
     */
    function renameFile(
        uint256 index,
        string memory newName
    ) public validFile(msg.sender, index) {
        require(bytes(newName).length > 0, "New name cannot be empty");

        string memory oldName = userFiles[msg.sender][index].fileName;
        userFiles[msg.sender][index].fileName = newName;

        emit FileRenamed(msg.sender, index, oldName, newName);
    }

    /**
     * @notice Share a file with another wallet address
     * @dev The AES key is encrypted CLIENT-SIDE with the recipient's ETH public key
     *      using ECIES before being passed to this function.
     *      This means the blockchain stores the key in a form ONLY the recipient can decrypt.
     *      The owner's zero-knowledge property is preserved — the raw key never appears on-chain.
     * @param index                Index of the file to share
     * @param recipient            Wallet address to share with
     * @param encryptedKeyForRecipient AES key encrypted with recipient's ETH public key
     */
    function shareFile(
        uint256 index,
        address recipient,
        bytes memory encryptedKeyForRecipient
    ) public validFile(msg.sender, index) {
        require(recipient != address(0), "Invalid recipient address");
        require(recipient != msg.sender, "Cannot share with yourself");
        require(encryptedKeyForRecipient.length > 0, "Encrypted key cannot be empty");

        sharedAccess[msg.sender][index][recipient] = SharedAccess({
            encryptedKey: encryptedKeyForRecipient,
            active: true
        });

        // Record reverse lookup so recipient can find all files shared with them
        sharedWithMe[recipient].push(ShareReference({
            owner: msg.sender,
            fileIndex: index
        }));

        emit FileShared(msg.sender, recipient, index);
    }

    /**
     * @notice Revoke a previously granted share
     * @dev Sets active = false. The ShareReference in sharedWithMe is NOT removed
     *      (too expensive to search and splice an array). The frontend should
     *      filter out inactive shares when calling getFilesSharedWithMe().
     * @param index     Index of the file
     * @param recipient Address whose access to revoke
     */
    function revokeShare(uint256 index, address recipient) public {
        require(index < userFiles[msg.sender].length, "Invalid file index");
        require(sharedAccess[msg.sender][index][recipient].active, "No active share to revoke");

        sharedAccess[msg.sender][index][recipient].active = false;

        emit FileShareRevoked(msg.sender, recipient, index);
    }

    // ─────────────────────────────────────────────
    // Public Read Functions
    // ─────────────────────────────────────────────

    /**
     * @notice Get all non-deleted files for the calling wallet
     * @dev Filters out soft-deleted entries before returning
     *      Returns a clean array with no gaps
     */
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

    /**
     * @notice Get a single file by its raw storage index
     * @dev Use this when you already know the index (e.g. from an event)
     *      to avoid fetching the entire array
     */
    function getFileAt(uint256 index) public view validFile(msg.sender, index) returns (File memory) {
        return userFiles[msg.sender][index];
    }

    /**
     * @notice Get the number of active (non-deleted) files for the caller
     */
    function getFileCount() public view returns (uint256) {
        return _countActiveFiles(msg.sender);
    }

    /**
     * @notice Retrieve the AES key that was shared with the calling wallet
     * @dev Only callable by the recipient. The returned bytes are the AES key
     *      encrypted with the caller's ETH public key — they must decrypt it
     *      client-side using their ETH private key (via MetaMask eth_decrypt).
     * @param owner     The wallet that originally owns the file
     * @param fileIndex The index of the shared file in the owner's array
     */
    function getSharedKey(
        address owner,
        uint256 fileIndex
    ) public view returns (bytes memory) {
        SharedAccess memory access = sharedAccess[owner][fileIndex][msg.sender];
        require(access.active, "No active access grant for this file");
        return access.encryptedKey;
    }

    /**
     * @notice Get the file metadata for a file shared with the caller
     * @dev Combines getSharedKey() and getFileAt() for convenience.
     *      Returns the file struct so the frontend can read CIDs and IV.
     * @param owner     The wallet that owns the file
     * @param fileIndex The index of the file in the owner's array
     */
    function getSharedFile(
        address owner,
        uint256 fileIndex
    ) public view returns (File memory file, bytes memory encryptedKey) {
        SharedAccess memory access = sharedAccess[owner][fileIndex][msg.sender];
        require(access.active, "No active access grant for this file");
        require(fileIndex < userFiles[owner].length, "Invalid file index");
        require(userFiles[owner][fileIndex].exists, "File has been deleted");

        file = userFiles[owner][fileIndex];
        encryptedKey = access.encryptedKey;
    }

    /**
     * @notice Get all files that other wallets have shared with the caller
     * @dev Returns parallel arrays: owner addresses, file indices, file structs,
     *      and encrypted keys. Inactive (revoked) shares are filtered out automatically.
     */
    function getFilesSharedWithMe() public view returns (
        address[] memory owners,
        uint256[] memory fileIndices,
        File[] memory files,
        bytes[] memory encryptedKeys
    ) {
        ShareReference[] memory refs = sharedWithMe[msg.sender];
        uint256 activeCount = _countActiveShares(refs);

        owners = new address[](activeCount);
        fileIndices = new uint256[](activeCount);
        files = new File[](activeCount);
        encryptedKeys = new bytes[](activeCount);

        _populateSharedFiles(refs, owners, fileIndices, files, encryptedKeys);
    }

    /**
     * @notice Count how many shared files are still active for the caller
     */
    function _countActiveShares(ShareReference[] memory refs) internal view returns (uint256 count) {
        for (uint256 i = 0; i < refs.length; i++) {
            ShareReference memory ref = refs[i];
            if (
                sharedAccess[ref.owner][ref.fileIndex][msg.sender].active &&
                ref.fileIndex < userFiles[ref.owner].length &&
                userFiles[ref.owner][ref.fileIndex].exists
            ) {
                count++;
            }
        }
    }

    /**
     * @notice Populate the shared files arrays for a given recipient
     */
    function _populateSharedFiles(
        ShareReference[] memory refs,
        address[] memory owners,
        uint256[] memory fileIndices,
        File[] memory files,
        bytes[] memory encryptedKeys
    ) internal view {
        uint256 j = 0;
        for (uint256 i = 0; i < refs.length; i++) {
            ShareReference memory ref = refs[i];
            SharedAccess memory access = sharedAccess[ref.owner][ref.fileIndex][msg.sender];

            if (
                access.active &&
                ref.fileIndex < userFiles[ref.owner].length &&
                userFiles[ref.owner][ref.fileIndex].exists
            ) {
                owners[j] = ref.owner;
                fileIndices[j] = ref.fileIndex;
                files[j] = userFiles[ref.owner][ref.fileIndex];
                encryptedKeys[j] = access.encryptedKey;
                j++;
            }
        }
    }

    /**
     * @notice Check whether a specific address has active access to a file
     * @param owner     The file owner's address
     * @param fileIndex Index of the file
     * @param viewer    The address to check access for
     */
    function hasAccess(
        address owner,
        uint256 fileIndex,
        address viewer
    ) public view returns (bool) {
        if (owner == viewer) return true;
        return sharedAccess[owner][fileIndex][viewer].active;
    }

    /**
     * @notice Get remaining storage quota for the calling wallet in bytes
     */
    function getRemainingStorage() public view returns (uint256) {
        return MAX_STORAGE_BYTES - totalStorageUsed[msg.sender];
    }

    // ─────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────

    /// @dev Count non-deleted files for a given user
    function _countActiveFiles(address user) internal view returns (uint256 count) {
        for (uint256 i = 0; i < userFiles[user].length; i++) {
            if (userFiles[user][i].exists) {
                count++;
            }
        }
    }
}
