module.exports = {
  /**
   * Computes a checksum for the provided data
   * @param {Buffer} buf - The buffer data for which to compute the checksum 
   * @returns {number} The computed checksum value for the data
   */
  createChecksum: function (buf) {
    const twosCompSum = compute16bChunkSum(buf, 0);
    let onesCompSum = twosCompSum;
    while (onesCompSum > 0xFFFF) {
      const high = (onesCompSum >>> 16) >>> 0;
      const low = (onesCompSum << 16 >>> 16) >>> 0;
      onesCompSum = high + low;
    }
    return ~onesCompSum << 16 >>> 16;
  }
};

/**
 * Computes a sum of 16-bit chunks of a buffer recursively
 * @private
 * @param {Buffer} buf - the data for which to compute the sum 
 * @param {number} sum - the current sum (used recursively)
 * @returns {number} - the final sum
 */
function compute16bChunkSum (buf, sum) {
  // Base case: Buffer length 0 => no more data, return the sum
  if (buf.length === 0) { return sum; }
  // Edge case: Zero-pad (on the right) a last 8-bit value to 16-bits for the sum
  if (buf.length === 1) { buf = Buffer.concat([buf, Buffer.from([0])]); }
  // Recursively compute the sum, popping chunks off the buffer from the left
  return compute16bChunkSum(
    buf.subarray(2),
    sum + buf.readUInt16BE()
  );
}