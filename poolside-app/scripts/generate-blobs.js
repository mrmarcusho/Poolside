const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const outputDir = path.join(__dirname, '../src/assets/images/blobs');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Blob configurations
const blobs = [
  { name: 'purple', color: { r: 139, g: 92, b: 246 } },
  { name: 'pink', color: { r: 236, g: 72, b: 153 } },
  { name: 'green', color: { r: 74, g: 222, b: 128 } },
  { name: 'amber', color: { r: 251, g: 191, b: 36 } },
  { name: 'red', color: { r: 239, g: 68, b: 68 } },
];

const size = 100; // Output image size
const blur = 15; // Blur radius

async function generateBlob(name, color) {
  // Create a small circle, then blur and resize
  const circleSize = 40;

  // Create SVG circle
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="${size/2}"
        cy="${size/2}"
        r="${circleSize/2}"
        fill="rgba(${color.r}, ${color.g}, ${color.b}, 0.8)"
      />
    </svg>
  `;

  const outputPath = path.join(outputDir, `blob-${name}.png`);

  await sharp(Buffer.from(svg))
    .blur(blur)
    .png()
    .toFile(outputPath);

  console.log(`Generated: ${outputPath}`);
}

async function main() {
  console.log('Generating blob images...');

  for (const blob of blobs) {
    await generateBlob(blob.name, blob.color);
  }

  console.log('Done!');
}

main().catch(console.error);
