/**
 * STEP 1: KEY GENERATION
 * We turn the user's MetaMask signature into a 256-bit AES Key.
 * Since the signature is unique to the user, the key is too.
 */
export async function deriveEncryptionKey(
  signature: string,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const data = encoder.encode(signature);

  // Hash the signature using SHA-256 to get a fixed 32-byte (256-bit) buffer
  const hash = await crypto.subtle.digest("SHA-256", data);

  // Import that hash as a usable AES-GCM key
  return await crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false, // The key cannot be exported/stolen by other scripts
    ["encrypt", "decrypt"],
  );
}

/**
 * STEP 2: ENCRYPTION
 * We take the raw file and scramble it using the Key.
 * We also generate an IV (Initialization Vector).
 */
export async function encryptFile(file: File, key: CryptoKey) {
  // Generate a random 12-byte IV for every single upload
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Convert the file into a buffer the crypto API can read
  const fileBuffer = await file.arrayBuffer();

  // Perform the actual encryption
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    fileBuffer,
  );

  return {
    encryptedData: ciphertext, // This is what goes to IPFS
    iv: Buffer.from(iv).toString("hex"), // This is what goes to the Blockchain
  };
}

/**
 * STEP 3: DECRYPTION
 * Used later when the user wants to download their file.
 */
export async function decryptFile(
  encryptedBuffer: ArrayBuffer,
  key: CryptoKey,
  ivHex: string,
) {
  // Convert the hex IV from the blockchain back into a byte array
  const iv = new Uint8Array(Buffer.from(ivHex, "hex"));

  // Decrypt the data
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encryptedBuffer,
  );

  return decryptedBuffer;
}
