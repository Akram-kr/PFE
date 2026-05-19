export const DIPLOMA_ABI = [
  {
    _format: "hh3-artifact-1",
    contractName: "UniversityDiploma",
    sourceName: "contracts/univ.sol",
    abi: [
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
        ],
        name: "Batch_InvalidGraduationYear",
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
            name: "moyenne",
            type: "uint16",
          },
          {
            internalType: "uint16",
            name: "onChainMoyenne",
            type: "uint16",
          },
        ],
        name: "Batch_InvalidMoyenne",
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
            name: "index",
            type: "uint256",
          },
          {
            internalType: "uint16",
            name: "moyenne",
            type: "uint16",
          },
        ],
        name: "Batch_StudentFailed",
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
        name: "Enrollment_NotActive",
        type: "error",
      },
      {
        inputs: [],
        name: "Enrollment_NotValidated",
        type: "error",
      },
      {
        inputs: [],
        name: "Ledger_InvalidGrade",
        type: "error",
      },
      {
        inputs: [],
        name: "Ledger_ModuleDoesNotExist",
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
            name: "councilMember",
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
            indexed: false,
            internalType: "uint256[]",
            name: "tokenIds",
            type: "uint256[]",
          },
        ],
        name: "DiplomasMinted",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "student",
            type: "address",
          },
          {
            indexed: false,
            internalType: "string",
            name: "moduleCode",
            type: "string",
          },
          {
            indexed: false,
            internalType: "uint16",
            name: "grade",
            type: "uint16",
          },
          {
            indexed: false,
            internalType: "address",
            name: "professor",
            type: "address",
          },
        ],
        name: "GradeSubmitted",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "string",
            name: "code",
            type: "string",
          },
          {
            indexed: false,
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            indexed: false,
            internalType: "uint8",
            name: "coeff",
            type: "uint8",
          },
        ],
        name: "ModuleAdded",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "student",
            type: "address",
          },
          {
            indexed: false,
            internalType: "string",
            name: "code",
            type: "string",
          },
        ],
        name: "ModuleRegistered",
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
            name: "assignedBy",
            type: "address",
          },
        ],
        name: "RoleAssigned",
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
            name: "removedBy",
            type: "address",
          },
        ],
        name: "RoleRemoved",
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
            name: "student",
            type: "address",
          },
          {
            indexed: false,
            internalType: "string",
            name: "level",
            type: "string",
          },
        ],
        name: "StudentEnrolled",
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
        name: "PROFESSOR_ROLE",
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
            internalType: "string",
            name: "",
            type: "string",
          },
        ],
        name: "academicModules",
        outputs: [
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "uint8",
            name: "coefficient",
            type: "uint8",
          },
          {
            internalType: "bool",
            name: "active",
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
            name: "code",
            type: "string",
          },
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "uint8",
            name: "coeff",
            type: "uint8",
          },
        ],
        name: "addAcademicModule",
        outputs: [],
        stateMutability: "nonpayable",
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
        name: "assignRole",
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
            internalType: "address",
            name: "student",
            type: "address",
          },
        ],
        name: "calculateOnChainMoyenne",
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
            internalType: "uint256",
            name: "batchId",
            type: "uint256",
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
            internalType: "address",
            name: "student",
            type: "address",
          },
        ],
        name: "enrollStudentAdmin",
        outputs: [],
        stateMutability: "nonpayable",
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
        name: "enrollStudentPedago",
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
            internalType: "string",
            name: "matricule",
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
            internalType: "uint256",
            name: "batchId",
            type: "uint256",
          },
        ],
        name: "mintBatch",
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
            ],
            internalType: "struct UniversityDiploma.StudentEntry[]",
            name: "students",
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
            internalType: "string",
            name: "code",
            type: "string",
          },
        ],
        name: "registerForModule",
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
        name: "removeRole",
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
            internalType: "address",
            name: "student",
            type: "address",
          },
          {
            internalType: "string",
            name: "code",
            type: "string",
          },
          {
            internalType: "uint16",
            name: "grade",
            type: "uint16",
          },
        ],
        name: "setGrade",
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
            internalType: "address",
            name: "",
            type: "address",
          },
          {
            internalType: "string",
            name: "",
            type: "string",
          },
        ],
        name: "studentGrades",
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
            name: "",
            type: "address",
          },
        ],
        name: "studentProfiles",
        outputs: [
          {
            internalType: "bool",
            name: "adminValidated",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "pedagoValidated",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "active",
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
            name: "",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "studentRegisteredModules",
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
        inputs: [],
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
    ],
    bytecode:
      "0x608060405234801561000f575f80fd5b506040516147c53803806147c583398101604081905261002e916101de565b60405180604001604052806011815260200170556e69766572736974794469706c6f6d6160781b815250604051806040016040528060048152602001630554449560e41b815250815f908161008391906102a3565b50600161009082826102a3565b50505060016100a96100a661010d60201b60201c565b90565b556001600160a01b0381166100d15760405163af0849dd60e01b815260040160405180910390fd5b6100db5f82610131565b506101067fa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c2177582610131565b5050610362565b7f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f0090565b5f8281526006602090815260408083206001600160a01b038516845290915281205460ff166101d5575f8381526006602090815260408083206001600160a01b03861684529091529020805460ff1916600117905561018d3390565b6001600160a01b0316826001600160a01b0316847f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45060016101d8565b505f5b92915050565b5f602082840312156101ee575f80fd5b81516001600160a01b0381168114610204575f80fd5b9392505050565b634e487b7160e01b5f52604160045260245ffd5b600181811c9082168061023357607f821691505b60208210810361025157634e487b7160e01b5f52602260045260245ffd5b50919050565b601f82111561029e57805f5260205f20601f840160051c8101602085101561027c5750805b601f840160051c820191505b8181101561029b575f8155600101610288565b50505b505050565b81516001600160401b038111156102bc576102bc61020b565b6102d0816102ca845461021f565b84610257565b602080601f831160018114610303575f84156102ec5750858301515b5f19600386901b1c1916600185901b17855561035a565b5f85815260208120601f198616915b8281101561033157888601518255948401946001909101908401610312565b508582101561034e57878501515f19600388901b60f8161c191681555b505060018460011b0185555b505050505050565b6144568061036f5f395ff3fe608060405234801561000f575f80fd5b50600436106102fe575f3560e01c80638a14e3d011610195578063cdede366116100e4578063d61dd05e1161009e578063ee818e2011610079578063ee818e2014610785578063f6ba0007146107a5578063f82426de146107b8578063f94b2cd4146107cb575f80fd5b8063d61dd05e1461074c578063e28fea341461075f578063e985e9c514610772575f80fd5b8063cdede366146106e4578063cfdbf254146106f7578063d1b9329214610700578063d3cac7e114610713578063d547741f14610726578063d57a3c0714610739575f80fd5b8063a22cb4651161014f578063bcee8b3c1161012a578063bcee8b3c14610684578063c81cf77114610697578063c87b56dd146106be578063c903e522146106d1575f80fd5b8063a22cb46514610655578063a27f421e14610668578063b88d4fde14610671575f80fd5b80638a14e3d01461060357806391d148541461060d578063939adc061461062057806395d89b411461063357806395fa12d61461063b578063a217fddf1461064e575f80fd5b80632f2ff15d1161025157806342842e0e1161020b57806365eb3b88116101e657806365eb3b881461057f57806370a08231146105d357806375b238fc146105e65780638626d715146105fa575f80fd5b806342842e0e14610546578063536e448c146105595780636352211e1461056c575f80fd5b80632f2ff15d146104c557806330a727b3146104d857806336568abe146104eb57806337d18db5146104fe578063399cf6981461051157806341cd097714610533575f80fd5b8063095ea7b3116102bc57806323b872dd1161029757806323b872dd14610442578063248a9ca31461045557806324d42a37146104775780632ac7cf451461049e575f80fd5b8063095ea7b3146103bd5780631de378ec146103d057806320e409b414610422575f80fd5b80622854d71461030257806301ffc9a71461033c57806305beaad51461035f57806306fdde0314610374578063081812fc146103895780630830e22e146103b4575b5f80fd5b6103297ff25036a6852152e96c39cc9bf999cf0e78b9ebf96c37327327f9c87088a5dfa781565b6040519081526020015b60405180910390f35b61034f61034a366004613487565b6107de565b6040519015158152602001610333565b61037261036d3660046134ed565b6107ee565b005b61037c6108fd565b6040516103339190613562565b61039c610397366004613574565b61098c565b6040516001600160a01b039091168152602001610333565b61032960115481565b6103726103cb36600461359f565b6109b3565b61040f6103de36600461366d565b601060209081525f9283526040909220815180830184018051928152908401929093019190912091525461ffff1681565b60405161ffff9091168152602001610333565b610435610430366004613574565b6109c2565b60405161033391906136b9565b6103726104503660046136fc565b611227565b610329610463366004613574565b5f9081526006602052604090206001015490565b6103297f5f1d1e303f9c0a1801dd708bdc4239781d66c88ca6cb941c5769ba09b5c1b28581565b6103297fba7924dbc18a088ff62f660bed95aba930bcbad059dcde0da6fc643115d44ba381565b6103726104d336600461373a565b6112b0565b6103726104e636600461373a565b6112d4565b6103726104f936600461373a565b611359565b61034f61050c366004613768565b611391565b61052461051f3660046137a6565b6113bf565b604051610333939291906137d7565b610372610541366004613574565b611478565b6103726105543660046136fc565b611574565b610372610567366004613574565b61158e565b61039c61057a366004613574565b61167c565b6105b461058d366004613803565b600e6020525f908152604090205460ff808216916101008104821691620100009091041683565b6040805193151584529115156020840152151590820152606001610333565b6103296105e1366004613803565b611686565b6103295f8051602061440183398151915281565b61040f6107d081565b61032962093a8081565b61034f61061b36600461373a565b6116cb565b61040f61062e366004613803565b6116f5565b61037c6118cf565b61034f61064936600461381e565b6118de565b6103295f81565b61037261066336600461383e565b61199c565b61040f6103e881565b61037261067f36600461386e565b6119a7565b6103296106923660046138e8565b6119bf565b6103297f577f08e4a510a24c05fb531f78cace5d373d442eb2ba1e22f5bcf2bf4248c21e81565b61037c6106cc366004613574565b611d30565b6103726106df366004613803565b611d9d565b6103726106f2366004613979565b611e2d565b61032961012c81565b61043561070e366004613803565b611f3b565b6103726107213660046134ed565b611fa4565b61037261073436600461373a565b61213e565b6103726107473660046134ed565b612162565b61037261075a366004613a0a565b612279565b61037c61076d36600461359f565b61236a565b61034f610780366004613a6d565b61241b565b610798610793366004613574565b612448565b6040516103339190613ada565b6103726107b336600461373a565b612992565b6103726107c6366004613803565b6129f0565b6103726107d9366004613768565b612a77565b5f6107e882612ba0565b92915050565b5f8051602061440183398151915261080581612bc4565b5f848152600960205260409020600181015460ff16600481600581111561082e5761082e613a99565b148061084b5750600581600581111561084957610849613a99565b145b1561087157604051630aa7920560e31b8152600481018790526024015b60405180910390fd5b5f8490036108925760405163546d6d5960e01b815260040160405180910390fd5b60018201805460ff19166005179055600982016108b0858783613cce565b50336001600160a01b0316867fc554792a539c0d5fb25762225b65f807a7741dc70229828b2ea03bc3e1bdc24587876040516108ed929190613daf565b60405180910390a3505050505050565b60605f805461090b90613c58565b80601f016020809104026020016040519081016040528092919081815260200182805461093790613c58565b80156109825780601f1061095957610100808354040283529160200191610982565b820191905f5260205f20905b81548152906001019060200180831161096557829003601f168201915b5050505050905090565b5f61099682612bd1565b505f828152600460205260409020546001600160a01b03166107e8565b6109be828233612c08565b5050565b60605f805160206144018339815191526109db81612bc4565b6109e3612c15565b5f8381526009602052604090206003810154421115610a1857604051635c4307a160e11b815260048101859052602401610868565b6003600182015460ff166005811115610a3357610a33613a99565b14610a61576001810154604051632373f6fd60e01b815261086891869160ff90911690600390600401613dd2565b8054806001600160401b03811115610a7b57610a7b6135c9565b604051908082528060200260200182016040528015610aa4578160200160208202803683370190505b5093505f5b818110156111ac575f835f018281548110610ac657610ac6613df3565b905f5260205f2090600902019050600b81600201604051610ae79190613e76565b9081526040519081900360200190205460ff1615610b1d5780600201604051637024c4ad60e11b81526004016108689190613e81565b600780545f9182610b2d83613f1f565b909155508254909150610b49906001600160a01b031682612c43565b604051806102000160405280836001018054610b6490613c58565b80601f0160208091040260200160405190810160405280929190818152602001828054610b9090613c58565b8015610bdb5780601f10610bb257610100808354040283529160200191610bdb565b820191905f5260205f20905b815481529060010190602001808311610bbe57829003601f168201915b50505050508152602001836002018054610bf490613c58565b80601f0160208091040260200160405190810160405280929190818152602001828054610c2090613c58565b8015610c6b5780601f10610c4257610100808354040283529160200191610c6b565b820191905f5260205f20905b815481529060010190602001808311610c4e57829003601f168201915b50505050508152602001836003018054610c8490613c58565b80601f0160208091040260200160405190810160405280929190818152602001828054610cb090613c58565b8015610cfb5780601f10610cd257610100808354040283529160200191610cfb565b820191905f5260205f20905b815481529060010190602001808311610cde57829003601f168201915b50505050508152602001836004018054610d1490613c58565b80601f0160208091040260200160405190810160405280929190818152602001828054610d4090613c58565b8015610d8b5780601f10610d6257610100808354040283529160200191610d8b565b820191905f5260205f20905b815481529060010190602001808311610d6e57829003601f168201915b50505050508152602001836005018054610da490613c58565b80601f0160208091040260200160405190810160405280929190818152602001828054610dd090613c58565b8015610e1b5780601f10610df257610100808354040283529160200191610e1b565b820191905f5260205f20905b815481529060010190602001808311610dfe57829003601f168201915b505050918352505060068401546020820152600784015460409091019060ff166003811115610e4c57610e4c613a99565b81526020018360070160019054906101000a900460ff166004811115610e7457610e74613a99565b8152602001610e948460070160029054906101000a900461ffff16612c5c565b6003811115610ea557610ea5613a99565b8152600784015461ffff62010000820481166020840152640100000000909104166040820152600884018054606090920191610ee090613c58565b80601f0160208091040260200160405190810160405280929190818152602001828054610f0c90613c58565b8015610f575780601f10610f2e57610100808354040283529160200191610f57565b820191905f5260205f20905b815481529060010190602001808311610f3a57829003601f168201915b505050918352505060208082018b90524260408084019190915260016060840152805180830182525f808252608090940152848352600a909152902081518190610fa19082613f37565b5060208201516001820190610fb69082613f37565b5060408201516002820190610fcb9082613f37565b5060608201516003820190610fe09082613f37565b5060808201516004820190610ff59082613f37565b5060a0820151600582015560c082015160068201805460ff1916600183600381111561102357611023613a99565b021790555060e082015160068201805461ff00191661010083600481111561104d5761104d613a99565b021790555061010082015160068201805462ff000019166201000083600381111561107a5761107a613a99565b021790555061012082015160068201805461014085015161ffff908116650100000000000266ffff000000000019919094166301000000021666ffffffff000000199091161791909117905561016082015160078201906110db9082613f37565b5061018082015160088201556101a082015160098201556101c0820151600a8201805460ff19169115159190911790556101e0820151600b8201906111209082613f37565b509050506001600b836002016040516111399190613e76565b9081526040805160209281900383019020805460ff19169315159390931790925583546001600160a01b03165f908152600c825291822080546001810182559083529120018190558651819088908590811061119757611197613df3565b60209081029190910101525050600101610aa9565b5060018201805460ff1916600417905560405185907f5e33bd39b860afb968e64e6ae6b18f462ce1f9262e3fb7d34d6cb661b95f43a7906111ee9087906136b9565b60405180910390a2505061122160017f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f0055565b50919050565b6001600160a01b03821661125057604051633250574960e11b81525f6004820152602401610868565b5f61125c838333612ca6565b9050836001600160a01b0316816001600160a01b0316146112aa576040516364283d7b60e01b81526001600160a01b0380861660048301526024820184905282166044820152606401610868565b50505050565b5f828152600660205260409020600101546112ca81612bc4565b6112aa8383612ce6565b5f805160206144018339815191526112eb81612bc4565b6001600160a01b0382166113125760405163af0849dd60e01b815260040160405180910390fd5b61131c8383612ce6565b5060405133906001600160a01b0384169085907fd3c3c74ac78e01f4affcaa9191550c84a2b0b79d8f0dfcee7645eda13a90c6c7905f90a4505050565b6001600160a01b03811633146113825760405163334bd91960e11b815260040160405180910390fd5b61138c8282612d77565b505050565b5f600b83836040516113a4929190613ff2565b9081526040519081900360200190205460ff16905092915050565b8051602081830181018051600d825292820191909301209152805481906113e590613c58565b80601f016020809104026020016040519081016040528092919081815260200182805461141190613c58565b801561145c5780601f106114335761010080835404028352916020019161145c565b820191905f5260205f20905b81548152906001019060200180831161143f57829003601f168201915b5050506001909301549192505060ff8082169161010090041683565b7f5f1d1e303f9c0a1801dd708bdc4239781d66c88ca6cb941c5769ba09b5c1b2856114a281612bc4565b5f82815260096020526040902060038101544211156114d757604051635c4307a160e11b815260048101849052602401610868565b6002600182015460ff1660058111156114f2576114f2613a99565b14611520576001810154604051632373f6fd60e01b815261086891859160ff90911690600290600401613dd2565b60018101805460ff191660031790554260078201819055604051908152339084907f9b96e7cab3372e0696cb1cc0225c297c6ac2eb98d39fc2509159d6da3b2a112f906020015b60405180910390a3505050565b61138c83838360405180602001604052805f8152506119a7565b7fba7924dbc18a088ff62f660bed95aba930bcbad059dcde0da6fc643115d44ba36115b881612bc4565b5f82815260096020526040902060038101544211156115ed57604051635c4307a160e11b815260048101849052602401610868565b60018082015460ff16600581111561160757611607613a99565b1461163157600180820154604051632373f6fd60e01b815261086892869260ff1691600401613dd2565b60018101805460ff191660021790554260068201819055604051908152339084907f01dbe9111fada9353a4888fcd49a2b94b1e8b9f93bd2e48fc74d1eb7cdbab8d790602001611567565b5f6107e882612bd1565b5f6001600160a01b0382166116b0576040516322718ad960e21b81525f6004820152602401610868565b506001600160a01b03165f9081526003602052604090205490565b5f9182526006602090815260408084206001600160a01b0393909316845291905290205460ff1690565b6001600160a01b0381165f908152600f6020908152604080832080548251818502810185019093528083528493849084015b828210156117cf578382905f5260205f2001805461174490613c58565b80601f016020809104026020016040519081016040528092919081815260200182805461177090613c58565b80156117bb5780601f10611792576101008083540402835291602001916117bb565b820191905f5260205f20905b81548152906001019060200180831161179e57829003601f168201915b505050505081526020019060010190611727565b50505050905080515f036117e557505f92915050565b5f805f5b83518110156118aa575f84828151811061180557611805613df3565b602002602001015190505f600d826040516118209190614001565b9081526040805160209281900383018120600101546001600160a01b038c165f908152601090945291832060ff909216935061185d908590614001565b9081526040519081900360200190205461ffff16905061188060ff831682614017565b61188a908761402e565b955061189960ff83168661402e565b945050600190920191506117e99050565b50805f036118bc57505f949350505050565b6118c68183614041565b95945050505050565b60606001805461090b90613c58565b5f806118e984612de2565b6001600160a01b03160361191357604051630f93f59160e31b815260048101849052602401610868565b5f838152600a602081905260409091209081015460ff1680156119395750828160050154145b9150600160115f82825461194d919061402e565b90915550506011546040805184151581526020810192909252339186917fa5ff363161033469580a9b7dbc23e5eda77432603f937cea792538dc9743e90f910160405180910390a35092915050565b6109be338383612dfc565b6119b2848484611227565b6112aa3385858585612ebb565b5f5f805160206144018339815191526119d781612bc4565b5f8590036119f857604051631b10e56960e31b815260040160405180910390fd5b61012c851115611a265760405163508fa55b60e11b81526004810186905261012c6024820152604401610868565b60088054905f611a3583613f1f565b909155505f8181526009602052604090206001810180546001600160a81b0319163361010002179055426002820181905591935090611a789062093a809061402e565b600382015560088101611a8c858783613cce565b505f5b86811015611cdf5736888883818110611aaa57611aaa613df3565b9050602002810190611abc9190614060565b90505f611acc6020830183613803565b6001600160a01b031603611af65760405163de5adc5760e01b815260048101839052602401610868565b611b03602082018261407f565b90505f03611b275760405163d8e4ebe960e01b815260048101839052602401610868565b611b34604082018261407f565b90505f03611b585760405163d9838b0560e01b815260048101839052602401610868565b611b6560a082018261407f565b90505f03611b895760405163499d57c160e11b815260048101839052602401610868565b60c0810135611bae5760405163b03c971560e01b815260048101839052602401610868565b611bbc61016082018261407f565b90505f03611be057604051638648509960e01b815260048101839052602401610868565b6107d0611bf5610160830161014084016140c1565b61ffff161080611c1b5750610834611c15610160830161014084016140c1565b61ffff16115b15611c3b5760405162d3858760e41b815260048101839052602401610868565b5f611c4c61062e6020840184613803565b905061ffff8116611c65610140840161012085016140c1565b61ffff1614611cb05782611c81610140840161012085016140c1565b604051630f819f6560e41b8152600481019290925261ffff908116602483015282166044820152606401610868565b83546001810185555f85815260209020839160090201611cd08282614156565b50508260010192505050611a8f565b506003810154604051339185917f47a716cb413982e1d1051fa38eb2c3de9b57ae937e17125476d667a8f721d77191611d1e918b918b918b91906142be565b60405180910390a35050949350505050565b60605f611d3c83612de2565b6001600160a01b031603611d6657604051630f93f59160e31b815260048101839052602401610868565b5f828152600a60209081526040918290209151611d879260040191016142e8565b6040516020818303038152906040529050919050565b5f80516020614401833981519152611db481612bc4565b6001600160a01b0382165f818152600e602052604090819020805461ff001916610100179055517f4380c3c18e05ce6064b5fb390036a14f10f5b75392e1681ea94afb7a1eede5ac90611e219060208082526006908201526550656461676f60d01b604082015260600190565b60405180910390a25050565b5f80516020614401833981519152611e4481612bc4565b604051806060016040528085858080601f0160208091040260200160405190810160405280939291908181526020018383808284375f9201919091525050509082525060ff84166020820152600160409182015251600d90611ea99089908990613ff2565b90815260405190819003602001902081518190611ec69082613f37565b5060208201516001909101805460409384015115156101000261ffff1990911660ff90931692909217919091179055517f0274df48cd1be79077dbd577536182fe3ad47e7402c9655fe180fdcc665072db90611f2b9088908890889088908890614303565b60405180910390a1505050505050565b6001600160a01b0381165f908152600c6020908152604091829020805483518184028101840190945280845260609392830182828015611f9857602002820191905f5260205f20905b815481526020019060010190808311611f84575b50505050509050919050565b7ff25036a6852152e96c39cc9bf999cf0e78b9ebf96c37327327f9c87088a5dfa7611fce81612bc4565b5f848152600960205260409020600381015442111561200357604051635c4307a160e11b815260048101869052602401610868565b5f600182015460ff16600581111561201d5761201d613a99565b1461204a576001810154604051632373f6fd60e01b815261086891879160ff909116905f90600401613dd2565b80545f5b818110156120c3575f835f01828154811061206b5761206b613df3565b5f91825260209091206009909102016007015462010000900461ffff1690506103e88110156120ba5760405163f7505aa760e01b81526004810183905261ffff82166024820152604401610868565b5060010161204e565b506001828101805460ff1916828002179055504260048301556005820180546001600160a01b03191633179055600a82016120ff858783613cce565b50336001600160a01b0316867fe5d3728c6066d137e7a9df25a7393c4b0f8b110a30b6df7409ebf268a627bc714288886040516108ed9392919061433f565b5f8281526006602052604090206001015461215881612bc4565b6112aa8383612d77565b5f8051602061440183398151915261217981612bc4565b5f61218385612de2565b6001600160a01b0316036121ad57604051630f93f59160e31b815260048101859052602401610868565b5f848152600a60208190526040909120015460ff166121e25760405163178a635d60e31b815260048101859052602401610868565b5f82900361220357604051636ab405cb60e11b815260040160405180910390fd5b5f848152600a60208190526040909120908101805460ff19169055600b0161222c838583613cce565b50336001600160a01b0316847f2e0fcfa3787174875549a3b636786e687846a6694381dd255df177006a1f718785854260405161226b93929190614358565b60405180910390a350505050565b7f577f08e4a510a24c05fb531f78cace5d373d442eb2ba1e22f5bcf2bf4248c21e6122a381612bc4565b6107d061ffff831611156122ca57604051634e643fab60e01b815260040160405180910390fd5b6001600160a01b0385165f908152601060205260409081902090518391906122f59087908790613ff2565b90815260200160405180910390205f6101000a81548161ffff021916908361ffff160217905550846001600160a01b03167f59d0c2159061d3736285a66812b8be328b674e6527417f7db1f880e67744fbb28585853360405161235b949392919061437b565b60405180910390a25050505050565b600f602052815f5260405f208181548110612383575f80fd5b905f5260205f20015f9150915050805461239c90613c58565b80601f01602080910402602001604051908101604052809291908181526020018280546123c890613c58565b80156124135780601f106123ea57610100808354040283529160200191612413565b820191905f5260205f20905b8154815290600101906020018083116123f657829003601f168201915b505050505081565b6001600160a01b039182165f90815260056020908152604080832093909416825291909152205460ff1690565b6124506133e0565b5f61245a83612de2565b6001600160a01b03160361248457604051630f93f59160e31b815260048101839052602401610868565b5f828152600a602052604090819020815161020081019092528054829082906124ac90613c58565b80601f01602080910402602001604051908101604052809291908181526020018280546124d890613c58565b80156125235780601f106124fa57610100808354040283529160200191612523565b820191905f5260205f20905b81548152906001019060200180831161250657829003601f168201915b5050505050815260200160018201805461253c90613c58565b80601f016020809104026020016040519081016040528092919081815260200182805461256890613c58565b80156125b35780601f1061258a576101008083540402835291602001916125b3565b820191905f5260205f20905b81548152906001019060200180831161259657829003601f168201915b505050505081526020016002820180546125cc90613c58565b80601f01602080910402602001604051908101604052809291908181526020018280546125f890613c58565b80156126435780601f1061261a57610100808354040283529160200191612643565b820191905f5260205f20905b81548152906001019060200180831161262657829003601f168201915b5050505050815260200160038201805461265c90613c58565b80601f016020809104026020016040519081016040528092919081815260200182805461268890613c58565b80156126d35780601f106126aa576101008083540402835291602001916126d3565b820191905f5260205f20905b8154815290600101906020018083116126b657829003601f168201915b505050505081526020016004820180546126ec90613c58565b80601f016020809104026020016040519081016040528092919081815260200182805461271890613c58565b80156127635780601f1061273a57610100808354040283529160200191612763565b820191905f5260205f20905b81548152906001019060200180831161274657829003601f168201915b505050918352505060058201546020820152600682015460409091019060ff16600381111561279457612794613a99565b60038111156127a5576127a5613a99565b81526020016006820160019054906101000a900460ff1660048111156127cd576127cd613a99565b60048111156127de576127de613a99565b81526020016006820160029054906101000a900460ff16600381111561280657612806613a99565b600381111561281757612817613a99565b8152600682015461ffff63010000008204811660208401526501000000000090910416604082015260078201805460609092019161285490613c58565b80601f016020809104026020016040519081016040528092919081815260200182805461288090613c58565b80156128cb5780601f106128a2576101008083540402835291602001916128cb565b820191905f5260205f20905b8154815290600101906020018083116128ae57829003601f168201915b50505091835250506008820154602082015260098201546040820152600a82015460ff1615156060820152600b8201805460809092019161290b90613c58565b80601f016020809104026020016040519081016040528092919081815260200182805461293790613c58565b80156129825780601f1061295957610100808354040283529160200191612982565b820191905f5260205f20905b81548152906001019060200180831161296557829003601f168201915b5050505050815250509050919050565b5f805160206144018339815191526129a981612bc4565b6129b38383612d77565b5060405133906001600160a01b0384169085907fcde326cb82cf43f1de7d4eba1f282d6875e840ed6166c5f57d4228a334949592905f90a4505050565b5f80516020614401833981519152612a0781612bc4565b6001600160a01b0382165f818152600e60205260409081902080546201000162ff00ff19909116179055517f4380c3c18e05ce6064b5fb390036a14f10f5b75392e1681ea94afb7a1eede5ac90611e219060208082526005908201526420b236b4b760d91b604082015260600190565b335f908152600e60205260409020805462010000900460ff16612aad5760405163c6f5daed60e01b815260040160405180910390fd5b805460ff161580612ac557508054610100900460ff16155b15612ae3576040516302bb10e560e11b815260040160405180910390fd5b600d8383604051612af5929190613ff2565b9081526040519081900360200190206001015460ff61010090910416612b2e5760405163348239f360e01b815260040160405180910390fd5b335f908152600f6020908152604082208054600181018255908352912001612b57838583613cce565b50336001600160a01b03167f8003d7463c879b49a2d7d70d7b093bb3fa2531616bd6490aabb0a8200bd70f0e8484604051612b93929190613daf565b60405180910390a2505050565b5f6001600160e01b03198216637965db0b60e01b14806107e857506107e882612fe3565b612bce8133613032565b50565b5f80612bdc83612de2565b90506001600160a01b0381166107e857604051637e27328960e01b815260048101849052602401610868565b61138c838383600161306b565b612c1d61316f565b60027f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f0055565b6109be828260405180602001604052805f8152506131b3565b5f6104b08261ffff161015612c7257505f919050565b6105788261ffff161015612c8857506001919050565b6106408261ffff161015612c9e57506002919050565b506003919050565b5f80612cb184612de2565b90506001600160a01b03811615612cdb57604051631e72c12960e31b815260040160405180910390fd5b6118c68585856131ca565b5f612cf183836116cb565b612d70575f8381526006602090815260408083206001600160a01b03861684529091529020805460ff19166001179055612d283390565b6001600160a01b0316826001600160a01b0316847f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45060016107e8565b505f6107e8565b5f612d8283836116cb565b15612d70575f8381526006602090815260408083206001600160a01b0386168085529252808320805460ff1916905551339286917ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b9190a45060016107e8565b5f908152600260205260409020546001600160a01b031690565b6001600160a01b038316612e255760405163a9fbf51f60e01b81525f6004820152602401610868565b6001600160a01b038216612e5757604051630b61174360e31b81526001600160a01b0383166004820152602401610868565b6001600160a01b038381165f81815260056020908152604080832094871680845294825291829020805460ff191686151590811790915591519182527f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c319101611567565b6001600160a01b0383163b15612fdc57604051630a85bd0160e11b81526001600160a01b0384169063150b7a0290612efd9088908890879087906004016143b3565b6020604051808303815f875af1925050508015612f37575060408051601f3d908101601f19168201909252612f34918101906143e5565b60015b612f9e573d808015612f64576040519150601f19603f3d011682016040523d82523d5f602084013e612f69565b606091505b5080515f03612f9657604051633250574960e11b81526001600160a01b0385166004820152602401610868565b805160208201fd5b6001600160e01b03198116630a85bd0160e11b14612fda57604051633250574960e11b81526001600160a01b0385166004820152602401610868565b505b5050505050565b5f6001600160e01b031982166380ac58cd60e01b148061301357506001600160e01b03198216635b5e139f60e01b145b806107e857506301ffc9a760e01b6001600160e01b03198316146107e8565b61303c82826116cb565b6109be5760405163e2517d3f60e01b81526001600160a01b038216600482015260248101839052604401610868565b808061307f57506001600160a01b03821615155b15613140575f61308e84612bd1565b90506001600160a01b038316158015906130ba5750826001600160a01b0316816001600160a01b031614155b80156130cd57506130cb818461241b565b155b156130f65760405163a9fbf51f60e01b81526001600160a01b0384166004820152602401610868565b811561313e5783856001600160a01b0316826001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45b505b50505f90815260046020526040902080546001600160a01b0319166001600160a01b0392909216919091179055565b7f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00546002036131b157604051633ee5aeb560e01b815260040160405180910390fd5b565b6131bd83836132b7565b61138c335f858585612ebb565b5f806131d584612de2565b90506001600160a01b038316156131f1576131f1818486613318565b6001600160a01b0381161561322b5761320c5f855f8061306b565b6001600160a01b0381165f90815260036020526040902080545f190190555b6001600160a01b03851615613259576001600160a01b0385165f908152600360205260409020805460010190555b5f8481526002602052604080822080546001600160a01b0319166001600160a01b0389811691821790925591518793918516917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef91a4949350505050565b6001600160a01b0382166132e057604051633250574960e11b81525f6004820152602401610868565b5f6132ec83835f612ca6565b90506001600160a01b0381161561138c576040516339e3563760e11b81525f6004820152602401610868565b61332383838361337c565b61138c576001600160a01b03831661335157604051637e27328960e01b815260048101829052602401610868565b60405163177e802f60e01b81526001600160a01b038316600482015260248101829052604401610868565b5f6001600160a01b038316158015906133d85750826001600160a01b0316846001600160a01b031614806133b557506133b5848461241b565b806133d857505f828152600460205260409020546001600160a01b038481169116145b949350505050565b60405180610200016040528060608152602001606081526020016060815260200160608152602001606081526020015f80191681526020015f600381111561342a5761342a613a99565b81526020015f81526020015f81526020015f61ffff1681526020015f61ffff168152602001606081526020015f81526020015f81526020015f15158152602001606081525090565b6001600160e01b031981168114612bce575f80fd5b5f60208284031215613497575f80fd5b81356134a281613472565b9392505050565b5f8083601f8401126134b9575f80fd5b5081356001600160401b038111156134cf575f80fd5b6020830191508360208285010111156134e6575f80fd5b9250929050565b5f805f604084860312156134ff575f80fd5b8335925060208401356001600160401b0381111561351b575f80fd5b613527868287016134a9565b9497909650939450505050565b5f81518084528060208401602086015e5f602082860101526020601f19601f83011685010191505092915050565b602081525f6134a26020830184613534565b5f60208284031215613584575f80fd5b5035919050565b6001600160a01b0381168114612bce575f80fd5b5f80604083850312156135b0575f80fd5b82356135bb8161358b565b946020939093013593505050565b634e487b7160e01b5f52604160045260245ffd5b5f6001600160401b03808411156135f6576135f66135c9565b604051601f8501601f19908116603f0116810190828211818310171561361e5761361e6135c9565b81604052809350858152868686011115613636575f80fd5b858560208301375f602087830101525050509392505050565b5f82601f83011261365e575f80fd5b6134a2838335602085016135dd565b5f806040838503121561367e575f80fd5b82356136898161358b565b915060208301356001600160401b038111156136a3575f80fd5b6136af8582860161364f565b9150509250929050565b602080825282518282018190525f9190848201906040850190845b818110156136f0578351835292840192918401916001016136d4565b50909695505050505050565b5f805f6060848603121561370e575f80fd5b83356137198161358b565b925060208401356137298161358b565b929592945050506040919091013590565b5f806040838503121561374b575f80fd5b82359150602083013561375d8161358b565b809150509250929050565b5f8060208385031215613779575f80fd5b82356001600160401b0381111561378e575f80fd5b61379a858286016134a9565b90969095509350505050565b5f602082840312156137b6575f80fd5b81356001600160401b038111156137cb575f80fd5b6133d88482850161364f565b606081525f6137e96060830186613534565b60ff94909416602083015250901515604090910152919050565b5f60208284031215613813575f80fd5b81356134a28161358b565b5f806040838503121561382f575f80fd5b50508035926020909101359150565b5f806040838503121561384f575f80fd5b823561385a8161358b565b91506020830135801515811461375d575f80fd5b5f805f8060808587031215613881575f80fd5b843561388c8161358b565b9350602085013561389c8161358b565b92506040850135915060608501356001600160401b038111156138bd575f80fd5b8501601f810187136138cd575f80fd5b6138dc878235602084016135dd565b91505092959194509250565b5f805f80604085870312156138fb575f80fd5b84356001600160401b0380821115613911575f80fd5b818701915087601f830112613924575f80fd5b813581811115613932575f80fd5b8860208260051b8501011115613946575f80fd5b602092830196509450908601359080821115613960575f80fd5b5061396d878288016134a9565b95989497509550505050565b5f805f805f6060868803121561398d575f80fd5b85356001600160401b03808211156139a3575f80fd5b6139af89838a016134a9565b909750955060208801359150808211156139c7575f80fd5b506139d4888289016134a9565b909450925050604086013560ff811681146139ed575f80fd5b809150509295509295909350565b61ffff81168114612bce575f80fd5b5f805f8060608587031215613a1d575f80fd5b8435613a288161358b565b935060208501356001600160401b03811115613a42575f80fd5b613a4e878288016134a9565b9094509250506040850135613a62816139fb565b939692955090935050565b5f8060408385031215613a7e575f80fd5b8235613a898161358b565b9150602083013561375d8161358b565b634e487b7160e01b5f52602160045260245ffd5b60048110612bce57612bce613a99565b613ac681613aad565b9052565b60058110613ac657613ac6613a99565b602081525f8251610200806020850152613af8610220850183613534565b91506020850151601f1980868503016040870152613b168483613534565b93506040870151915080868503016060870152613b338483613534565b93506060870151915080868503016080870152613b508483613534565b935060808701519150808685030160a0870152613b6d8483613534565b935060a087015160c087015260c08701519150613b8d60e0870183613abd565b60e08701519150610100613ba381880184613aca565b8701519150610120613bb787820184613abd565b8701519150610140613bce8782018461ffff169052565b8701519150610160613be58782018461ffff169052565b80880151925050610180818786030181880152613c028584613534565b908801516101a0888101919091528801516101c08089019190915288015190945091506101e0613c358188018415159052565b870151868503909101838701529050613c4e8382613534565b9695505050505050565b600181811c90821680613c6c57607f821691505b60208210810361122157634e487b7160e01b5f52602260045260245ffd5b601f82111561138c57805f5260205f20601f840160051c81016020851015613caf5750805b601f840160051c820191505b81811015612fdc575f8155600101613cbb565b6001600160401b03831115613ce557613ce56135c9565b613cf983613cf38354613c58565b83613c8a565b5f601f841160018114613d2a575f8515613d135750838201355b5f19600387901b1c1916600186901b178355612fdc565b5f83815260208120601f198716915b82811015613d595786850135825560209485019460019092019101613d39565b5086821015613d75575f1960f88860031b161c19848701351681555b505060018560011b0183555050505050565b81835281816020850137505f828201602090810191909152601f909101601f19169091010190565b602081525f6133d8602083018486613d87565b60068110613ac657613ac6613a99565b83815260608101613de66020830185613dc2565b6133d86040830184613dc2565b634e487b7160e01b5f52603260045260245ffd5b5f8154613e1381613c58565b60018281168015613e2b5760018114613e4057613e6c565b60ff1984168752821515830287019450613e6c565b855f526020805f205f5b85811015613e635781548a820152908401908201613e4a565b50505082870194505b5050505092915050565b5f6134a28284613e07565b5f60208083525f8454613e9381613c58565b806020870152604060018084165f8114613eb45760018114613ed057613efd565b60ff19851660408a0152604084151560051b8a01019550613efd565b895f5260205f205f5b85811015613ef45781548b8201860152908301908801613ed9565b8a016040019650505b509398975050505050505050565b634e487b7160e01b5f52601160045260245ffd5b5f60018201613f3057613f30613f0b565b5060010190565b81516001600160401b03811115613f5057613f506135c9565b613f6481613f5e8454613c58565b84613c8a565b602080601f831160018114613f97575f8415613f805750858301515b5f19600386901b1c1916600185901b178555612fda565b5f85815260208120601f198616915b82811015613fc557888601518255948401946001909101908401613fa6565b5085821015613fe257878501515f19600388901b60f8161c191681555b5050505050600190811b01905550565b818382375f9101908152919050565b5f82518060208501845e5f920191825250919050565b80820281158282048414176107e8576107e8613f0b565b808201808211156107e8576107e8613f0b565b5f8261405b57634e487b7160e01b5f52601260045260245ffd5b500490565b5f823561017e19833603018112614075575f80fd5b9190910192915050565b5f808335601e19843603018112614094575f80fd5b8301803591506001600160401b038211156140ad575f80fd5b6020019150368190038213156134e6575f80fd5b5f602082840312156140d1575f80fd5b81356134a2816139fb565b5f81356107e88161358b565b5f8135600481106107e8575f80fd5b61410082613aad565b60ff1981541660ff831681178255505050565b5f8135600581106107e8575f80fd5b6005821061413257614132613a99565b805461ff008360081b1661ff00198216178255505050565b5f81356107e8816139fb565b61417f614162836140dc565b82546001600160a01b0319166001600160a01b0391909116178255565b61418c602083018361407f565b61419a818360018601613cce565b50506141a9604083018361407f565b6141b7818360028601613cce565b50506141c6606083018361407f565b6141d4818360038601613cce565b50506141e3608083018361407f565b6141f1818360048601613cce565b505061420060a083018361407f565b61420e818360058601613cce565b505060c082013560068201556007810161423361422d60e085016140e8565b826140f7565b6142496142436101008501614113565b82614122565b614273614259610120850161414a565b825463ffff0000191660109190911b63ffff000016178255565b6142a1614283610140850161414a565b825465ffff00000000191660209190911b65ffff0000000016178255565b506142b061016083018361407f565b6112aa818360088601613cce565b848152606060208201525f6142d7606083018587613d87565b905082604083015295945050505050565b66697066733a2f2f60c81b81525f6134a26007830184613e07565b606081525f614316606083018789613d87565b8281036020840152614329818688613d87565b91505060ff831660408301529695505050505050565b838152604060208201525f6118c6604083018486613d87565b604081525f61436b604083018587613d87565b9050826020830152949350505050565b606081525f61438e606083018688613d87565b61ffff949094166020830152506001600160a01b039190911660409091015292915050565b6001600160a01b03858116825284166020820152604081018390526080606082018190525f90613c4e90830184613534565b5f602082840312156143f5575f80fd5b81516134a28161347256fea49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775a26469706673582212200c8b5dfd48290749537a38e10f7ec3698ba56439c3f51af8018c030cb0c3716864736f6c63430008190033",
    deployedBytecode:
      "0x608060405234801561000f575f80fd5b50600436106102fe575f3560e01c80638a14e3d011610195578063cdede366116100e4578063d61dd05e1161009e578063ee818e2011610079578063ee818e2014610785578063f6ba0007146107a5578063f82426de146107b8578063f94b2cd4146107cb575f80fd5b8063d61dd05e1461074c578063e28fea341461075f578063e985e9c514610772575f80fd5b8063cdede366146106e4578063cfdbf254146106f7578063d1b9329214610700578063d3cac7e114610713578063d547741f14610726578063d57a3c0714610739575f80fd5b8063a22cb4651161014f578063bcee8b3c1161012a578063bcee8b3c14610684578063c81cf77114610697578063c87b56dd146106be578063c903e522146106d1575f80fd5b8063a22cb46514610655578063a27f421e14610668578063b88d4fde14610671575f80fd5b80638a14e3d01461060357806391d148541461060d578063939adc061461062057806395d89b411461063357806395fa12d61461063b578063a217fddf1461064e575f80fd5b80632f2ff15d1161025157806342842e0e1161020b57806365eb3b88116101e657806365eb3b881461057f57806370a08231146105d357806375b238fc146105e65780638626d715146105fa575f80fd5b806342842e0e14610546578063536e448c146105595780636352211e1461056c575f80fd5b80632f2ff15d146104c557806330a727b3146104d857806336568abe146104eb57806337d18db5146104fe578063399cf6981461051157806341cd097714610533575f80fd5b8063095ea7b3116102bc57806323b872dd1161029757806323b872dd14610442578063248a9ca31461045557806324d42a37146104775780632ac7cf451461049e575f80fd5b8063095ea7b3146103bd5780631de378ec146103d057806320e409b414610422575f80fd5b80622854d71461030257806301ffc9a71461033c57806305beaad51461035f57806306fdde0314610374578063081812fc146103895780630830e22e146103b4575b5f80fd5b6103297ff25036a6852152e96c39cc9bf999cf0e78b9ebf96c37327327f9c87088a5dfa781565b6040519081526020015b60405180910390f35b61034f61034a366004613487565b6107de565b6040519015158152602001610333565b61037261036d3660046134ed565b6107ee565b005b61037c6108fd565b6040516103339190613562565b61039c610397366004613574565b61098c565b6040516001600160a01b039091168152602001610333565b61032960115481565b6103726103cb36600461359f565b6109b3565b61040f6103de36600461366d565b601060209081525f9283526040909220815180830184018051928152908401929093019190912091525461ffff1681565b60405161ffff9091168152602001610333565b610435610430366004613574565b6109c2565b60405161033391906136b9565b6103726104503660046136fc565b611227565b610329610463366004613574565b5f9081526006602052604090206001015490565b6103297f5f1d1e303f9c0a1801dd708bdc4239781d66c88ca6cb941c5769ba09b5c1b28581565b6103297fba7924dbc18a088ff62f660bed95aba930bcbad059dcde0da6fc643115d44ba381565b6103726104d336600461373a565b6112b0565b6103726104e636600461373a565b6112d4565b6103726104f936600461373a565b611359565b61034f61050c366004613768565b611391565b61052461051f3660046137a6565b6113bf565b604051610333939291906137d7565b610372610541366004613574565b611478565b6103726105543660046136fc565b611574565b610372610567366004613574565b61158e565b61039c61057a366004613574565b61167c565b6105b461058d366004613803565b600e6020525f908152604090205460ff808216916101008104821691620100009091041683565b6040805193151584529115156020840152151590820152606001610333565b6103296105e1366004613803565b611686565b6103295f8051602061440183398151915281565b61040f6107d081565b61032962093a8081565b61034f61061b36600461373a565b6116cb565b61040f61062e366004613803565b6116f5565b61037c6118cf565b61034f61064936600461381e565b6118de565b6103295f81565b61037261066336600461383e565b61199c565b61040f6103e881565b61037261067f36600461386e565b6119a7565b6103296106923660046138e8565b6119bf565b6103297f577f08e4a510a24c05fb531f78cace5d373d442eb2ba1e22f5bcf2bf4248c21e81565b61037c6106cc366004613574565b611d30565b6103726106df366004613803565b611d9d565b6103726106f2366004613979565b611e2d565b61032961012c81565b61043561070e366004613803565b611f3b565b6103726107213660046134ed565b611fa4565b61037261073436600461373a565b61213e565b6103726107473660046134ed565b612162565b61037261075a366004613a0a565b612279565b61037c61076d36600461359f565b61236a565b61034f610780366004613a6d565b61241b565b610798610793366004613574565b612448565b6040516103339190613ada565b6103726107b336600461373a565b612992565b6103726107c6366004613803565b6129f0565b6103726107d9366004613768565b612a77565b5f6107e882612ba0565b92915050565b5f8051602061440183398151915261080581612bc4565b5f848152600960205260409020600181015460ff16600481600581111561082e5761082e613a99565b148061084b5750600581600581111561084957610849613a99565b145b1561087157604051630aa7920560e31b8152600481018790526024015b60405180910390fd5b5f8490036108925760405163546d6d5960e01b815260040160405180910390fd5b60018201805460ff19166005179055600982016108b0858783613cce565b50336001600160a01b0316867fc554792a539c0d5fb25762225b65f807a7741dc70229828b2ea03bc3e1bdc24587876040516108ed929190613daf565b60405180910390a3505050505050565b60605f805461090b90613c58565b80601f016020809104026020016040519081016040528092919081815260200182805461093790613c58565b80156109825780601f1061095957610100808354040283529160200191610982565b820191905f5260205f20905b81548152906001019060200180831161096557829003601f168201915b5050505050905090565b5f61099682612bd1565b505f828152600460205260409020546001600160a01b03166107e8565b6109be828233612c08565b5050565b60605f805160206144018339815191526109db81612bc4565b6109e3612c15565b5f8381526009602052604090206003810154421115610a1857604051635c4307a160e11b815260048101859052602401610868565b6003600182015460ff166005811115610a3357610a33613a99565b14610a61576001810154604051632373f6fd60e01b815261086891869160ff90911690600390600401613dd2565b8054806001600160401b03811115610a7b57610a7b6135c9565b604051908082528060200260200182016040528015610aa4578160200160208202803683370190505b5093505f5b818110156111ac575f835f018281548110610ac657610ac6613df3565b905f5260205f2090600902019050600b81600201604051610ae79190613e76565b9081526040519081900360200190205460ff1615610b1d5780600201604051637024c4ad60e11b81526004016108689190613e81565b600780545f9182610b2d83613f1f565b909155508254909150610b49906001600160a01b031682612c43565b604051806102000160405280836001018054610b6490613c58565b80601f0160208091040260200160405190810160405280929190818152602001828054610b9090613c58565b8015610bdb5780601f10610bb257610100808354040283529160200191610bdb565b820191905f5260205f20905b815481529060010190602001808311610bbe57829003601f168201915b50505050508152602001836002018054610bf490613c58565b80601f0160208091040260200160405190810160405280929190818152602001828054610c2090613c58565b8015610c6b5780601f10610c4257610100808354040283529160200191610c6b565b820191905f5260205f20905b815481529060010190602001808311610c4e57829003601f168201915b50505050508152602001836003018054610c8490613c58565b80601f0160208091040260200160405190810160405280929190818152602001828054610cb090613c58565b8015610cfb5780601f10610cd257610100808354040283529160200191610cfb565b820191905f5260205f20905b815481529060010190602001808311610cde57829003601f168201915b50505050508152602001836004018054610d1490613c58565b80601f0160208091040260200160405190810160405280929190818152602001828054610d4090613c58565b8015610d8b5780601f10610d6257610100808354040283529160200191610d8b565b820191905f5260205f20905b815481529060010190602001808311610d6e57829003601f168201915b50505050508152602001836005018054610da490613c58565b80601f0160208091040260200160405190810160405280929190818152602001828054610dd090613c58565b8015610e1b5780601f10610df257610100808354040283529160200191610e1b565b820191905f5260205f20905b815481529060010190602001808311610dfe57829003601f168201915b505050918352505060068401546020820152600784015460409091019060ff166003811115610e4c57610e4c613a99565b81526020018360070160019054906101000a900460ff166004811115610e7457610e74613a99565b8152602001610e948460070160029054906101000a900461ffff16612c5c565b6003811115610ea557610ea5613a99565b8152600784015461ffff62010000820481166020840152640100000000909104166040820152600884018054606090920191610ee090613c58565b80601f0160208091040260200160405190810160405280929190818152602001828054610f0c90613c58565b8015610f575780601f10610f2e57610100808354040283529160200191610f57565b820191905f5260205f20905b815481529060010190602001808311610f3a57829003601f168201915b505050918352505060208082018b90524260408084019190915260016060840152805180830182525f808252608090940152848352600a909152902081518190610fa19082613f37565b5060208201516001820190610fb69082613f37565b5060408201516002820190610fcb9082613f37565b5060608201516003820190610fe09082613f37565b5060808201516004820190610ff59082613f37565b5060a0820151600582015560c082015160068201805460ff1916600183600381111561102357611023613a99565b021790555060e082015160068201805461ff00191661010083600481111561104d5761104d613a99565b021790555061010082015160068201805462ff000019166201000083600381111561107a5761107a613a99565b021790555061012082015160068201805461014085015161ffff908116650100000000000266ffff000000000019919094166301000000021666ffffffff000000199091161791909117905561016082015160078201906110db9082613f37565b5061018082015160088201556101a082015160098201556101c0820151600a8201805460ff19169115159190911790556101e0820151600b8201906111209082613f37565b509050506001600b836002016040516111399190613e76565b9081526040805160209281900383019020805460ff19169315159390931790925583546001600160a01b03165f908152600c825291822080546001810182559083529120018190558651819088908590811061119757611197613df3565b60209081029190910101525050600101610aa9565b5060018201805460ff1916600417905560405185907f5e33bd39b860afb968e64e6ae6b18f462ce1f9262e3fb7d34d6cb661b95f43a7906111ee9087906136b9565b60405180910390a2505061122160017f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f0055565b50919050565b6001600160a01b03821661125057604051633250574960e11b81525f6004820152602401610868565b5f61125c838333612ca6565b9050836001600160a01b0316816001600160a01b0316146112aa576040516364283d7b60e01b81526001600160a01b0380861660048301526024820184905282166044820152606401610868565b50505050565b5f828152600660205260409020600101546112ca81612bc4565b6112aa8383612ce6565b5f805160206144018339815191526112eb81612bc4565b6001600160a01b0382166113125760405163af0849dd60e01b815260040160405180910390fd5b61131c8383612ce6565b5060405133906001600160a01b0384169085907fd3c3c74ac78e01f4affcaa9191550c84a2b0b79d8f0dfcee7645eda13a90c6c7905f90a4505050565b6001600160a01b03811633146113825760405163334bd91960e11b815260040160405180910390fd5b61138c8282612d77565b505050565b5f600b83836040516113a4929190613ff2565b9081526040519081900360200190205460ff16905092915050565b8051602081830181018051600d825292820191909301209152805481906113e590613c58565b80601f016020809104026020016040519081016040528092919081815260200182805461141190613c58565b801561145c5780601f106114335761010080835404028352916020019161145c565b820191905f5260205f20905b81548152906001019060200180831161143f57829003601f168201915b5050506001909301549192505060ff8082169161010090041683565b7f5f1d1e303f9c0a1801dd708bdc4239781d66c88ca6cb941c5769ba09b5c1b2856114a281612bc4565b5f82815260096020526040902060038101544211156114d757604051635c4307a160e11b815260048101849052602401610868565b6002600182015460ff1660058111156114f2576114f2613a99565b14611520576001810154604051632373f6fd60e01b815261086891859160ff90911690600290600401613dd2565b60018101805460ff191660031790554260078201819055604051908152339084907f9b96e7cab3372e0696cb1cc0225c297c6ac2eb98d39fc2509159d6da3b2a112f906020015b60405180910390a3505050565b61138c83838360405180602001604052805f8152506119a7565b7fba7924dbc18a088ff62f660bed95aba930bcbad059dcde0da6fc643115d44ba36115b881612bc4565b5f82815260096020526040902060038101544211156115ed57604051635c4307a160e11b815260048101849052602401610868565b60018082015460ff16600581111561160757611607613a99565b1461163157600180820154604051632373f6fd60e01b815261086892869260ff1691600401613dd2565b60018101805460ff191660021790554260068201819055604051908152339084907f01dbe9111fada9353a4888fcd49a2b94b1e8b9f93bd2e48fc74d1eb7cdbab8d790602001611567565b5f6107e882612bd1565b5f6001600160a01b0382166116b0576040516322718ad960e21b81525f6004820152602401610868565b506001600160a01b03165f9081526003602052604090205490565b5f9182526006602090815260408084206001600160a01b0393909316845291905290205460ff1690565b6001600160a01b0381165f908152600f6020908152604080832080548251818502810185019093528083528493849084015b828210156117cf578382905f5260205f2001805461174490613c58565b80601f016020809104026020016040519081016040528092919081815260200182805461177090613c58565b80156117bb5780601f10611792576101008083540402835291602001916117bb565b820191905f5260205f20905b81548152906001019060200180831161179e57829003601f168201915b505050505081526020019060010190611727565b50505050905080515f036117e557505f92915050565b5f805f5b83518110156118aa575f84828151811061180557611805613df3565b602002602001015190505f600d826040516118209190614001565b9081526040805160209281900383018120600101546001600160a01b038c165f908152601090945291832060ff909216935061185d908590614001565b9081526040519081900360200190205461ffff16905061188060ff831682614017565b61188a908761402e565b955061189960ff83168661402e565b945050600190920191506117e99050565b50805f036118bc57505f949350505050565b6118c68183614041565b95945050505050565b60606001805461090b90613c58565b5f806118e984612de2565b6001600160a01b03160361191357604051630f93f59160e31b815260048101849052602401610868565b5f838152600a602081905260409091209081015460ff1680156119395750828160050154145b9150600160115f82825461194d919061402e565b90915550506011546040805184151581526020810192909252339186917fa5ff363161033469580a9b7dbc23e5eda77432603f937cea792538dc9743e90f910160405180910390a35092915050565b6109be338383612dfc565b6119b2848484611227565b6112aa3385858585612ebb565b5f5f805160206144018339815191526119d781612bc4565b5f8590036119f857604051631b10e56960e31b815260040160405180910390fd5b61012c851115611a265760405163508fa55b60e11b81526004810186905261012c6024820152604401610868565b60088054905f611a3583613f1f565b909155505f8181526009602052604090206001810180546001600160a81b0319163361010002179055426002820181905591935090611a789062093a809061402e565b600382015560088101611a8c858783613cce565b505f5b86811015611cdf5736888883818110611aaa57611aaa613df3565b9050602002810190611abc9190614060565b90505f611acc6020830183613803565b6001600160a01b031603611af65760405163de5adc5760e01b815260048101839052602401610868565b611b03602082018261407f565b90505f03611b275760405163d8e4ebe960e01b815260048101839052602401610868565b611b34604082018261407f565b90505f03611b585760405163d9838b0560e01b815260048101839052602401610868565b611b6560a082018261407f565b90505f03611b895760405163499d57c160e11b815260048101839052602401610868565b60c0810135611bae5760405163b03c971560e01b815260048101839052602401610868565b611bbc61016082018261407f565b90505f03611be057604051638648509960e01b815260048101839052602401610868565b6107d0611bf5610160830161014084016140c1565b61ffff161080611c1b5750610834611c15610160830161014084016140c1565b61ffff16115b15611c3b5760405162d3858760e41b815260048101839052602401610868565b5f611c4c61062e6020840184613803565b905061ffff8116611c65610140840161012085016140c1565b61ffff1614611cb05782611c81610140840161012085016140c1565b604051630f819f6560e41b8152600481019290925261ffff908116602483015282166044820152606401610868565b83546001810185555f85815260209020839160090201611cd08282614156565b50508260010192505050611a8f565b506003810154604051339185917f47a716cb413982e1d1051fa38eb2c3de9b57ae937e17125476d667a8f721d77191611d1e918b918b918b91906142be565b60405180910390a35050949350505050565b60605f611d3c83612de2565b6001600160a01b031603611d6657604051630f93f59160e31b815260048101839052602401610868565b5f828152600a60209081526040918290209151611d879260040191016142e8565b6040516020818303038152906040529050919050565b5f80516020614401833981519152611db481612bc4565b6001600160a01b0382165f818152600e602052604090819020805461ff001916610100179055517f4380c3c18e05ce6064b5fb390036a14f10f5b75392e1681ea94afb7a1eede5ac90611e219060208082526006908201526550656461676f60d01b604082015260600190565b60405180910390a25050565b5f80516020614401833981519152611e4481612bc4565b604051806060016040528085858080601f0160208091040260200160405190810160405280939291908181526020018383808284375f9201919091525050509082525060ff84166020820152600160409182015251600d90611ea99089908990613ff2565b90815260405190819003602001902081518190611ec69082613f37565b5060208201516001909101805460409384015115156101000261ffff1990911660ff90931692909217919091179055517f0274df48cd1be79077dbd577536182fe3ad47e7402c9655fe180fdcc665072db90611f2b9088908890889088908890614303565b60405180910390a1505050505050565b6001600160a01b0381165f908152600c6020908152604091829020805483518184028101840190945280845260609392830182828015611f9857602002820191905f5260205f20905b815481526020019060010190808311611f84575b50505050509050919050565b7ff25036a6852152e96c39cc9bf999cf0e78b9ebf96c37327327f9c87088a5dfa7611fce81612bc4565b5f848152600960205260409020600381015442111561200357604051635c4307a160e11b815260048101869052602401610868565b5f600182015460ff16600581111561201d5761201d613a99565b1461204a576001810154604051632373f6fd60e01b815261086891879160ff909116905f90600401613dd2565b80545f5b818110156120c3575f835f01828154811061206b5761206b613df3565b5f91825260209091206009909102016007015462010000900461ffff1690506103e88110156120ba5760405163f7505aa760e01b81526004810183905261ffff82166024820152604401610868565b5060010161204e565b506001828101805460ff1916828002179055504260048301556005820180546001600160a01b03191633179055600a82016120ff858783613cce565b50336001600160a01b0316867fe5d3728c6066d137e7a9df25a7393c4b0f8b110a30b6df7409ebf268a627bc714288886040516108ed9392919061433f565b5f8281526006602052604090206001015461215881612bc4565b6112aa8383612d77565b5f8051602061440183398151915261217981612bc4565b5f61218385612de2565b6001600160a01b0316036121ad57604051630f93f59160e31b815260048101859052602401610868565b5f848152600a60208190526040909120015460ff166121e25760405163178a635d60e31b815260048101859052602401610868565b5f82900361220357604051636ab405cb60e11b815260040160405180910390fd5b5f848152600a60208190526040909120908101805460ff19169055600b0161222c838583613cce565b50336001600160a01b0316847f2e0fcfa3787174875549a3b636786e687846a6694381dd255df177006a1f718785854260405161226b93929190614358565b60405180910390a350505050565b7f577f08e4a510a24c05fb531f78cace5d373d442eb2ba1e22f5bcf2bf4248c21e6122a381612bc4565b6107d061ffff831611156122ca57604051634e643fab60e01b815260040160405180910390fd5b6001600160a01b0385165f908152601060205260409081902090518391906122f59087908790613ff2565b90815260200160405180910390205f6101000a81548161ffff021916908361ffff160217905550846001600160a01b03167f59d0c2159061d3736285a66812b8be328b674e6527417f7db1f880e67744fbb28585853360405161235b949392919061437b565b60405180910390a25050505050565b600f602052815f5260405f208181548110612383575f80fd5b905f5260205f20015f9150915050805461239c90613c58565b80601f01602080910402602001604051908101604052809291908181526020018280546123c890613c58565b80156124135780601f106123ea57610100808354040283529160200191612413565b820191905f5260205f20905b8154815290600101906020018083116123f657829003601f168201915b505050505081565b6001600160a01b039182165f90815260056020908152604080832093909416825291909152205460ff1690565b6124506133e0565b5f61245a83612de2565b6001600160a01b03160361248457604051630f93f59160e31b815260048101839052602401610868565b5f828152600a602052604090819020815161020081019092528054829082906124ac90613c58565b80601f01602080910402602001604051908101604052809291908181526020018280546124d890613c58565b80156125235780601f106124fa57610100808354040283529160200191612523565b820191905f5260205f20905b81548152906001019060200180831161250657829003601f168201915b5050505050815260200160018201805461253c90613c58565b80601f016020809104026020016040519081016040528092919081815260200182805461256890613c58565b80156125b35780601f1061258a576101008083540402835291602001916125b3565b820191905f5260205f20905b81548152906001019060200180831161259657829003601f168201915b505050505081526020016002820180546125cc90613c58565b80601f01602080910402602001604051908101604052809291908181526020018280546125f890613c58565b80156126435780601f1061261a57610100808354040283529160200191612643565b820191905f5260205f20905b81548152906001019060200180831161262657829003601f168201915b5050505050815260200160038201805461265c90613c58565b80601f016020809104026020016040519081016040528092919081815260200182805461268890613c58565b80156126d35780601f106126aa576101008083540402835291602001916126d3565b820191905f5260205f20905b8154815290600101906020018083116126b657829003601f168201915b505050505081526020016004820180546126ec90613c58565b80601f016020809104026020016040519081016040528092919081815260200182805461271890613c58565b80156127635780601f1061273a57610100808354040283529160200191612763565b820191905f5260205f20905b81548152906001019060200180831161274657829003601f168201915b505050918352505060058201546020820152600682015460409091019060ff16600381111561279457612794613a99565b60038111156127a5576127a5613a99565b81526020016006820160019054906101000a900460ff1660048111156127cd576127cd613a99565b60048111156127de576127de613a99565b81526020016006820160029054906101000a900460ff16600381111561280657612806613a99565b600381111561281757612817613a99565b8152600682015461ffff63010000008204811660208401526501000000000090910416604082015260078201805460609092019161285490613c58565b80601f016020809104026020016040519081016040528092919081815260200182805461288090613c58565b80156128cb5780601f106128a2576101008083540402835291602001916128cb565b820191905f5260205f20905b8154815290600101906020018083116128ae57829003601f168201915b50505091835250506008820154602082015260098201546040820152600a82015460ff1615156060820152600b8201805460809092019161290b90613c58565b80601f016020809104026020016040519081016040528092919081815260200182805461293790613c58565b80156129825780601f1061295957610100808354040283529160200191612982565b820191905f5260205f20905b81548152906001019060200180831161296557829003601f168201915b5050505050815250509050919050565b5f805160206144018339815191526129a981612bc4565b6129b38383612d77565b5060405133906001600160a01b0384169085907fcde326cb82cf43f1de7d4eba1f282d6875e840ed6166c5f57d4228a334949592905f90a4505050565b5f80516020614401833981519152612a0781612bc4565b6001600160a01b0382165f818152600e60205260409081902080546201000162ff00ff19909116179055517f4380c3c18e05ce6064b5fb390036a14f10f5b75392e1681ea94afb7a1eede5ac90611e219060208082526005908201526420b236b4b760d91b604082015260600190565b335f908152600e60205260409020805462010000900460ff16612aad5760405163c6f5daed60e01b815260040160405180910390fd5b805460ff161580612ac557508054610100900460ff16155b15612ae3576040516302bb10e560e11b815260040160405180910390fd5b600d8383604051612af5929190613ff2565b9081526040519081900360200190206001015460ff61010090910416612b2e5760405163348239f360e01b815260040160405180910390fd5b335f908152600f6020908152604082208054600181018255908352912001612b57838583613cce565b50336001600160a01b03167f8003d7463c879b49a2d7d70d7b093bb3fa2531616bd6490aabb0a8200bd70f0e8484604051612b93929190613daf565b60405180910390a2505050565b5f6001600160e01b03198216637965db0b60e01b14806107e857506107e882612fe3565b612bce8133613032565b50565b5f80612bdc83612de2565b90506001600160a01b0381166107e857604051637e27328960e01b815260048101849052602401610868565b61138c838383600161306b565b612c1d61316f565b60027f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f0055565b6109be828260405180602001604052805f8152506131b3565b5f6104b08261ffff161015612c7257505f919050565b6105788261ffff161015612c8857506001919050565b6106408261ffff161015612c9e57506002919050565b506003919050565b5f80612cb184612de2565b90506001600160a01b03811615612cdb57604051631e72c12960e31b815260040160405180910390fd5b6118c68585856131ca565b5f612cf183836116cb565b612d70575f8381526006602090815260408083206001600160a01b03861684529091529020805460ff19166001179055612d283390565b6001600160a01b0316826001600160a01b0316847f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45060016107e8565b505f6107e8565b5f612d8283836116cb565b15612d70575f8381526006602090815260408083206001600160a01b0386168085529252808320805460ff1916905551339286917ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b9190a45060016107e8565b5f908152600260205260409020546001600160a01b031690565b6001600160a01b038316612e255760405163a9fbf51f60e01b81525f6004820152602401610868565b6001600160a01b038216612e5757604051630b61174360e31b81526001600160a01b0383166004820152602401610868565b6001600160a01b038381165f81815260056020908152604080832094871680845294825291829020805460ff191686151590811790915591519182527f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c319101611567565b6001600160a01b0383163b15612fdc57604051630a85bd0160e11b81526001600160a01b0384169063150b7a0290612efd9088908890879087906004016143b3565b6020604051808303815f875af1925050508015612f37575060408051601f3d908101601f19168201909252612f34918101906143e5565b60015b612f9e573d808015612f64576040519150601f19603f3d011682016040523d82523d5f602084013e612f69565b606091505b5080515f03612f9657604051633250574960e11b81526001600160a01b0385166004820152602401610868565b805160208201fd5b6001600160e01b03198116630a85bd0160e11b14612fda57604051633250574960e11b81526001600160a01b0385166004820152602401610868565b505b5050505050565b5f6001600160e01b031982166380ac58cd60e01b148061301357506001600160e01b03198216635b5e139f60e01b145b806107e857506301ffc9a760e01b6001600160e01b03198316146107e8565b61303c82826116cb565b6109be5760405163e2517d3f60e01b81526001600160a01b038216600482015260248101839052604401610868565b808061307f57506001600160a01b03821615155b15613140575f61308e84612bd1565b90506001600160a01b038316158015906130ba5750826001600160a01b0316816001600160a01b031614155b80156130cd57506130cb818461241b565b155b156130f65760405163a9fbf51f60e01b81526001600160a01b0384166004820152602401610868565b811561313e5783856001600160a01b0316826001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45b505b50505f90815260046020526040902080546001600160a01b0319166001600160a01b0392909216919091179055565b7f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00546002036131b157604051633ee5aeb560e01b815260040160405180910390fd5b565b6131bd83836132b7565b61138c335f858585612ebb565b5f806131d584612de2565b90506001600160a01b038316156131f1576131f1818486613318565b6001600160a01b0381161561322b5761320c5f855f8061306b565b6001600160a01b0381165f90815260036020526040902080545f190190555b6001600160a01b03851615613259576001600160a01b0385165f908152600360205260409020805460010190555b5f8481526002602052604080822080546001600160a01b0319166001600160a01b0389811691821790925591518793918516917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef91a4949350505050565b6001600160a01b0382166132e057604051633250574960e11b81525f6004820152602401610868565b5f6132ec83835f612ca6565b90506001600160a01b0381161561138c576040516339e3563760e11b81525f6004820152602401610868565b61332383838361337c565b61138c576001600160a01b03831661335157604051637e27328960e01b815260048101829052602401610868565b60405163177e802f60e01b81526001600160a01b038316600482015260248101829052604401610868565b5f6001600160a01b038316158015906133d85750826001600160a01b0316846001600160a01b031614806133b557506133b5848461241b565b806133d857505f828152600460205260409020546001600160a01b038481169116145b949350505050565b60405180610200016040528060608152602001606081526020016060815260200160608152602001606081526020015f80191681526020015f600381111561342a5761342a613a99565b81526020015f81526020015f81526020015f61ffff1681526020015f61ffff168152602001606081526020015f81526020015f81526020015f15158152602001606081525090565b6001600160e01b031981168114612bce575f80fd5b5f60208284031215613497575f80fd5b81356134a281613472565b9392505050565b5f8083601f8401126134b9575f80fd5b5081356001600160401b038111156134cf575f80fd5b6020830191508360208285010111156134e6575f80fd5b9250929050565b5f805f604084860312156134ff575f80fd5b8335925060208401356001600160401b0381111561351b575f80fd5b613527868287016134a9565b9497909650939450505050565b5f81518084528060208401602086015e5f602082860101526020601f19601f83011685010191505092915050565b602081525f6134a26020830184613534565b5f60208284031215613584575f80fd5b5035919050565b6001600160a01b0381168114612bce575f80fd5b5f80604083850312156135b0575f80fd5b82356135bb8161358b565b946020939093013593505050565b634e487b7160e01b5f52604160045260245ffd5b5f6001600160401b03808411156135f6576135f66135c9565b604051601f8501601f19908116603f0116810190828211818310171561361e5761361e6135c9565b81604052809350858152868686011115613636575f80fd5b858560208301375f602087830101525050509392505050565b5f82601f83011261365e575f80fd5b6134a2838335602085016135dd565b5f806040838503121561367e575f80fd5b82356136898161358b565b915060208301356001600160401b038111156136a3575f80fd5b6136af8582860161364f565b9150509250929050565b602080825282518282018190525f9190848201906040850190845b818110156136f0578351835292840192918401916001016136d4565b50909695505050505050565b5f805f6060848603121561370e575f80fd5b83356137198161358b565b925060208401356137298161358b565b929592945050506040919091013590565b5f806040838503121561374b575f80fd5b82359150602083013561375d8161358b565b809150509250929050565b5f8060208385031215613779575f80fd5b82356001600160401b0381111561378e575f80fd5b61379a858286016134a9565b90969095509350505050565b5f602082840312156137b6575f80fd5b81356001600160401b038111156137cb575f80fd5b6133d88482850161364f565b606081525f6137e96060830186613534565b60ff94909416602083015250901515604090910152919050565b5f60208284031215613813575f80fd5b81356134a28161358b565b5f806040838503121561382f575f80fd5b50508035926020909101359150565b5f806040838503121561384f575f80fd5b823561385a8161358b565b91506020830135801515811461375d575f80fd5b5f805f8060808587031215613881575f80fd5b843561388c8161358b565b9350602085013561389c8161358b565b92506040850135915060608501356001600160401b038111156138bd575f80fd5b8501601f810187136138cd575f80fd5b6138dc878235602084016135dd565b91505092959194509250565b5f805f80604085870312156138fb575f80fd5b84356001600160401b0380821115613911575f80fd5b818701915087601f830112613924575f80fd5b813581811115613932575f80fd5b8860208260051b8501011115613946575f80fd5b602092830196509450908601359080821115613960575f80fd5b5061396d878288016134a9565b95989497509550505050565b5f805f805f6060868803121561398d575f80fd5b85356001600160401b03808211156139a3575f80fd5b6139af89838a016134a9565b909750955060208801359150808211156139c7575f80fd5b506139d4888289016134a9565b909450925050604086013560ff811681146139ed575f80fd5b809150509295509295909350565b61ffff81168114612bce575f80fd5b5f805f8060608587031215613a1d575f80fd5b8435613a288161358b565b935060208501356001600160401b03811115613a42575f80fd5b613a4e878288016134a9565b9094509250506040850135613a62816139fb565b939692955090935050565b5f8060408385031215613a7e575f80fd5b8235613a898161358b565b9150602083013561375d8161358b565b634e487b7160e01b5f52602160045260245ffd5b60048110612bce57612bce613a99565b613ac681613aad565b9052565b60058110613ac657613ac6613a99565b602081525f8251610200806020850152613af8610220850183613534565b91506020850151601f1980868503016040870152613b168483613534565b93506040870151915080868503016060870152613b338483613534565b93506060870151915080868503016080870152613b508483613534565b935060808701519150808685030160a0870152613b6d8483613534565b935060a087015160c087015260c08701519150613b8d60e0870183613abd565b60e08701519150610100613ba381880184613aca565b8701519150610120613bb787820184613abd565b8701519150610140613bce8782018461ffff169052565b8701519150610160613be58782018461ffff169052565b80880151925050610180818786030181880152613c028584613534565b908801516101a0888101919091528801516101c08089019190915288015190945091506101e0613c358188018415159052565b870151868503909101838701529050613c4e8382613534565b9695505050505050565b600181811c90821680613c6c57607f821691505b60208210810361122157634e487b7160e01b5f52602260045260245ffd5b601f82111561138c57805f5260205f20601f840160051c81016020851015613caf5750805b601f840160051c820191505b81811015612fdc575f8155600101613cbb565b6001600160401b03831115613ce557613ce56135c9565b613cf983613cf38354613c58565b83613c8a565b5f601f841160018114613d2a575f8515613d135750838201355b5f19600387901b1c1916600186901b178355612fdc565b5f83815260208120601f198716915b82811015613d595786850135825560209485019460019092019101613d39565b5086821015613d75575f1960f88860031b161c19848701351681555b505060018560011b0183555050505050565b81835281816020850137505f828201602090810191909152601f909101601f19169091010190565b602081525f6133d8602083018486613d87565b60068110613ac657613ac6613a99565b83815260608101613de66020830185613dc2565b6133d86040830184613dc2565b634e487b7160e01b5f52603260045260245ffd5b5f8154613e1381613c58565b60018281168015613e2b5760018114613e4057613e6c565b60ff1984168752821515830287019450613e6c565b855f526020805f205f5b85811015613e635781548a820152908401908201613e4a565b50505082870194505b5050505092915050565b5f6134a28284613e07565b5f60208083525f8454613e9381613c58565b806020870152604060018084165f8114613eb45760018114613ed057613efd565b60ff19851660408a0152604084151560051b8a01019550613efd565b895f5260205f205f5b85811015613ef45781548b8201860152908301908801613ed9565b8a016040019650505b509398975050505050505050565b634e487b7160e01b5f52601160045260245ffd5b5f60018201613f3057613f30613f0b565b5060010190565b81516001600160401b03811115613f5057613f506135c9565b613f6481613f5e8454613c58565b84613c8a565b602080601f831160018114613f97575f8415613f805750858301515b5f19600386901b1c1916600185901b178555612fda565b5f85815260208120601f198616915b82811015613fc557888601518255948401946001909101908401613fa6565b5085821015613fe257878501515f19600388901b60f8161c191681555b5050505050600190811b01905550565b818382375f9101908152919050565b5f82518060208501845e5f920191825250919050565b80820281158282048414176107e8576107e8613f0b565b808201808211156107e8576107e8613f0b565b5f8261405b57634e487b7160e01b5f52601260045260245ffd5b500490565b5f823561017e19833603018112614075575f80fd5b9190910192915050565b5f808335601e19843603018112614094575f80fd5b8301803591506001600160401b038211156140ad575f80fd5b6020019150368190038213156134e6575f80fd5b5f602082840312156140d1575f80fd5b81356134a2816139fb565b5f81356107e88161358b565b5f8135600481106107e8575f80fd5b61410082613aad565b60ff1981541660ff831681178255505050565b5f8135600581106107e8575f80fd5b6005821061413257614132613a99565b805461ff008360081b1661ff00198216178255505050565b5f81356107e8816139fb565b61417f614162836140dc565b82546001600160a01b0319166001600160a01b0391909116178255565b61418c602083018361407f565b61419a818360018601613cce565b50506141a9604083018361407f565b6141b7818360028601613cce565b50506141c6606083018361407f565b6141d4818360038601613cce565b50506141e3608083018361407f565b6141f1818360048601613cce565b505061420060a083018361407f565b61420e818360058601613cce565b505060c082013560068201556007810161423361422d60e085016140e8565b826140f7565b6142496142436101008501614113565b82614122565b614273614259610120850161414a565b825463ffff0000191660109190911b63ffff000016178255565b6142a1614283610140850161414a565b825465ffff00000000191660209190911b65ffff0000000016178255565b506142b061016083018361407f565b6112aa818360088601613cce565b848152606060208201525f6142d7606083018587613d87565b905082604083015295945050505050565b66697066733a2f2f60c81b81525f6134a26007830184613e07565b606081525f614316606083018789613d87565b8281036020840152614329818688613d87565b91505060ff831660408301529695505050505050565b838152604060208201525f6118c6604083018486613d87565b604081525f61436b604083018587613d87565b9050826020830152949350505050565b606081525f61438e606083018688613d87565b61ffff949094166020830152506001600160a01b039190911660409091015292915050565b6001600160a01b03858116825284166020820152604081018390526080606082018190525f90613c4e90830184613534565b5f602082840312156143f5575f80fd5b81516134a28161347256fea49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775a26469706673582212200c8b5dfd48290749537a38e10f7ec3698ba56439c3f51af8018c030cb0c3716864736f6c63430008190033",
    linkReferences: {},
    deployedLinkReferences: {},
    immutableReferences: {},
    inputSourceName: "project/contracts/univ.sol",
    buildInfoId: "solc-0_8_25-26cdf826337f2423085734a19c6c547eda8e7050",
  },
] as const;
