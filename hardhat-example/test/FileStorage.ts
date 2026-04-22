// hre is the Hardhat Runtime Environment,which provides access to the configured network, accounts, and other utilities for testing and deployment.
import hre from "hardhat";
// assert is a built-in Node.js module for making assertions in tests.
import assert from "node:assert/strict";
// describe and it are functions from the Node.js testing module, used to define test suites and test cases.
import { before, beforeEach, describe, it } from "node:test";

const { viem } = await hre.network.connect();
// arrays hold test data
const names: string[] = ["file.txt", "univ.txt", "cv.pdf"];
const ipfsHashes: string[] = [
  "QmXoYp1Z5v1s9u8n2a3b4c5d6e7f8g9h0i1j2k3l4m5n6",
  "QmYp1Z5v1s9u8n2a3b4c5d6e7f8g9h0i1j2k3l4m5n6",
  "QmZ1Z5v1s9u8n2a3b4c5d6e7f8g9h0i1j2k3l4m5n6",
];
const extensions: string[] = ["txt", "txt", "pdf"];
const sizes: bigint[] = [1024n, 2048n, 4096n];

// test suite for the file Storage contract
describe("FileStorage", async () => {
  let storageContract: any;

  // This runs before all tests in the suite, and is used to set up any necessary state or configurations.
  beforeEach(async () => {
    // Deploy the FileStorage contract before running the tests, ensuring that we have a fresh instance for each test case.
    storageContract = await viem.deployContract("FileStorage");
  });

  //  test caseto verify file upload and retrieval functionality
  it("should store and retrieve files ", async () => {
    // Upload a file to the contract with the specified IPFS hash, file name, and file size.
    await storageContract.write.uploadFile([
      ipfsHashes[0],
      names[0],
      extensions[0],
      sizes[0],
    ]);

    // Retrieve the files for the current user (the one who deployed the contract).
    const files = await storageContract.read.getUserFiles();

    // Assert that the retrieved files match the expected values.
    assert.strictEqual(files.length, 1);
    assert.strictEqual(files[0].ipfsHash, ipfsHashes[0]);
    assert.strictEqual(files[0].exts, extensions[0]);
    assert.strictEqual(files[0].fileName, names[0]);
    assert.strictEqual(files[0].fileSize, sizes[0]);
  });

  // test case to verify mutiple file uploads and retrieval
  // it("should upload multiple files at once", async () => {
  //   // Upload multiple files to the contract using the uploadMultipleFiles function, providing arrays of IPFS hashes, file names, and file sizes.
  //   await storageContract.write.uploadMultipleFiles([
  //     ipfsHashes,
  //     names,
  //     extensions,
  //     sizes,
  //   ]);
  //   // Retrieve the files for the current user after uploading multiple files.
  //   const files = await storageContract.read.getUserFiles();
  //   // Assert that the retrieved files match the expected values.
  //   assert.strictEqual(files.length, 3);
  //   for (let i = 0; i < files.length; i++) {
  //     assert.strictEqual(files[i].ipfsHash, ipfsHashes[i]);
  //     assert.strictEqual(files[i].exts, extensions[i]);
  //     assert.strictEqual(files[i].fileName, names[i]);
  //     assert.strictEqual(files[i].fileSize, sizes[i]);
  //   }
  // });

  // test case to verify file deletion and storage usage update
  it("should delete index 1 and move the last file to take its place", async () => {
    const [owner] = await viem.getWalletClients();

    await storageContract.write.uploadMultipleFiles([
      ipfsHashes,
      names,
      extensions,
      sizes,
    ]);

    await storageContract.write.deleteFile([1n]);

    const files = await storageContract.read.getUserFiles();
    const totalUsed = await storageContract.read.totalStorageUsed([
      owner.account.address,
    ]);
    // Assert that the retrieved files match the expected values after deletion
    assert.strictEqual(files.length, 2);

    // Assert that the file at index 1 (the one that was deleted) has been replaced by the last file in the list, which should now be at index 1.
    assert.strictEqual(files[1].fileName, "cv.pdf");

    // Assert that the total storage used by the user is updated correctly after deletion
    assert.strictEqual(totalUsed, 5120n);
    const count = await storageContract.read.getFileCount();
    assert.strictEqual(count, 2n);
  });
});
