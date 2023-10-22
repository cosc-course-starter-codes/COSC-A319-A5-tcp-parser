module.exports = {
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

function compute16bChunkSum(buf, sum) {
  if (buf.length === 0) { return sum }
  if (buf.length === 1) { buf = Buffer.concat([buf, Buffer.from([0])]) }
  return compute16bChunkSum(
    buf.subarray(2),
    sum + buf.readUInt16BE()
  )
}