import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { Creneau, AppConfig } from '$lib/types';

const DATA_DIR = process.env.DATA_DIR || './data';
const CONFIG_PATH = path.join(DATA_DIR, 'config.yaml');
const CRENAUX_DIR = path.join(DATA_DIR, 'crenaux');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Atomic write: write to .tmp, then rename */
function atomicWrite(filePath: string, content: string) {
  const tmpPath = filePath + '.tmp';
  fs.writeFileSync(tmpPath, content, 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

export function getConfig(): AppConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return yaml.load(raw) as AppConfig;
  } catch {
    return { allowed_emails: [] };
  }
}

export function saveConfig(config: AppConfig): void {
  ensureDir(DATA_DIR);
  atomicWrite(CONFIG_PATH, yaml.dump(config, { lineWidth: -1 }));
}

export function getCreneau(slug: string): Creneau | null {
  const filePath = path.join(CRENAUX_DIR, `${slug}.yaml`);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return yaml.load(raw) as Creneau;
  } catch {
    return null;
  }
}

export function saveCreneau(creneau: Creneau): void {
  ensureDir(CRENAUX_DIR);
  const filePath = path.join(CRENAUX_DIR, `${creneau.id}.yaml`);
  atomicWrite(filePath, yaml.dump(creneau, { lineWidth: -1 }));
}

export function listCrenaux(): Creneau[] {
  ensureDir(CRENAUX_DIR);
  try {
    const files = fs.readdirSync(CRENAUX_DIR).filter((f) => f.endsWith('.yaml'));
    const crenaux: Creneau[] = [];
    for (const file of files) {
      const filePath = path.join(CRENAUX_DIR, file);
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        crenaux.push(yaml.load(raw) as Creneau);
      } catch {
        // skip corrupted files
      }
    }
    return crenaux.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch {
    return [];
  }
}

export function deleteCreneau(slug: string): boolean {
  const filePath = path.join(CRENAUX_DIR, `${slug}.yaml`);
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch {
    return false;
  }
}
