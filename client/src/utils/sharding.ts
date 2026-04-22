/**
 * Splits a buffer into a specific number of shards
 */
export function shardBuffer(
  buffer: ArrayBuffer,
  shardCount: number = 3,
): ArrayBuffer[] {
  const shards: ArrayBuffer[] = [];
  const totalSize = buffer.byteLength;
  const shardSize = Math.ceil(totalSize / shardCount);

  for (let i = 0; i < shardCount; i++) {
    const start = i * shardSize;
    const end = Math.min(start + shardSize, totalSize);

    // Slice the encrypted data
    const shard = buffer.slice(start, end);
    shards.push(shard);
  }

  return shards;
}
