export const DIPLOMA_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "admin",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AccessControlBadConfirmation",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "neededRole",
        type: "bytes32",
      },
    ],
    name: "AccessControlUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
    ],
    name: "Batch_CannotCancel",
    type: "error",
  },
  {
    inputs: [],
    name: "Batch_EmptyStudentList",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
    ],
    name: "Batch_Expired",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
      {
        internalType: "uint16",
        name: "grade",
        type: "uint16",
      },
    ],
    name: "Batch_InvalidGrade",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "Batch_InvalidGraduationYear",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
      {
        internalType: "enum UniversityDiploma.BatchStatus",
        name: "current",
        type: "uint8",
      },
      {
        internalType: "enum UniversityDiploma.BatchStatus",
        name: "required",
        type: "uint8",
      },
    ],
    name: "Batch_InvalidStatus",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "Batch_InvalidStudentWallet",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "matricule",
        type: "string",
      },
    ],
    name: "Batch_MatriculeAlreadyMinted",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "Batch_MissingCID",
    type: "error",
  },
  {
    inputs: [],
    name: "Batch_MissingCancelReason",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "Batch_MissingDepartment",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "Batch_MissingHash",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "Batch_MissingMatricule",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "Batch_MissingName",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "provided",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "max",
        type: "uint256",
      },
    ],
    name: "Batch_TooLarge",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "ERC721IncorrectOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ERC721InsufficientApproval",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "approver",
        type: "address",
      },
    ],
    name: "ERC721InvalidApprover",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "ERC721InvalidOperator",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "ERC721InvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "ERC721InvalidReceiver",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "ERC721InvalidSender",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ERC721NonexistentToken",
    type: "error",
  },
  {
    inputs: [],
    name: "Index_OutOfBounds",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "studentIndex",
        type: "uint256",
      },
      {
        internalType: "uint16",
        name: "bumped",
        type: "uint16",
      },
    ],
    name: "Rachat_BumpAboveMax",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "studentIndex",
        type: "uint256",
      },
      {
        internalType: "uint16",
        name: "base",
        type: "uint16",
      },
      {
        internalType: "uint16",
        name: "bumped",
        type: "uint16",
      },
    ],
    name: "Rachat_BumpBelowBase",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "studentIndex",
        type: "uint256",
      },
      {
        internalType: "uint16",
        name: "bumped",
        type: "uint16",
      },
    ],
    name: "Rachat_BumpBelowPassGrade",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "studentIndex",
        type: "uint256",
      },
    ],
    name: "Rachat_InvalidStudentIndex",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "studentIndex",
        type: "uint256",
      },
    ],
    name: "Rachat_MissingReason",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "studentIndex",
        type: "uint256",
      },
      {
        internalType: "uint16",
        name: "moyenne",
        type: "uint16",
      },
    ],
    name: "Rachat_StudentNotBorderline",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
  },
  {
    inputs: [],
    name: "Role_ZeroAddress",
    type: "error",
  },
  {
    inputs: [],
    name: "SBT_TransferNotAllowed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Token_AlreadyRevoked",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Token_DoesNotExist",
    type: "error",
  },
  {
    inputs: [],
    name: "Token_MissingRevocationReason",
    type: "error",
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
        name: "approved",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Approval",
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
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "cancelledBy",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "reason",
        type: "string",
      },
    ],
    name: "BatchCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "council",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "rachatCount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "note",
        type: "string",
      },
    ],
    name: "BatchDeliberated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "tokenIds",
        type: "uint256[]",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalStudents",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "diplomasMinted",
        type: "uint256",
      },
    ],
    name: "BatchFinalized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "proposer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "studentCount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "expiresAt",
        type: "uint256",
      },
    ],
    name: "BatchProposed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "dean",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "BatchSignedByDean",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "rector",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "BatchSignedByRector",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "council",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "assignedBy",
        type: "address",
      },
    ],
    name: "CouncilAssigned",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "council",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "removedBy",
        type: "address",
      },
    ],
    name: "CouncilRemoved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "dean",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "assignedBy",
        type: "address",
      },
    ],
    name: "DeanAssigned",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "dean",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "removedBy",
        type: "address",
      },
    ],
    name: "DeanRemoved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "revokedBy",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "reason",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "DiplomaRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "verifier",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "isAuthentic",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "count",
        type: "uint256",
      },
    ],
    name: "DiplomaVerified",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "studentIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "baseMoyenne",
        type: "uint16",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "bumpedMoyenne",
        type: "uint16",
      },
      {
        indexed: false,
        internalType: "string",
        name: "reason",
        type: "string",
      },
    ],
    name: "RachatApplied",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "rector",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "assignedBy",
        type: "address",
      },
    ],
    name: "RectorAssigned",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "rector",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "removedBy",
        type: "address",
      },
    ],
    name: "RectorRemoved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [],
    name: "ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "COUNCIL_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DEAN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_BATCH_SIZE",
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
    name: "MAX_GRADE",
    outputs: [
      {
        internalType: "uint16",
        name: "",
        type: "uint16",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PASS_GRADE",
    outputs: [
      {
        internalType: "uint16",
        name: "",
        type: "uint16",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PROPOSAL_EXPIRY",
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
    name: "RACHAT_THRESHOLD",
    outputs: [
      {
        internalType: "uint16",
        name: "",
        type: "uint16",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "RECTOR_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "c",
        type: "address",
      },
    ],
    name: "assignCouncil",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "d",
        type: "address",
      },
    ],
    name: "assignDean",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "r",
        type: "address",
      },
    ],
    name: "assignRector",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "balanceOf",
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
        name: "batchId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "reason",
        type: "string",
      },
    ],
    name: "cancelBatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint16",
        name: "s1",
        type: "uint16",
      },
      {
        internalType: "uint16",
        name: "s2",
        type: "uint16",
      },
    ],
    name: "computeAnnualAverage",
    outputs: [
      {
        internalType: "uint16",
        name: "",
        type: "uint16",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "studentIndex",
            type: "uint256",
          },
          {
            internalType: "uint16",
            name: "bumpedMoyenne",
            type: "uint16",
          },
          {
            internalType: "string",
            name: "reason",
            type: "string",
          },
        ],
        internalType: "struct UniversityDiploma.Rachat[]",
        name: "rachats",
        type: "tuple[]",
      },
      {
        internalType: "string[]",
        name: "transcriptCIDs",
        type: "string[]",
      },
      {
        internalType: "string",
        name: "note",
        type: "string",
      },
    ],
    name: "deliberate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
    ],
    name: "finalizeBatch",
    outputs: [
      {
        internalType: "uint256[]",
        name: "tokenIds",
        type: "uint256[]",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getApproved",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
    ],
    name: "getBatchCancelReason",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
    ],
    name: "getBatchDeliberation",
    outputs: [
      {
        internalType: "uint256",
        name: "deliberatedAt",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "deliberatedBy",
        type: "address",
      },
      {
        internalType: "string",
        name: "note",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
    ],
    name: "getBatchDescription",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
    ],
    name: "getBatchExpiry",
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
        name: "batchId",
        type: "uint256",
      },
    ],
    name: "getBatchResults",
    outputs: [
      {
        internalType: "uint256",
        name: "total",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "admis",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "rachat",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "ajourne",
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
        name: "batchId",
        type: "uint256",
      },
    ],
    name: "getBatchSignatures",
    outputs: [
      {
        internalType: "uint256",
        name: "deanSignedAt",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "rectorSignedAt",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "finalizedAt",
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
        name: "batchId",
        type: "uint256",
      },
    ],
    name: "getBatchStatus",
    outputs: [
      {
        internalType: "enum UniversityDiploma.BatchStatus",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "idx",
        type: "uint256",
      },
    ],
    name: "getBatchStudent",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "wallet",
            type: "address",
          },
          {
            internalType: "string",
            name: "studentName",
            type: "string",
          },
          {
            internalType: "string",
            name: "matricule",
            type: "string",
          },
          {
            internalType: "string",
            name: "dateOfBirth",
            type: "string",
          },
          {
            internalType: "string",
            name: "placeOfBirth",
            type: "string",
          },
          {
            internalType: "string",
            name: "metadataCID",
            type: "string",
          },
          {
            internalType: "bytes32",
            name: "sha256Hash",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "gradeTreeRoot",
            type: "bytes32",
          },
          {
            internalType: "enum UniversityDiploma.Specialty",
            name: "specialty",
            type: "uint8",
          },
          {
            internalType: "enum UniversityDiploma.Cycle",
            name: "cycle",
            type: "uint8",
          },
          {
            internalType: "uint16",
            name: "graduationYear",
            type: "uint16",
          },
          {
            internalType: "string",
            name: "department",
            type: "string",
          },
          {
            internalType: "uint16",
            name: "s1Grade",
            type: "uint16",
          },
          {
            internalType: "uint16",
            name: "s2Grade",
            type: "uint16",
          },
          {
            internalType: "uint16",
            name: "baseMoyenne",
            type: "uint16",
          },
        ],
        internalType: "struct UniversityDiploma.StudentEntry",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
    ],
    name: "getBatchStudentCount",
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
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getDiplomaRecord",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "studentName",
            type: "string",
          },
          {
            internalType: "string",
            name: "matricule",
            type: "string",
          },
          {
            internalType: "string",
            name: "dateOfBirth",
            type: "string",
          },
          {
            internalType: "string",
            name: "placeOfBirth",
            type: "string",
          },
          {
            internalType: "string",
            name: "metadataCID",
            type: "string",
          },
          {
            internalType: "bytes32",
            name: "sha256Hash",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "gradeTreeRoot",
            type: "bytes32",
          },
          {
            internalType: "enum UniversityDiploma.Specialty",
            name: "specialty",
            type: "uint8",
          },
          {
            internalType: "enum UniversityDiploma.Cycle",
            name: "cycle",
            type: "uint8",
          },
          {
            internalType: "enum UniversityDiploma.Mention",
            name: "mention",
            type: "uint8",
          },
          {
            internalType: "uint16",
            name: "moyenne",
            type: "uint16",
          },
          {
            internalType: "uint16",
            name: "graduationYear",
            type: "uint16",
          },
          {
            internalType: "string",
            name: "department",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "batchId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "mintedAt",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "valid",
            type: "bool",
          },
          {
            internalType: "string",
            name: "revocationReason",
            type: "string",
          },
        ],
        internalType: "struct UniversityDiploma.DiplomaRecord",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleAdmin",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "student",
        type: "address",
      },
    ],
    name: "getStudentDiplomas",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "idx",
        type: "uint256",
      },
    ],
    name: "getStudentPV",
    outputs: [
      {
        components: [
          {
            internalType: "uint16",
            name: "s1Grade",
            type: "uint16",
          },
          {
            internalType: "uint16",
            name: "s2Grade",
            type: "uint16",
          },
          {
            internalType: "uint16",
            name: "baseMoyenne",
            type: "uint16",
          },
          {
            internalType: "uint16",
            name: "finalMoyenne",
            type: "uint16",
          },
          {
            internalType: "enum UniversityDiploma.Mention",
            name: "mention",
            type: "uint8",
          },
          {
            internalType: "enum UniversityDiploma.DeliberationResult",
            name: "result",
            type: "uint8",
          },
          {
            internalType: "bool",
            name: "rachatApplied",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "diplomaEligible",
            type: "bool",
          },
          {
            internalType: "string",
            name: "ipfsTranscriptCID",
            type: "string",
          },
        ],
        internalType: "struct UniversityDiploma.StudentPV",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "matricule",
        type: "string",
      },
    ],
    name: "getTokenByMatricule",
    outputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "exists",
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
        name: "batchId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "idx",
        type: "uint256",
      },
    ],
    name: "getTranscriptLink",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
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
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "isApprovedForAll",
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
        internalType: "uint16",
        name: "moyenne",
        type: "uint16",
      },
    ],
    name: "isBorderline",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "isDiplomaValid",
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
        internalType: "string",
        name: "m",
        type: "string",
      },
    ],
    name: "isMatriculeUsed",
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
        internalType: "uint16",
        name: "m",
        type: "uint16",
      },
    ],
    name: "mentionFor",
    outputs: [
      {
        internalType: "enum UniversityDiploma.Mention",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextBatchId",
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
    name: "nextTokenId",
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
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ownerOf",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "wallet",
            type: "address",
          },
          {
            internalType: "string",
            name: "studentName",
            type: "string",
          },
          {
            internalType: "string",
            name: "matricule",
            type: "string",
          },
          {
            internalType: "string",
            name: "dateOfBirth",
            type: "string",
          },
          {
            internalType: "string",
            name: "placeOfBirth",
            type: "string",
          },
          {
            internalType: "string",
            name: "metadataCID",
            type: "string",
          },
          {
            internalType: "bytes32",
            name: "sha256Hash",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "gradeTreeRoot",
            type: "bytes32",
          },
          {
            internalType: "enum UniversityDiploma.Specialty",
            name: "specialty",
            type: "uint8",
          },
          {
            internalType: "enum UniversityDiploma.Cycle",
            name: "cycle",
            type: "uint8",
          },
          {
            internalType: "uint16",
            name: "graduationYear",
            type: "uint16",
          },
          {
            internalType: "string",
            name: "department",
            type: "string",
          },
          {
            internalType: "uint16",
            name: "s1Grade",
            type: "uint16",
          },
          {
            internalType: "uint16",
            name: "s2Grade",
            type: "uint16",
          },
          {
            internalType: "uint16",
            name: "baseMoyenne",
            type: "uint16",
          },
        ],
        internalType: "struct UniversityDiploma.StudentEntry[]",
        name: "inputs",
        type: "tuple[]",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
    ],
    name: "proposeBatch",
    outputs: [
      {
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "c",
        type: "address",
      },
    ],
    name: "removeCouncil",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "d",
        type: "address",
      },
    ],
    name: "removeDean",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "r",
        type: "address",
      },
    ],
    name: "removeRector",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "callerConfirmation",
        type: "address",
      },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "reason",
        type: "string",
      },
    ],
    name: "revokeDiploma",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
    ],
    name: "signByDean",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "batchId",
        type: "uint256",
      },
    ],
    name: "signByRector",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
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
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "tokenURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "verificationCount",
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
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "pdfHash",
        type: "bytes32",
      },
    ],
    name: "verifyDiploma",
    outputs: [
      {
        internalType: "bool",
        name: "isAuthentic",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "pdfHash",
        type: "bytes32",
      },
    ],
    name: "verifyDiplomaView",
    outputs: [
      {
        internalType: "bool",
        name: "isAuthentic",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "exists",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "isValid",
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
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "ueName",
        type: "string",
      },
      {
        internalType: "string",
        name: "subjectName",
        type: "string",
      },
      {
        internalType: "uint16",
        name: "ccMark",
        type: "uint16",
      },
      {
        internalType: "uint16",
        name: "examMark",
        type: "uint16",
      },
      {
        internalType: "bytes32[]",
        name: "proof",
        type: "bytes32[]",
      },
    ],
    name: "verifySubjectMark",
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
] as const;
