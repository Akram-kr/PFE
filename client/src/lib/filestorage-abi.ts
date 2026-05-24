export const FILE_STORAGE_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "fileIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "fileName",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "freedSize",
        type: "uint256",
      },
    ],
    name: "FileDeleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "fileIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "oldName",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "newName",
        type: "string",
      },
    ],
    name: "FileRenamed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "fileIndex",
        type: "uint256",
      },
    ],
    name: "FileShareRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "fileIndex",
        type: "uint256",
      },
    ],
    name: "FileShared",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "fileIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newVersion",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "newFileHash",
        type: "bytes32",
      },
    ],
    name: "FileUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "fileIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "fileName",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fileSize",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "fileExtension",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "fileHash",
        type: "bytes32",
      },
    ],
    name: "FileUploaded",
    type: "event",
  },
  {
    inputs: [],
    name: "IV_LENGTH",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_FILE_SIZE",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "SHARD_COUNT",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "deleteFile",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "getFileAt",
    outputs: [
      {
        components: [
          {
            internalType: "string[3]",
            name: "ipfsHashes",
            type: "string[3]",
          },
          {
            internalType: "string",
            name: "fileName",
            type: "string",
          },
          {
            internalType: "string",
            name: "fileExtension",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "fileSize",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "encryptionIv",
            type: "string",
          },
          {
            internalType: "bytes32",
            name: "fileHash",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "version",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "exists",
            type: "bool",
          },
        ],
        internalType: "struct FileStorage.File",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getFileCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getFilesSharedWithMe",
    outputs: [
      {
        internalType: "address[]",
        name: "owners",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "fileIndices",
        type: "uint256[]",
      },
      {
        components: [
          {
            internalType: "string[3]",
            name: "ipfsHashes",
            type: "string[3]",
          },
          {
            internalType: "string",
            name: "fileName",
            type: "string",
          },
          {
            internalType: "string",
            name: "fileExtension",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "fileSize",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "encryptionIv",
            type: "string",
          },
          {
            internalType: "bytes32",
            name: "fileHash",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "version",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "exists",
            type: "bool",
          },
        ],
        internalType: "struct FileStorage.File[]",
        name: "files",
        type: "tuple[]",
      },
      {
        internalType: "bytes[]",
        name: "encryptedKeys",
        type: "bytes[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "fileIndex",
        type: "uint256",
      },
    ],
    name: "getSharedFile",
    outputs: [
      {
        components: [
          {
            internalType: "string[3]",
            name: "ipfsHashes",
            type: "string[3]",
          },
          {
            internalType: "string",
            name: "fileName",
            type: "string",
          },
          {
            internalType: "string",
            name: "fileExtension",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "fileSize",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "encryptionIv",
            type: "string",
          },
          {
            internalType: "bytes32",
            name: "fileHash",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "version",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "exists",
            type: "bool",
          },
        ],
        internalType: "struct FileStorage.File",
        name: "file",
        type: "tuple",
      },
      {
        internalType: "bytes",
        name: "encryptedKey",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "fileIndex",
        type: "uint256",
      },
    ],
    name: "getSharedKey",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getUserFiles",
    outputs: [
      {
        components: [
          {
            internalType: "string[3]",
            name: "ipfsHashes",
            type: "string[3]",
          },
          {
            internalType: "string",
            name: "fileName",
            type: "string",
          },
          {
            internalType: "string",
            name: "fileExtension",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "fileSize",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "encryptionIv",
            type: "string",
          },
          {
            internalType: "bytes32",
            name: "fileHash",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "version",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "exists",
            type: "bool",
          },
        ],
        internalType: "struct FileStorage.File[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "fileIndex",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "viewer",
        type: "address",
      },
    ],
    name: "hasAccess",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "newName",
        type: "string",
      },
    ],
    name: "renameFile",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
    ],
    name: "revokeShare",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "encryptedKeyForRecipient",
        type: "bytes",
      },
    ],
    name: "shareFile",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "totalStorageUsed",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
      {
        internalType: "string[3]",
        name: "_ipfsHashes",
        type: "string[3]",
      },
      {
        internalType: "uint256",
        name: "_fileSize",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_encryptionIv",
        type: "string",
      },
      {
        internalType: "bytes32",
        name: "_fileHash",
        type: "bytes32",
      },
    ],
    name: "updateFile",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string[3]",
        name: "_ipfsHashes",
        type: "string[3]",
      },
      {
        internalType: "string",
        name: "_fileName",
        type: "string",
      },
      {
        internalType: "string",
        name: "_fileExtension",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_fileSize",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_encryptionIv",
        type: "string",
      },
      {
        internalType: "bytes32",
        name: "_fileHash",
        type: "bytes32",
      },
    ],
    name: "uploadFile",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "string[3]",
            name: "ipfsHashes",
            type: "string[3]",
          },
          {
            internalType: "string",
            name: "fileName",
            type: "string",
          },
          {
            internalType: "string",
            name: "fileExtension",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "fileSize",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "encryptionIv",
            type: "string",
          },
          {
            internalType: "bytes32",
            name: "fileHash",
            type: "bytes32",
          },
        ],
        internalType: "struct FileStorage.FileInput[]",
        name: "files",
        type: "tuple[]",
      },
    ],
    name: "uploadMultipleFiles",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
