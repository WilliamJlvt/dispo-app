import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { env } from '$env/dynamic/private';
import type { Creneau, AppConfig } from '$lib/types';

function dataDir(): string {
	return env.DATA_DIR || './data';
}

function configPath(): string {
	return path.join(dataDir(), 'config.yaml');
}

function crenauxDir(): string {
	return path.join(dataDir(), 'crenaux');
}

function ensureDir(dir: string) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

function atomicWrite(filePath: string, content: string) {
	const tmpPath = filePath + '.tmp';
	fs.writeFileSync(tmpPath, content, 'utf-8');
	fs.renameSync(tmpPath, filePath);
}

export function getConfig(): AppConfig {
	try {
		const raw = fs.readFileSync(configPath(), 'utf-8');
		return yaml.load(raw) as AppConfig;
	} catch {
		return { allowed_emails: [] };
	}
}

export function saveConfig(config: AppConfig): void {
	ensureDir(dataDir());
	atomicWrite(configPath(), yaml.dump(config, { lineWidth: -1 }));
}

export function getCreneau(slug: string): Creneau | null {
	const filePath = path.join(crenauxDir(), `${slug}.yaml`);
	try {
		const raw = fs.readFileSync(filePath, 'utf-8');
		return yaml.load(raw) as Creneau;
	} catch {
		return null;
	}
}

export function saveCreneau(creneau: Creneau): void {
	ensureDir(crenauxDir());
	const filePath = path.join(crenauxDir(), `${creneau.id}.yaml`);
	atomicWrite(filePath, yaml.dump(creneau, { lineWidth: -1 }));
}

export function listCrenaux(): Creneau[] {
	ensureDir(crenauxDir());
	try {
		const files = fs.readdirSync(crenauxDir()).filter((f) => f.endsWith('.yaml'));
		const crenaux: Creneau[] = [];
		for (const file of files) {
			const filePath = path.join(crenauxDir(), file);
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
	const filePath = path.join(crenauxDir(), `${slug}.yaml`);
	try {
		fs.unlinkSync(filePath);
		return true;
	} catch {
		return false;
	}
}
