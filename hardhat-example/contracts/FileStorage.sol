// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract FileStorage {

  // Struct to represent a file
   struct File {
    string [] ipfsHash ;
    string fileName;
    string exts;  // file extension png,pdf,docx,etc
    uint256 fileSize;
    uint256 timestamp;
    string encryptionIv;
   }
 
  //  mapping to store files for each user
   mapping(address => File[] ) private userFiles;

  // mapping to track total storage used by each user
   mapping(address=> uint256) public totalStorageUsed;

  //   event to emit when a file is uploaded
    event FileUploaded(address indexed user, string [] ipfsHash, string fileName, uint256 fileSize, string exts, uint256 timestamp, string encryptionIv);
    
   //  event to emit when a file is deleted
    event FileDeleted(address indexed user, uint256 index, uint256 freedSize);

   // internal function to handle file uploads with validation to minimize gas costs for users
   function _upload(string [] memory _ipfsHash, string memory _fileName,string memory _exts , uint256 _fileSize,string memory _encryptionIv ) internal {
   
      //  ensure that the IPFS hash and file name are not empty and file size is positive
      require(_ipfsHash.length > 0, "IPFS hash cannot be empty");
   
      require(bytes(_fileName).length > 0, "File name cannot be empty");

      require(_fileSize>0, "File size must be positive");
  
      require(bytes(_encryptionIv).length > 0, "Encryption IV required");
    
      File memory  newFile = File({
        ipfsHash: _ipfsHash,
        fileName: _fileName,
        exts: _exts,
        fileSize: _fileSize,
        timestamp: block.timestamp,
        encryptionIv: _encryptionIv
    });


    // store the file metadata in the user's file list
    userFiles[msg.sender].push(newFile);

    //  update the total storage used by the user
    totalStorageUsed[msg.sender] += _fileSize ;
    
    // emit the FileUploaded event
    emit FileUploaded(msg.sender, _ipfsHash, _fileName, _fileSize, _exts, block.timestamp, _encryptionIv);
    }

// Function to upload file metadata to the contract
 function uploadFile( string [] memory _ipfsHash, string memory _fileName, string memory _exts, uint256 _fileSize,string memory _encryptionIv) public {
    _upload(_ipfsHash, _fileName, _exts, _fileSize,_encryptionIv);
 }

//  function to upload multiple files at once
//  function uploadMultipleFiles( string [] memory _ipfsHashes, string [] memory _fileNames, string [] memory _exts , uint256 [] memory _fileSizes,string[] memory _encryptionIvs) public{
    
//     require(_ipfsHashes.length == _fileNames.length && _fileNames.length == _exts.length && _exts.length == _fileSizes.length &&_fileSizes.length == _encryptionIvs.length, "Input arrays must have the same length");
//     require(_ipfsHashes.length > 0, "No files provided");

//     for (uint256 i = 0; i < _ipfsHashes.length; i++) {
//         _upload(_ipfsHashes[i], _fileNames[i], _exts[i], _fileSizes[i], _encryptionIvs[i] );
//     }
//  }
 //  function to retrieve files for a user
 function getUserFiles() public view returns (File[] memory) {
    return userFiles[msg.sender];
 }

// Function to get the number of files a user has without fetching all the data
function getFileCount() public view returns (uint256) {
    return userFiles[msg.sender].length;
}

//  delete a file from the user's file list
 function deleteFile(uint256 index) public {
  require(index < userFiles[msg.sender].length, "Invalid file index");
  File memory deletedFile = userFiles[msg.sender][index];
  // reduce the total storage used by the size of the deleted file
  totalStorageUsed[msg.sender] -= deletedFile.fileSize;
 
  // remove the file from the user's file list by replacing it with the last file and popping the last element
  userFiles[msg.sender][index] = userFiles[msg.sender][userFiles[msg.sender].length - 1];
  userFiles[msg.sender].pop();

  emit FileDeleted(msg.sender, index, deletedFile.fileSize);
 }
}
// Random number to make this contract file unique: 269790866
