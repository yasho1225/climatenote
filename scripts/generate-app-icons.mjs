/**
 * Generates iOS AppIcon PNGs and splash screen images from app-icon.svg.
 * Run: node scripts/generate-app-icons.mjs
 */
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svgPath = join(root, 'app-icon.svg');
const iconOutDir = join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
const splashOutDir = join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset');

/** filename → pixel width/height for the App Icon asset catalog */
const ICONS = {
  // iPhone sizes
  'icon-40.png': 40,    // 20x20 @2x
  'icon-60.png': 60,    // 20x20 @3x
  'icon-58.png': 58,    // 29x29 @2x
  'icon-87.png': 87,    // 29x29 @3x
  'icon-80.png': 80,    // 40x40 @2x
  'icon-120-2.png': 120, // 40x40 @3x
  'icon-120.png': 120,  // 60x60 @2x
  'icon-180.png': 180,  // 60x60 @3x
  // iPad sizes
  'icon-20.png': 20,    // 20x20 @1x
  'icon-29.png': 29,    // 29x29 @1x
  'icon-40-ipad.png': 40, // 40x40 @1x
  'icon-80-2.png': 80,  // 40x40 @2x (iPad)
  'icon-76.png': 76,    // 76x76 @1x
  'icon-152.png': 152,  // 76x76 @2x
  'icon-167.png': 167,  // 83.5x83.5 @2x (iPad Pro)
  // App Store
  'icon-1024.png': 1024,
};

/** Splash screen background color (#eef2ec) */
const SPLASH_BG = { r: 238, g: 242, b: 236, alpha: 255 };
const SPLASH_SIZE = 2732;
const SPLASH_ICON_SIZE = 600;

async function generateIcons(svg) {
  mkdirSync(iconOutDir, { recursive: true });
  for (const [filename, size] of Object.entries(ICONS)) {
    const outPath = join(iconOutDir, filename);
    await sharp(svg).resize(size, size).png().toFile(outPath);
    console.log(`  icon: ${filename} (${size}×${size})`);
  }
}

async function generateSplash(iconPath) {
  mkdirSync(splashOutDir, { recursive: true });

  const iconBuf = await sharp(iconPath)
    .resize(SPLASH_ICON_SIZE, SPLASH_ICON_SIZE, { fit: 'contain', background: SPLASH_BG })
    .png()
    .toBuffer();

  const splashBuf = await sharp({
    create: { width: SPLASH_SIZE, height: SPLASH_SIZE, channels: 4, background: SPLASH_BG },
  })
    .composite([{ input: iconBuf, gravity: 'center' }])
    .png({ compressionLevel: 6 })
    .toBuffer();

  const splashFiles = [
    'splash-2732x2732.png',
    'splash-2732x2732-1.png',
    'splash-2732x2732-2.png',
  ];
  for (const f of splashFiles) {
    writeFileSync(join(splashOutDir, f), splashBuf);
    console.log(`  splash: ${f}`);
  }
}

async function main() {
  if (!existsSync(svgPath)) {
    console.error('Missing app-icon.svg at repo root.');
    process.exit(1);
  }

  console.log('Generating app icons…');
  const svg = readFileSync(svgPath);
  await generateIcons(svg);

  const icon1024 = join(iconOutDir, 'icon-1024.png');
  console.log('Generating splash screens…');
  await generateSplash(icon1024);

  console.log(`\nDone. ${Object.keys(ICONS).length} icons + 3 splash images generated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
