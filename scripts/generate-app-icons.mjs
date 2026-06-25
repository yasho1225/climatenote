/**
 * Generates iOS AppIcon PNGs from app-icon.svg.
 * Run: node scripts/generate-app-icons.mjs
 */
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svgPath = join(root, 'app-icon.svg');
const outDir = join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');

/** filename → pixel width/height */
const ICONS = {
  'icon-1024.png': 1024,
  'icon-180.png': 180,
  'icon-120.png': 120,
  'icon-120-2.png': 120,
  'icon-87.png': 87,
  'icon-80.png': 80,
  'icon-80-2.png': 80,
  'icon-60.png': 60,
  'icon-58.png': 58,
  'icon-40.png': 40,
  'icon-167.png': 167,
  'icon-152.png': 152,
  'icon-76.png': 76,
  'icon-40-ipad.png': 40,
  'icon-29.png': 29,
  'icon-20.png': 20,
};

async function main() {
  if (!existsSync(svgPath)) {
    console.error('Missing app-icon.svg at repo root.');
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });
  const svg = readFileSync(svgPath);

  for (const [filename, size] of Object.entries(ICONS)) {
    const outPath = join(outDir, filename);
    await sharp(svg).resize(size, size).png().toFile(outPath);
    console.log(`Wrote ${filename} (${size}x${size})`);
  }

  console.log(`\nDone. ${Object.keys(ICONS).length} icons in AppIcon.appiconset`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
