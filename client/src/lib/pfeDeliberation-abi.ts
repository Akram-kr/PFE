export const PFE_DELIBERATION_ABI = [
  {
    inputs: [],
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
    inputs: [],
    name: "Cancel_InvalidState",
    type: "error",
  },
  {
    inputs: [],
    name: "Grade_AlreadySubmitted",
    type: "error",
  },
  {
    inputs: [],
    name: "Grade_ExceedsMax",
    type: "error",
  },
  {
    inputs: [],
    name: "Grade_NotJuryMember",
    type: "error",
  },
  {
    inputs: [],
    name: "Session_AlreadyCalculated",
    type: "error",
  },
  {
    inputs: [],
    name: "Session_AlreadyExists",
    type: "error",
  },
  {
    inputs: [],
    name: "Session_InvalidForAcademicYear",
    type: "error",
  },
  {
    inputs: [],
    name: "Session_InvalidJury",
    type: "error",
  },
  {
    inputs: [],
    name: "Session_MissingData",
    type: "error",
  },
  {
    inputs: [],
    name: "Session_NotFound",
    type: "error",
  },
  {
    inputs: [],
    name: "Session_NotOpen",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "sessionId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "professor",
        type: "address",
      },
      {
        indexed: false,
        internalType: "enum PFEDeliberation.JuryRole",
        name: "juryRole",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "total",
        type: "uint16",
      },
    ],
    name: "GradeSubmitted",
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
        internalType: "uint256",
        name: "sessionId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "matricule",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "finalAverage",
        type: "uint16",
      },
      {
        indexed: false,
        internalType: "enum PFEDeliberation.Mention",
        name: "mention",
        type: "uint8",
      },
    ],
    name: "SessionCalculated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "sessionId",
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
    name: "SessionCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "sessionId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "matricule",
        type: "string",
      },
      {
        indexed: false,
        internalType: "address",
        name: "president",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "createdAt",
        type: "uint256",
      },
    ],
    name: "SessionInitialized",
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
    name: "JURY_SIZE",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_APPLICATION",
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
    name: "MAX_CONCEPTION",
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
    name: "MAX_PRESENTATION",
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
    name: "MAX_QA",
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
    name: "MAX_RAPPORT",
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
    name: "MAX_TOTAL",
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
    name: "MENTION_AB",
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
    name: "MENTION_B",
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
    name: "MENTION_P",
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
    name: "MENTION_TB",
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
    inputs: [
      {
        internalType: "address",
        name: "addr",
        type: "address",
      },
    ],
    name: "addAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "sessionId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "reason",
        type: "string",
      },
    ],
    name: "cancelSession",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "sessionId",
        type: "uint256",
      },
    ],
    name: "getFinalGrade",
    outputs: [
      {
        internalType: "bool",
        name: "isCalculated",
        type: "bool",
      },
      {
        internalType: "string",
        name: "studentId",
        type: "string",
      },
      {
        internalType: "uint16",
        name: "finalNote",
        type: "uint16",
      },
      {
        internalType: "string",
        name: "mentionLabel",
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
        name: "sessionId",
        type: "uint256",
      },
    ],
    name: "getJuryInfo",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "president",
            type: "address",
          },
          {
            internalType: "address",
            name: "promoteur",
            type: "address",
          },
          {
            internalType: "address",
            name: "examinateur1",
            type: "address",
          },
          {
            internalType: "address",
            name: "examinateur2",
            type: "address",
          },
        ],
        internalType: "struct PFEDeliberation.JuryInfo",
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
        internalType: "uint256",
        name: "sessionId",
        type: "uint256",
      },
    ],
    name: "getSessionStatus",
    outputs: [
      {
        internalType: "uint8",
        name: "voteCount",
        type: "uint8",
      },
      {
        internalType: "bool",
        name: "isCalculated",
        type: "bool",
      },
      {
        internalType: "uint16",
        name: "finalAverage",
        type: "uint16",
      },
      {
        internalType: "string",
        name: "mentionLabel",
        type: "string",
      },
      {
        internalType: "enum PFEDeliberation.SessionState",
        name: "state",
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
        name: "sessionId",
        type: "uint256",
      },
    ],
    name: "getStudentInfo",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "matricule",
            type: "string",
          },
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "string",
            name: "pfeTitle",
            type: "string",
          },
          {
            internalType: "string",
            name: "specialty",
            type: "string",
          },
          {
            internalType: "string",
            name: "academicYear",
            type: "string",
          },
        ],
        internalType: "struct PFEDeliberation.StudentInfo",
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
        components: [
          {
            internalType: "string",
            name: "matricule",
            type: "string",
          },
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "string",
            name: "pfeTitle",
            type: "string",
          },
          {
            internalType: "string",
            name: "specialty",
            type: "string",
          },
          {
            internalType: "string",
            name: "academicYear",
            type: "string",
          },
        ],
        internalType: "struct PFEDeliberation.StudentInfo",
        name: "student",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "address",
            name: "president",
            type: "address",
          },
          {
            internalType: "address",
            name: "promoteur",
            type: "address",
          },
          {
            internalType: "address",
            name: "examinateur1",
            type: "address",
          },
          {
            internalType: "address",
            name: "examinateur2",
            type: "address",
          },
        ],
        internalType: "struct PFEDeliberation.JuryInfo",
        name: "jury",
        type: "tuple",
      },
    ],
    name: "initializeSession",
    outputs: [
      {
        internalType: "uint256",
        name: "sessionId",
        type: "uint256",
      },
    ],
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
        internalType: "uint256",
        name: "sessionId",
        type: "uint256",
      },
      {
        internalType: "uint16",
        name: "rapport",
        type: "uint16",
      },
      {
        internalType: "uint16",
        name: "conception",
        type: "uint16",
      },
      {
        internalType: "uint16",
        name: "application",
        type: "uint16",
      },
      {
        internalType: "uint16",
        name: "presentation",
        type: "uint16",
      },
      {
        internalType: "uint16",
        name: "qa",
        type: "uint16",
      },
    ],
    name: "submitGrade",
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
] as const;
