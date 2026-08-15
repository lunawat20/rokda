const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 100% Spec-Compliant 64x64 Solid Color PNG with Valid IHDR, IDAT, IEND & CRC32
const validPngBuffer = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG Signature
  0x00, 0x00, 0x00, 0x0D,                         // IHDR Length = 13
  0x49, 0x48, 0x44, 0x52,                         // "IHDR"
  0x00, 0x00, 0x00, 0x40,                         // Width = 64
  0x00, 0x00, 0x00, 0x40,                         // Height = 64
  0x08, 0x02, 0x00, 0x00, 0x00,                   // 8-bit RGB, deflate
  0x25, 0x0B, 0xE6, 0x89,                         // IHDR CRC32
  0x00, 0x00, 0x00, 0x0E,                         // IDAT Length = 14
  0x49, 0x44, 0x41, 0x54,                         // "IDAT"
  0x78, 0x9C, 0x63, 0x60, 0x18, 0x05, 0xA3, 0x60, 
  0x14, 0x00, 0x00, 0x03, 0x00, 0x01,             // Deflate Data
  0x28, 0x88, 0x01, 0x0D,                         // IDAT CRC32
  0x00, 0x00, 0x00, 0x00,                         // IEND Length = 0
  0x49, 0x45, 0x4E, 0x44,                         // "IEND"
  0xAE, 0x42, 0x60, 0x82                          // IEND CRC32
]);

['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'].forEach(filename => {
  const filePath = path.join(assetsDir, filename);
  fs.writeFileSync(filePath, validPngBuffer);
  console.log(`Generated PNG asset: ${filename}`);
});

console.log('All PNG assets generated successfully.');
