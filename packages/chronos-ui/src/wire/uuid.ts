const UUID_V7_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let lastMs = 0;
let seq = 0;

function hexByte(b: number): string {
	return (b & 0xff).toString(16).padStart(2, '0');
}

function nextMonotonicClock(): { readonly ms: number; readonly seq: number } {
	const now = Date.now();
	if (now > lastMs) {
		lastMs = now;
		seq = 0;
	} else {
		seq = (seq + 1) & 0x0fff;
		if (seq === 0) lastMs += 1;
	}
	return { ms: lastMs, seq };
}

function fillRandomBytes(buf: Uint8Array): void {
	if (typeof globalThis.crypto?.getRandomValues === 'function') {
		globalThis.crypto.getRandomValues(buf);
		return;
	}
	for (let i = 0; i < buf.length; i += 1) buf[i] = Math.floor(Math.random() * 256);
}

export function generateUuidV7(): string {
	const { ms, seq: s } = nextMonotonicClock();
	const bytes = new Uint8Array(16);
	fillRandomBytes(bytes);
	const ts = BigInt(ms);
	bytes[0] = Number((ts >> 40n) & 0xffn);
	bytes[1] = Number((ts >> 32n) & 0xffn);
	bytes[2] = Number((ts >> 24n) & 0xffn);
	bytes[3] = Number((ts >> 16n) & 0xffn);
	bytes[4] = Number((ts >> 8n) & 0xffn);
	bytes[5] = Number(ts & 0xffn);
	bytes[6] = 0x70 | ((s >> 8) & 0x0f);
	bytes[7] = s & 0xff;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	const h = Array.from(bytes, hexByte).join('');
	return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function deterministicUuidV7Seed(ordinalOrKey: number | string, saltHex = '95620005'): string {
	let ordinal = typeof ordinalOrKey === 'number' ? ordinalOrKey : 0x811c9dc5;
	if (typeof ordinalOrKey === 'string') {
		for (let i = 0; i < ordinalOrKey.length; i += 1) {
			ordinal = Math.imul(ordinal ^ ordinalOrKey.charCodeAt(i), 0x01000193) >>> 0;
		}
		ordinal = (ordinal % 0x0ffffff) + 1;
	}
	const tsHex = (1763540000000 + ordinal).toString(16).padStart(12, '0');
	const seqHex = (ordinal & 0x0fff).toString(16).padStart(3, '0');
	const tailHex = `${(0x8000 | (ordinal & 0x3fff)).toString(16).padStart(4, '0')}-${saltHex.padEnd(12, '0').slice(0, 12)}`;
	return `${tsHex.slice(0, 8)}-${tsHex.slice(8, 12)}-7${seqHex}-${tailHex}`;
}

export function isUuidV7(value: string): boolean {
	return UUID_V7_RE.test(value);
}

export function shortUuid(uuid: string): string {
	const clean = uuid.replace(/[^0-9a-f]/gi, '').toLowerCase();
	if (clean.length >= 16) return `${clean.slice(10, 12)}${clean.slice(13, 16)}${clean.slice(-3)}`;
	return clean.slice(0, 8) || uuid.slice(0, 8);
}
