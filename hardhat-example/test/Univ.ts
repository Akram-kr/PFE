// import { expect } from "chai";
// import { viem } from "hardhat";
// import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
// import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
// import { UniversityDiploma } from "../typechain-types";

// // ─── Enum mirrors ─────────────────────────────────────────────────────────────

// const Specialty = { SIQ: 0, ISIL: 1, AI: 2, Reseau: 3 };
// const Cycle = { L3: 0, M2: 1 };
// const Mention = { Passable: 0, AssezBien: 1, Bien: 2, TresBien: 3 };

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// function fakeCID(index: number): string {
//   return `QmFakeCIDForStudent${index.toString().padStart(4, "0")}`;
// }

// function fakeSHA256(index: number): string {
//   return ethers.keccak256(ethers.toUtf8Bytes(`pdf-content-student-${index}`));
// }

// function buildStudentEntry(
//   wallet: string,
//   index: number,
//   overrides: Partial<{
//     specialty: number;
//     cycle: number;
//     mention: number;
//     graduationYear: number;
//     department: string;
//     studentName: string;
//     matricule: string;
//     dateOfBirth: string;
//     placeOfBirth: string;
//   }> = {},
// ) {
//   return {
//     wallet,
//     studentName: overrides.studentName ?? `Étudiant ${index}`,
//     matricule: overrides.matricule ?? `MAT${String(index).padStart(5, "0")}`,
//     dateOfBirth: overrides.dateOfBirth ?? "",
//     placeOfBirth: overrides.placeOfBirth ?? "",
//     metadataCID: fakeCID(index),
//     sha256Hash: fakeSHA256(index),
//     specialty: overrides.specialty ?? Specialty.AI,
//     cycle: overrides.cycle ?? Cycle.M2,
//     mention: overrides.mention ?? Mention.Bien,
//     graduationYear: overrides.graduationYear ?? 2024,
//     department: overrides.department ?? "Informatique",
//   };
// }

// async function fullBatch(
//   contract: UniversityDiploma,
//   admin: SignerWithAddress,
//   dean: SignerWithAddress,
//   rector: SignerWithAddress,
//   entries: ReturnType<typeof buildStudentEntry>[],
//   desc = "Batch",
// ) {
//   await contract.connect(admin).proposeBatch(entries, desc);
//   const batchId = (await contract.nextBatchId()) - 1n;
//   await contract.connect(dean).signByDean(batchId);
//   await contract.connect(rector).signByRector(batchId);
//   await contract.connect(admin).mintBatch(batchId);
//   return batchId;
// }

// async function advancePastExpiry() {
//   await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
//   await ethers.provider.send("evm_mine", []);
// }

// // ─── Test Suite ───────────────────────────────────────────────────────────────

// describe("UniversityDiploma", function () {
//   let contract: UniversityDiploma;
//   let admin: SignerWithAddress;
//   let dean: SignerWithAddress;
//   let rector: SignerWithAddress;
//   let student1: SignerWithAddress;
//   let student2: SignerWithAddress;
//   let stranger: SignerWithAddress;

//   beforeEach(async function () {
//     [admin, dean, rector, student1, student2, stranger] =
//       await ethers.getSigners();

//     const Factory = await ethers.getContractFactory("UniversityDiploma");
//     contract = await Factory.deploy(admin.address);
//     await contract.waitForDeployment();

//     await contract.connect(admin).assignDean(dean.address);
//     await contract.connect(admin).assignRector(rector.address);
//   });

//   // ── Deployment ──────────────────────────────────────────────────────────────

//   describe("Deployment", function () {
//     it("assigns the correct roles", async function () {
//       const ADMIN_ROLE = await contract.ADMIN_ROLE();
//       const DEAN_ROLE = await contract.DEAN_ROLE();
//       const RECTOR_ROLE = await contract.RECTOR_ROLE();

//       expect(await contract.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
//       expect(await contract.hasRole(DEAN_ROLE, dean.address)).to.be.true;
//       expect(await contract.hasRole(RECTOR_ROLE, rector.address)).to.be.true;
//     });

//     it("has correct name and symbol", async function () {
//       expect(await contract.name()).to.equal("UniversityDiploma");
//       expect(await contract.symbol()).to.equal("UDIP");
//     });

//     it("starts with zero tokens and zero batches", async function () {
//       expect(await contract.nextTokenId()).to.equal(0n);
//       expect(await contract.nextBatchId()).to.equal(0n);
//     });

//     it("has the correct constants", async function () {
//       expect(await contract.MAX_BATCH_SIZE()).to.equal(300n);
//       expect(await contract.PROPOSAL_EXPIRY()).to.equal(
//         BigInt(7 * 24 * 60 * 60),
//       );
//     });

//     it("reverts if admin address is zero", async function () {
//       const Factory = await ethers.getContractFactory("UniversityDiploma");
//       await expect(
//         Factory.deploy(ethers.ZeroAddress),
//       ).to.be.revertedWithCustomError(contract, "Role_ZeroAddress");
//     });
//   });

//   // ── Role Management ──────────────────────────────────────────────────────────

//   describe("Role management", function () {
//     it("admin can assign and remove dean", async function () {
//       const DEAN_ROLE = await contract.DEAN_ROLE();
//       await expect(contract.connect(admin).assignDean(stranger.address))
//         .to.emit(contract, "DeanAssigned")
//         .withArgs(stranger.address, admin.address);
//       expect(await contract.hasRole(DEAN_ROLE, stranger.address)).to.be.true;

//       await expect(contract.connect(admin).removeDean(stranger.address))
//         .to.emit(contract, "DeanRemoved")
//         .withArgs(stranger.address, admin.address);
//       expect(await contract.hasRole(DEAN_ROLE, stranger.address)).to.be.false;
//     });

//     it("admin can assign and remove rector", async function () {
//       const RECTOR_ROLE = await contract.RECTOR_ROLE();
//       await expect(contract.connect(admin).assignRector(stranger.address))
//         .to.emit(contract, "RectorAssigned")
//         .withArgs(stranger.address, admin.address);
//       expect(await contract.hasRole(RECTOR_ROLE, stranger.address)).to.be.true;

//       await expect(contract.connect(admin).removeRector(stranger.address))
//         .to.emit(contract, "RectorRemoved")
//         .withArgs(stranger.address, admin.address);
//       expect(await contract.hasRole(RECTOR_ROLE, stranger.address)).to.be.false;
//     });

//     it("reverts assignDean with zero address", async function () {
//       await expect(
//         contract.connect(admin).assignDean(ethers.ZeroAddress),
//       ).to.be.revertedWithCustomError(contract, "Role_ZeroAddress");
//     });

//     it("reverts assignRector with zero address", async function () {
//       await expect(
//         contract.connect(admin).assignRector(ethers.ZeroAddress),
//       ).to.be.revertedWithCustomError(contract, "Role_ZeroAddress");
//     });

//     it("reverts assignDean when called by non-admin", async function () {
//       await expect(
//         contract.connect(stranger).assignDean(student1.address),
//       ).to.be.revertedWithCustomError(
//         contract,
//         "AccessControlUnauthorizedAccount",
//       );
//     });

//     it("reverts assignRector when called by non-admin", async function () {
//       await expect(
//         contract.connect(stranger).assignRector(student1.address),
//       ).to.be.revertedWithCustomError(
//         contract,
//         "AccessControlUnauthorizedAccount",
//       );
//     });
//   });

//   // ── Soulbound ───────────────────────────────────────────────────────────────

//   describe("Soulbound (non-transferable)", function () {
//     beforeEach(async function () {
//       await fullBatch(contract, admin, dean, rector, [
//         buildStudentEntry(student1.address, 0),
//       ]);
//     });

//     it("blocks safeTransferFrom", async function () {
//       await expect(
//         contract
//           .connect(student1)
//           [
//             "safeTransferFrom(address,address,uint256)"
//           ](student1.address, stranger.address, 0n),
//       ).to.be.revertedWithCustomError(contract, "SBT_TransferNotAllowed");
//     });

//     it("blocks transferFrom", async function () {
//       await expect(
//         contract
//           .connect(student1)
//           .transferFrom(student1.address, stranger.address, 0n),
//       ).to.be.revertedWithCustomError(contract, "SBT_TransferNotAllowed");
//     });

//     it("allows the owner to hold the token", async function () {
//       expect(await contract.ownerOf(0n)).to.equal(student1.address);
//     });
//   });

//   // ── Batch Governance ────────────────────────────────────────────────────────

//   describe("Batch Governance — full flow", function () {
//     it("goes through PROPOSED → SIGNED_BY_DEAN → SIGNED_BY_RECTOR → MINTED", async function () {
//       const entries = [
//         buildStudentEntry(student1.address, 0, {
//           specialty: Specialty.AI,
//           cycle: Cycle.M2,
//           mention: Mention.TresBien,
//         }),
//         buildStudentEntry(student2.address, 1, {
//           specialty: Specialty.ISIL,
//           cycle: Cycle.L3,
//           mention: Mention.Bien,
//         }),
//       ];

//       await expect(
//         contract.connect(admin).proposeBatch(entries, "Promotion 2024"),
//       )
//         .to.emit(contract, "BatchProposed")
//         .withArgs(0n, admin.address, 2n, "Promotion 2024", anyValue);

//       expect(await contract.getBatchStatus(0n)).to.equal(0);
//       expect(await contract.getBatchStudentCount(0n)).to.equal(2n);
//       expect(await contract.getBatchDescription(0n)).to.equal("Promotion 2024");

//       await expect(contract.connect(dean).signByDean(0n)).to.emit(
//         contract,
//         "BatchSignedByDean",
//       );
//       expect(await contract.getBatchStatus(0n)).to.equal(1);

//       await expect(contract.connect(rector).signByRector(0n)).to.emit(
//         contract,
//         "BatchSignedByRector",
//       );
//       expect(await contract.getBatchStatus(0n)).to.equal(2);

//       const tx = await contract.connect(admin).mintBatch(0n);
//       await expect(tx).to.emit(contract, "DiplomasMinted");

//       expect(await contract.getBatchStatus(0n)).to.equal(3);
//       expect(await contract.nextTokenId()).to.equal(2n);
//       expect(await contract.ownerOf(0n)).to.equal(student1.address);
//       expect(await contract.ownerOf(1n)).to.equal(student2.address);
//     });

//     it("stores the correct full on-chain record per token", async function () {
//       const entry = [
//         buildStudentEntry(student1.address, 0, {
//           studentName: "Amine BENSALEM",
//           matricule: "MAT12345",
//           dateOfBirth: "15/06/2001",
//           placeOfBirth: "Blida",
//           specialty: Specialty.SIQ,
//           cycle: Cycle.M2,
//           mention: Mention.TresBien,
//           graduationYear: 2024,
//           department: "Informatique",
//         }),
//       ];

//       await fullBatch(contract, admin, dean, rector, entry, "Batch A");

//       const rec = await contract.getDiplomaRecord(0n);
//       expect(rec.studentName).to.equal("Amine BENSALEM");
//       expect(rec.matricule).to.equal("MAT12345");
//       expect(rec.dateOfBirth).to.equal("15/06/2001");
//       expect(rec.placeOfBirth).to.equal("Blida");
//       expect(rec.metadataCID).to.equal(fakeCID(0));
//       expect(rec.sha256Hash).to.equal(fakeSHA256(0));
//       expect(rec.specialty).to.equal(Specialty.SIQ);
//       expect(rec.cycle).to.equal(Cycle.M2);
//       expect(rec.mention).to.equal(Mention.TresBien);
//       expect(rec.graduationYear).to.equal(2024n);
//       expect(rec.department).to.equal("Informatique");
//       expect(rec.batchId).to.equal(0n);
//       expect(rec.valid).to.be.true;
//       expect(rec.revocationReason).to.equal("");
//     });

//     it("generates a correct ipfs:// tokenURI", async function () {
//       await fullBatch(
//         contract,
//         admin,
//         dean,
//         rector,
//         [buildStudentEntry(student1.address, 0)],
//         "URI test",
//       );
//       expect(await contract.tokenURI(0n)).to.equal(`ipfs://${fakeCID(0)}`);
//     });

//     it("sets expiresAt to proposedAt + 7 days", async function () {
//       await contract
//         .connect(admin)
//         .proposeBatch([buildStudentEntry(student1.address, 0)], "Expiry test");
//       const expiry = await contract.getBatchExpiry(0n);
//       const block = await ethers.provider.getBlock("latest");
//       const proposedAt = BigInt(block!.timestamp);
//       expect(expiry).to.be.gte(proposedAt + BigInt(7 * 24 * 60 * 60) - 5n);
//       expect(expiry).to.be.lte(proposedAt + BigInt(7 * 24 * 60 * 60) + 5n);
//     });
//   });

//   // ── Batch Cancellation ───────────────────────────────────────────────────────

//   describe("Batch cancellation", function () {
//     it("admin can cancel a Proposed batch", async function () {
//       await contract
//         .connect(admin)
//         .proposeBatch([buildStudentEntry(student1.address, 0)], "To cancel");
//       await expect(
//         contract.connect(admin).cancelBatch(0n, "Données incorrectes"),
//       )
//         .to.emit(contract, "BatchCancelled")
//         .withArgs(0n, admin.address, "Données incorrectes");
//       expect(await contract.getBatchStatus(0n)).to.equal(4);
//       expect(await contract.getBatchCancelReason(0n)).to.equal(
//         "Données incorrectes",
//       );
//     });

//     it("admin can cancel a SignedByDean batch", async function () {
//       await contract
//         .connect(admin)
//         .proposeBatch([buildStudentEntry(student1.address, 0)], "Batch");
//       await contract.connect(dean).signByDean(0n);
//       await expect(
//         contract.connect(admin).cancelBatch(0n, "Erreur détectée"),
//       ).to.emit(contract, "BatchCancelled");
//       expect(await contract.getBatchStatus(0n)).to.equal(4);
//     });

//     it("admin can cancel a SignedByRector batch", async function () {
//       await contract
//         .connect(admin)
//         .proposeBatch([buildStudentEntry(student1.address, 0)], "Batch");
//       await contract.connect(dean).signByDean(0n);
//       await contract.connect(rector).signByRector(0n);
//       await expect(
//         contract.connect(admin).cancelBatch(0n, "Annulation recteur"),
//       ).to.emit(contract, "BatchCancelled");
//       expect(await contract.getBatchStatus(0n)).to.equal(4);
//     });

//     it("reverts cancelling an already-minted batch", async function () {
//       await fullBatch(contract, admin, dean, rector, [
//         buildStudentEntry(student1.address, 0),
//       ]);
//       await expect(
//         contract.connect(admin).cancelBatch(0n, "Too late"),
//       ).to.be.revertedWithCustomError(contract, "Batch_CannotCancel");
//     });

//     it("reverts cancelling an already-cancelled batch", async function () {
//       await contract
//         .connect(admin)
//         .proposeBatch([buildStudentEntry(student1.address, 0)], "Batch");
//       await contract.connect(admin).cancelBatch(0n, "First cancel");
//       await expect(
//         contract.connect(admin).cancelBatch(0n, "Second cancel"),
//       ).to.be.revertedWithCustomError(contract, "Batch_CannotCancel");
//     });

//     it("reverts cancellation with empty reason", async function () {
//       await contract
//         .connect(admin)
//         .proposeBatch([buildStudentEntry(student1.address, 0)], "Batch");
//       await expect(
//         contract.connect(admin).cancelBatch(0n, ""),
//       ).to.be.revertedWithCustomError(contract, "Batch_MissingCancelReason");
//     });

//     it("reverts cancellation by non-admin", async function () {
//       await contract
//         .connect(admin)
//         .proposeBatch([buildStudentEntry(student1.address, 0)], "Batch");
//       await expect(
//         contract.connect(stranger).cancelBatch(0n, "Reason"),
//       ).to.be.revertedWithCustomError(
//         contract,
//         "AccessControlUnauthorizedAccount",
//       );
//     });

//     it("signing an expired batch reverts with Batch_Expired", async function () {
//       await contract
//         .connect(admin)
//         .proposeBatch([buildStudentEntry(student1.address, 0)], "Expired");
//       await advancePastExpiry();
//       await expect(
//         contract.connect(dean).signByDean(0n),
//       ).to.be.revertedWithCustomError(contract, "Batch_Expired");
//     });

//     it("minting an expired batch reverts with Batch_Expired", async function () {
//       await contract
//         .connect(admin)
//         .proposeBatch([buildStudentEntry(student1.address, 0)], "Expired");
//       await contract.connect(dean).signByDean(0n);
//       await contract.connect(rector).signByRector(0n);
//       await advancePastExpiry();
//       await expect(
//         contract.connect(admin).mintBatch(0n),
//       ).to.be.revertedWithCustomError(contract, "Batch_Expired");
//     });

//     it("admin can cancel an expired batch", async function () {
//       await contract
//         .connect(admin)
//         .proposeBatch([buildStudentEntry(student1.address, 0)], "Expired");
//       await advancePastExpiry();
//       await expect(
//         contract.connect(admin).cancelBatch(0n, "Lot expiré"),
//       ).to.emit(contract, "BatchCancelled");
//       expect(await contract.getBatchStatus(0n)).to.equal(4);
//     });
//   });

//   // ── Matricule Deduplication ──────────────────────────────────────────────────

//   describe("Matricule deduplication", function () {
//     it("prevents minting the same matricule twice across batches", async function () {
//       const entry = [
//         buildStudentEntry(student1.address, 0, { matricule: "MAT99999" }),
//       ];

//       await fullBatch(contract, admin, dean, rector, entry, "First batch");
//       expect(await contract.isMatriculeUsed("MAT99999")).to.be.true;

//       const dup = [
//         buildStudentEntry(student2.address, 1, { matricule: "MAT99999" }),
//       ];
//       await contract.connect(admin).proposeBatch(dup, "Second batch");
//       await contract.connect(dean).signByDean(1n);
//       await contract.connect(rector).signByRector(1n);
//       await expect(
//         contract.connect(admin).mintBatch(1n),
//       ).to.be.revertedWithCustomError(contract, "Batch_MatriculeAlreadyMinted");
//     });

//     it("isMatriculeUsed returns false before minting", async function () {
//       expect(await contract.isMatriculeUsed("MAT00000")).to.be.false;
//     });

//     it("isMatriculeUsed returns true after minting", async function () {
//       await fullBatch(contract, admin, dean, rector, [
//         buildStudentEntry(student1.address, 0, { matricule: "MAT00001" }),
//       ]);
//       expect(await contract.isMatriculeUsed("MAT00001")).to.be.true;
//     });

//     it("minting a revoked diploma's matricule is still blocked", async function () {
//       const entry = [
//         buildStudentEntry(student1.address, 0, { matricule: "MATREV" }),
//       ];
//       await fullBatch(contract, admin, dean, rector, entry, "Original");
//       await contract.connect(admin).revokeDiploma(0n, "Fraude");

//       const dup = [
//         buildStudentEntry(student2.address, 1, { matricule: "MATREV" }),
//       ];
//       await contract.connect(admin).proposeBatch(dup, "Redeploy");
//       await contract.connect(dean).signByDean(1n);
//       await contract.connect(rector).signByRector(1n);
//       await expect(
//         contract.connect(admin).mintBatch(1n),
//       ).to.be.revertedWithCustomError(contract, "Batch_MatriculeAlreadyMinted");
//     });
//   });

//   // ── Student Diploma Lookup ───────────────────────────────────────────────────

//   describe("Student diploma lookup (getStudentDiplomas)", function () {
//     it("returns empty array for address with no diplomas", async function () {
//       const tokens = await contract.getStudentDiplomas(stranger.address);
//       expect(tokens).to.deep.equal([]);
//     });

//     it("returns the correct token for a student with one diploma", async function () {
//       await fullBatch(contract, admin, dean, rector, [
//         buildStudentEntry(student1.address, 0),
//       ]);
//       const tokens = await contract.getStudentDiplomas(student1.address);
//       expect(tokens.length).to.equal(1);
//       expect(tokens[0]).to.equal(0n);
//     });

//     it("returns multiple tokens if a wallet received diplomas in separate batches", async function () {
//       await fullBatch(
//         contract,
//         admin,
//         dean,
//         rector,
//         [buildStudentEntry(student1.address, 0, { matricule: "MAT-A" })],
//         "B1",
//       );
//       await fullBatch(
//         contract,
//         admin,
//         dean,
//         rector,
//         [buildStudentEntry(student1.address, 1, { matricule: "MAT-B" })],
//         "B2",
//       );

//       const tokens = await contract.getStudentDiplomas(student1.address);
//       expect(tokens.length).to.equal(2);
//       expect(tokens[0]).to.equal(0n);
//       expect(tokens[1]).to.equal(1n);
//     });
//   });

//   // ── Access Control ──────────────────────────────────────────────────────────

//   describe("Access control", function () {
//     it("reverts proposeBatch when called by non-admin", async function () {
//       const entry = [buildStudentEntry(student1.address, 0)];
//       await expect(
//         contract.connect(stranger).proposeBatch(entry, "Rogue batch"),
//       ).to.be.revertedWithCustomError(
//         contract,
//         "AccessControlUnauthorizedAccount",
//       );
//     });

//     it("reverts signByDean when called by non-dean", async function () {
//       const entry = [buildStudentEntry(student1.address, 0)];
//       await contract.connect(admin).proposeBatch(entry, "Batch");
//       await expect(
//         contract.connect(stranger).signByDean(0n),
//       ).to.be.revertedWithCustomError(
//         contract,
//         "AccessControlUnauthorizedAccount",
//       );
//     });

//     it("reverts signByRector when called by non-rector", async function () {
//       const entry = [buildStudentEntry(student1.address, 0)];
//       await contract.connect(admin).proposeBatch(entry, "Batch");
//       await contract.connect(dean).signByDean(0n);
//       await expect(
//         contract.connect(stranger).signByRector(0n),
//       ).to.be.revertedWithCustomError(
//         contract,
//         "AccessControlUnauthorizedAccount",
//       );
//     });

//     it("reverts mintBatch when called by non-admin", async function () {
//       const entry = [buildStudentEntry(student1.address, 0)];
//       await contract.connect(admin).proposeBatch(entry, "Batch");
//       await contract.connect(dean).signByDean(0n);
//       await contract.connect(rector).signByRector(0n);
//       await expect(
//         contract.connect(stranger).mintBatch(0n),
//       ).to.be.revertedWithCustomError(
//         contract,
//         "AccessControlUnauthorizedAccount",
//       );
//     });

//     it("reverts revokeDiploma when called by non-admin", async function () {
//       await fullBatch(contract, admin, dean, rector, [
//         buildStudentEntry(student1.address, 0),
//       ]);
//       await expect(
//         contract.connect(stranger).revokeDiploma(0n, "Fraude"),
//       ).to.be.revertedWithCustomError(
//         contract,
//         "AccessControlUnauthorizedAccount",
//       );
//     });
//   });

//   // ── State Machine Guards ────────────────────────────────────────────────────

//   describe("State machine guards", function () {
//     beforeEach(async function () {
//       const entry = [buildStudentEntry(student1.address, 0)];
//       await contract.connect(admin).proposeBatch(entry, "Batch");
//     });

//     it("reverts rector signing before dean", async function () {
//       await expect(
//         contract.connect(rector).signByRector(0n),
//       ).to.be.revertedWithCustomError(contract, "Batch_InvalidStatus");
//     });

//     it("reverts minting before rector signs", async function () {
//       await contract.connect(dean).signByDean(0n);
//       await expect(
//         contract.connect(admin).mintBatch(0n),
//       ).to.be.revertedWithCustomError(contract, "Batch_InvalidStatus");
//     });

//     it("reverts double signing by dean", async function () {
//       await contract.connect(dean).signByDean(0n);
//       await expect(
//         contract.connect(dean).signByDean(0n),
//       ).to.be.revertedWithCustomError(contract, "Batch_InvalidStatus");
//     });

//     it("reverts double minting of the same batch", async function () {
//       await contract.connect(dean).signByDean(0n);
//       await contract.connect(rector).signByRector(0n);
//       await contract.connect(admin).mintBatch(0n);
//       await expect(
//         contract.connect(admin).mintBatch(0n),
//       ).to.be.revertedWithCustomError(contract, "Batch_InvalidStatus");
//     });
//   });

//   // ── Input Validation ────────────────────────────────────────────────────────

//   describe("Input validation", function () {
//     it("reverts on empty batch", async function () {
//       await expect(
//         contract.connect(admin).proposeBatch([], "Empty"),
//       ).to.be.revertedWithCustomError(contract, "Batch_EmptyStudentList");
//     });

//     it("reverts on zero wallet address", async function () {
//       const bad = [buildStudentEntry(ethers.ZeroAddress, 0)];
//       await expect(
//         contract.connect(admin).proposeBatch(bad, "Bad wallet"),
//       ).to.be.revertedWithCustomError(contract, "Batch_InvalidStudentWallet");
//     });

//     it("reverts on empty studentName", async function () {
//       const bad = [buildStudentEntry(student1.address, 0, { studentName: "" })];
//       await expect(
//         contract.connect(admin).proposeBatch(bad, "No name"),
//       ).to.be.revertedWithCustomError(contract, "Batch_MissingName");
//     });

//     it("reverts on empty matricule", async function () {
//       const bad = [buildStudentEntry(student1.address, 0, { matricule: "" })];
//       await expect(
//         contract.connect(admin).proposeBatch(bad, "No matricule"),
//       ).to.be.revertedWithCustomError(contract, "Batch_MissingMatricule");
//     });

//     it("reverts on empty CID", async function () {
//       const bad = [
//         {
//           wallet: student1.address,
//           studentName: "Test",
//           matricule: "MAT001",
//           dateOfBirth: "",
//           placeOfBirth: "",
//           metadataCID: "",
//           sha256Hash: fakeSHA256(0),
//           specialty: Specialty.AI,
//           cycle: Cycle.M2,
//           mention: Mention.Bien,
//           graduationYear: 2024,
//           department: "Informatique",
//         },
//       ];
//       await expect(
//         contract.connect(admin).proposeBatch(bad, "No CID"),
//       ).to.be.revertedWithCustomError(contract, "Batch_MissingCID");
//     });

//     it("reverts on zero hash", async function () {
//       const bad = [
//         {
//           wallet: student1.address,
//           studentName: "Test",
//           matricule: "MAT001",
//           dateOfBirth: "",
//           placeOfBirth: "",
//           metadataCID: fakeCID(0),
//           sha256Hash: ethers.ZeroHash,
//           specialty: Specialty.AI,
//           cycle: Cycle.M2,
//           mention: Mention.Bien,
//           graduationYear: 2024,
//           department: "Informatique",
//         },
//       ];
//       await expect(
//         contract.connect(admin).proposeBatch(bad, "No hash"),
//       ).to.be.revertedWithCustomError(contract, "Batch_MissingHash");
//     });

//     it("reverts on empty department", async function () {
//       const bad = [buildStudentEntry(student1.address, 0, { department: "" })];
//       await expect(
//         contract.connect(admin).proposeBatch(bad, "No dept"),
//       ).to.be.revertedWithCustomError(contract, "Batch_MissingDepartment");
//     });

//     it("reverts on invalid graduation year (< 2000)", async function () {
//       const bad = [
//         buildStudentEntry(student1.address, 0, { graduationYear: 1999 }),
//       ];
//       await expect(
//         contract.connect(admin).proposeBatch(bad, "Bad year"),
//       ).to.be.revertedWithCustomError(contract, "Batch_InvalidGraduationYear");
//     });

//     it("reverts on invalid graduation year (> 2100)", async function () {
//       const bad = [
//         buildStudentEntry(student1.address, 0, { graduationYear: 2101 }),
//       ];
//       await expect(
//         contract.connect(admin).proposeBatch(bad, "Bad year 2101"),
//       ).to.be.revertedWithCustomError(contract, "Batch_InvalidGraduationYear");
//     });

//     it("reverts on batch too large", async function () {
//       const students = Array.from({ length: 301 }, (_, i) =>
//         buildStudentEntry(student1.address, i),
//       );
//       await expect(
//         contract.connect(admin).proposeBatch(students, "Too big"),
//       ).to.be.revertedWithCustomError(contract, "Batch_TooLarge");
//     });
//   });

//   // ── Revocation ──────────────────────────────────────────────────────────────

//   describe("Diploma revocation", function () {
//     beforeEach(async function () {
//       await fullBatch(
//         contract,
//         admin,
//         dean,
//         rector,
//         [buildStudentEntry(student1.address, 0)],
//         "Revoke batch",
//       );
//     });

//     it("admin can revoke a valid diploma with a reason", async function () {
//       await expect(
//         contract.connect(admin).revokeDiploma(0n, "Fraude académique"),
//       )
//         .to.emit(contract, "DiplomaRevoked")
//         .withArgs(0n, admin.address, "Fraude académique", anyValue);

//       expect(await contract.isDiplomaValid(0n)).to.be.false;
//       const rec = await contract.getDiplomaRecord(0n);
//       expect(rec.valid).to.be.false;
//       expect(rec.revocationReason).to.equal("Fraude académique");
//     });

//     it("reverts revoking without a reason", async function () {
//       await expect(
//         contract.connect(admin).revokeDiploma(0n, ""),
//       ).to.be.revertedWithCustomError(
//         contract,
//         "Token_MissingRevocationReason",
//       );
//     });

//     it("reverts revoking an already-revoked diploma", async function () {
//       await contract.connect(admin).revokeDiploma(0n, "Fraude");
//       await expect(
//         contract.connect(admin).revokeDiploma(0n, "Again"),
//       ).to.be.revertedWithCustomError(contract, "Token_AlreadyRevoked");
//     });

//     it("reverts revoking a non-existent token", async function () {
//       await expect(
//         contract.connect(admin).revokeDiploma(999n, "Reason"),
//       ).to.be.revertedWithCustomError(contract, "Token_DoesNotExist");
//     });
//   });

//   // ── Verification Portal ─────────────────────────────────────────────────────

//   describe("Diploma verification", function () {
//     beforeEach(async function () {
//       await fullBatch(
//         contract,
//         admin,
//         dean,
//         rector,
//         [buildStudentEntry(student1.address, 0)],
//         "Verify batch",
//       );
//     });

//     it("returns true and increments verificationCount when hash matches", async function () {
//       await expect(contract.connect(stranger).verifyDiploma(0n, fakeSHA256(0)))
//         .to.emit(contract, "DiplomaVerified")
//         .withArgs(0n, stranger.address, true, 1n);
//       expect(await contract.verificationCount(0n)).to.equal(1n);
//     });

//     it("increments verificationCount on every call", async function () {
//       await contract.connect(stranger).verifyDiploma(0n, fakeSHA256(0));
//       await contract.connect(stranger).verifyDiploma(0n, fakeSHA256(0));
//       await contract.connect(student2).verifyDiploma(0n, fakeSHA256(0));
//       expect(await contract.verificationCount(0n)).to.equal(3n);
//     });

//     it("returns false when PDF hash does not match", async function () {
//       const badHash = ethers.keccak256(ethers.toUtf8Bytes("tampered-pdf"));
//       await expect(contract.connect(stranger).verifyDiploma(0n, badHash))
//         .to.emit(contract, "DiplomaVerified")
//         .withArgs(0n, stranger.address, false, 1n);
//     });

//     it("returns false after revocation even with correct hash", async function () {
//       await contract.connect(admin).revokeDiploma(0n, "Annulation test");
//       await expect(contract.connect(stranger).verifyDiploma(0n, fakeSHA256(0)))
//         .to.emit(contract, "DiplomaVerified")
//         .withArgs(0n, stranger.address, false, 1n);
//     });

//     it("verificationCount starts at zero", async function () {
//       expect(await contract.verificationCount(0n)).to.equal(0n);
//     });

//     it("reverts on a non-existent token", async function () {
//       await expect(
//         contract.verifyDiploma(999n, fakeSHA256(0)),
//       ).to.be.revertedWithCustomError(contract, "Token_DoesNotExist");
//     });
//   });

//   // ── Batch Minting at Scale ───────────────────────────────────────────────────

//   describe("Batch minting at scale", function () {
//     it("mints 50 diplomas in a single transaction", async function () {
//       const signers = await ethers.getSigners();
//       const students = Array.from({ length: 50 }, (_, i) =>
//         buildStudentEntry(signers[i % signers.length].address, i),
//       );

//       await contract.connect(admin).proposeBatch(students, "Large batch");
//       await contract.connect(dean).signByDean(0n);
//       await contract.connect(rector).signByRector(0n);
//       await contract.connect(admin).mintBatch(0n);

//       expect(await contract.nextTokenId()).to.equal(50n);
//       expect(await contract.getBatchStatus(0n)).to.equal(3);
//     });
//   });
// });
