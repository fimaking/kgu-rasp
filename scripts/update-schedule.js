/**
 * Automated Schedule Synchronizer
 * Fetches the latest live schedule directly from KSU EIOS (https://eios.kosgos.ru)
 * Updates public/schedules/ and src/data/initialSchedule.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const GROUPS_TO_SYNC = [
  { id: 8953, name: '26-ИСбо-4', isDefault: true },
  { id: 8921, name: '26-ПИбо-8', isDefault: false },
];

async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://eios.kosgos.ru/WebApp/'
      }
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function syncGroup(group) {
  const url = `https://eios.kosgos.ru/api/Rasp?idGroup=${group.id}`;
  console.log(`[Schedule Sync] Fetching group ${group.name} (${group.id}) from ${url}...`);

  try {
    const res = await fetchWithTimeout(url, 10000);
    if (!res.ok) {
      console.warn(`[Schedule Sync] Server returned status ${res.status} for group ${group.id}`);
      return false;
    }

    const data = await res.json();
    if (!data || !data.data || !Array.isArray(data.data.rasp)) {
      console.warn(`[Schedule Sync] Invalid response format for group ${group.id}`);
      return false;
    }

    const raspCount = data.data.rasp.length;
    const dateUploading = data.data.info?.dateUploadingRasp || new Date().toISOString();
    console.log(`[Schedule Sync] Received ${raspCount} lessons for ${group.name}. Upload date: ${dateUploading}`);

    // Ensure schedules directory exists
    const schedulesDir = path.join(rootDir, 'public', 'schedules');
    if (!fs.existsSync(schedulesDir)) {
      fs.mkdirSync(schedulesDir, { recursive: true });
    }

    const jsonFormatted = JSON.stringify(data, null, 2);

    // Save to public/schedules/{id}.json
    const publicPath = path.join(schedulesDir, `${group.id}.json`);
    fs.writeFileSync(publicPath, jsonFormatted, 'utf8');
    console.log(`[Schedule Sync] Saved to ${path.relative(rootDir, publicPath)}`);

    // If default group, also update src/data/initialSchedule.json
    if (group.isDefault) {
      const initialPath = path.join(rootDir, 'src', 'data', 'initialSchedule.json');
      fs.writeFileSync(initialPath, jsonFormatted, 'utf8');
      console.log(`[Schedule Sync] Saved default dataset to ${path.relative(rootDir, initialPath)}`);
    }

    // Also update dist/schedules/ if dist directory exists
    const distPath = path.join(rootDir, 'dist', 'schedules', `${group.id}.json`);
    if (fs.existsSync(path.dirname(distPath))) {
      fs.writeFileSync(distPath, jsonFormatted, 'utf8');
    }

    return true;
  } catch (err) {
    console.warn(`[Schedule Sync] Could not fetch group ${group.id} (${err.message}). Using existing dataset.`);
    return false;
  }
}

async function run() {
  console.log('=== KSU Schedule Sync Started ===');
  let anyUpdated = false;

  for (const group of GROUPS_TO_SYNC) {
    const ok = await syncGroup(group);
    if (ok) anyUpdated = true;
  }

  console.log(`=== KSU Schedule Sync Finished (${anyUpdated ? 'Updated' : 'Unchanged'}) ===`);
}

run();
