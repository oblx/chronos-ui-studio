import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const DEV_MODE = process.env.DEVMODE === 'true' || process.env.NODE_ENV !== 'production';
const DEV_VAULT_PATH = 'studio/data/.dev-vault.json';

let cachedKek: Uint8Array | null = null;
let cachedPepper: Uint8Array | null = null;
let devNoticePrinted = false;

function loadOrCreateDevKey(label: string): Uint8Array {
	mkdirSync(dirname(DEV_VAULT_PATH), { recursive: true });
	const store: Record<string, string> = existsSync(DEV_VAULT_PATH)
		? (JSON.parse(readFileSync(DEV_VAULT_PATH, 'utf8')) as Record<string, string>)
		: {};
	if (store[label] && /^[0-9a-fA-F]{64}$/.test(store[label])) {
		return fromHex(store[label]);
	}
	const generated = crypto.getRandomValues(new Uint8Array(32));
	store[label] = bytesToHex(generated);
	writeFileSync(DEV_VAULT_PATH, JSON.stringify(store), { mode: 0o600 });
	try { chmodSync(DEV_VAULT_PATH, 0o600); } catch { /* ignore on non-posix */ }
	return generated;
}

function decodeKeyMaterial(raw: string | undefined, label: string): Uint8Array {
	if (raw && raw.length >= 32) {
		if (/^[0-9a-fA-F]{64}$/.test(raw)) return fromHex(raw);
		return new TextEncoder().encode(raw).slice(0, 32);
	}
	if (!DEV_MODE) {
		throw new Error(`Missing required 32-byte production key: ${label}`);
	}
	if (!devNoticePrinted) {
		devNoticePrinted = true;
		console.error('[chronos-ui] DEVMODE=true: hydrated shared CSPRNG 32-byte dev KEK & Pepper.');
	}
	return loadOrCreateDevKey(label);
}

function getKek(): Uint8Array {
	if (!cachedKek) cachedKek = decodeKeyMaterial(process.env.CHRONOS_MASTER_KEK, 'CHRONOS_MASTER_KEK');
	return cachedKek;
}

function getPepper(): Uint8Array {
	if (!cachedPepper) cachedPepper = decodeKeyMaterial(process.env.CHRONOS_AUTH_PEPPER_V1, 'CHRONOS_AUTH_PEPPER_V1');
	return cachedPepper;
}

export function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

const toHex = bytesToHex;

function fromHex(hex: string): Uint8Array {
	const out = new Uint8Array(hex.length / 2);
	for (let i = 0; i < out.length; i += 1) {
		out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return out;
}

export async function hashPassword(password: string): Promise<string> {
	const pepper = toHex(getPepper());
	return Bun.password.hash(`${password}:${pepper}`, { algorithm: 'argon2id', memoryCost: 16384, timeCost: 2 });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	const pepper = toHex(getPepper());
	return Bun.password.verify(`${password}:${pepper}`, hash);
}

export function hashToken(token: string): string {
	const hasher = new Bun.CryptoHasher('sha256', getPepper());
	hasher.update(token);
	return hasher.digest('hex');
}

export function pseudonymizeIp(ip: string): string {
	const hasher = new Bun.CryptoHasher('sha256', getPepper());
	hasher.update(ip || '0.0.0.0');
	return hasher.digest('hex').slice(0, 24);
}

export async function encryptSecret(plaintext: string): Promise<string> {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const rawKey = new Uint8Array(getKek());
	const data = new TextEncoder().encode(plaintext);
	try {
		const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt']);
		const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data));
		return `${toHex(iv)}.${toHex(cipher)}`;
	} finally {
		rawKey.fill(0);
		data.fill(0);
	}
}

export async function decryptSecret(payload: string): Promise<string> {
	const [ivHex, cipherHex] = payload.split('.');
	if (!ivHex || !cipherHex) throw new Error('Malformed AEAD payload.');
	const iv = fromHex(ivHex);
	const cipher = fromHex(cipherHex);
	const rawKey = new Uint8Array(getKek());
	try {
		const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['decrypt']);
		const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, new Uint8Array(cipher)));
		try {
			return new TextDecoder().decode(plain);
		} finally {
			plain.fill(0);
		}
	} finally {
		rawKey.fill(0);
	}
}
