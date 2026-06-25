/**
 * Ensures production iOS/web builds have Supabase config baked in.
 * Run before: npm run build (for App Store / TestFlight)
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvFile() {
  const envPath = join(root, '.env');
  const values = { ...process.env };
  if (!existsSync(envPath)) return values;

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in values)) values[key] = value;
  }
  return values;
}

function isPlaceholder(value) {
  if (!value) return true;
  const lower = value.toLowerCase();
  return (
    lower.includes('your_supabase') ||
    lower.includes('yourdomain') ||
    lower === 'undefined' ||
    lower === 'null'
  );
}

const env = loadEnvFile();
const errors = [];

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

if (isPlaceholder(url)) {
  errors.push('VITE_SUPABASE_URL is missing or still a placeholder in .env');
}
if (isPlaceholder(key)) {
  errors.push('VITE_SUPABASE_ANON_KEY is missing or still a placeholder in .env');
}
if (url && !url.startsWith('https://')) {
  errors.push('VITE_SUPABASE_URL must use https:// for production builds');
}
if (isPlaceholder(env.VITE_APP_URL) || (env.VITE_APP_URL || '').includes('localhost')) {
  console.warn(
    '⚠️  VITE_APP_URL is unset or localhost — OK for iOS-only builds (native OAuth uses com.theclimatenote.app://).',
  );
}

if (errors.length) {
  console.error('\n❌ Production build blocked — fix .env first:\n');
  for (const err of errors) console.error(`  • ${err}`);
  console.error('\nCopy .env.example → .env and fill in real values.');
  console.error('See APP_STORE_SUBMISSION_STEPS.md for details.\n');
  process.exit(1);
}

console.log('✅ Production environment variables look valid.');
