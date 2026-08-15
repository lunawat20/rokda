const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Standard CRC32 table & calculation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const typeAndData = Buffer.concat([typeBuf, data]);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([len, typeAndData, crcBuf]);
}

function generatePNG(width, height, r = 16, g = 185, b = 129) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data: height rows, each starting with filter byte 0, followed by width * 4 RGBA bytes
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;     // R
      rawData[pixelOffset + 1] = g; // G
      rawData[pixelOffset + 2] = b; // B
      rawData[pixelOffset + 3] = 255; // A
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

// 1024x1024 Emerald Icon
fs.writeFileSync(path.join(assetsDir, 'icon.png'), generatePNG(1024, 1024, 16, 185, 129));
// 1024x1024 Adaptive Icon
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), generatePNG(1024, 1024, 16, 185, 129));
// 1242x2436 Dark Obsidian Splash
fs.writeFileSync(path.join(assetsDir, 'splash.png'), generatePNG(1242, 2436, 11, 15, 23));
// 48x48 Favicon
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), generatePNG(48, 48, 16, 185, 129));

console.log('Valid PNG assets generated successfully with zlib compression & CRC32 verification!');
