export interface ZipEntry {
	readonly path: string;
	readonly content: Uint8Array;
}

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i += 1) {
	let c = i;
	for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
	CRC_TABLE[i] = c >>> 0;
}

function crc32(bytes: Uint8Array): number {
	let c = 0xffffffff;
	for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}

function concatBytes(chunks: readonly Uint8Array[]): Uint8Array {
	const total = chunks.reduce((sum, b) => sum + b.length, 0);
	const out = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) { out.set(chunk, offset); offset += chunk.length; }
	return out;
}

export function packZipFiles(entries: readonly ZipEntry[]): Uint8Array {
	const enc = new TextEncoder();
	const locals: Uint8Array[] = [];
	const centrals: Uint8Array[] = [];
	let offset = 0;
	for (const entry of entries) {
		const nameBytes = enc.encode(entry.path);
		const crc = crc32(entry.content);
		const lh = new Uint8Array(30 + nameBytes.length);
		const lv = new DataView(lh.buffer);
		lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true);
		lv.setUint32(14, crc, true); lv.setUint32(18, entry.content.length, true);
		lv.setUint32(22, entry.content.length, true); lv.setUint16(26, nameBytes.length, true);
		lh.set(nameBytes, 30);
		const ch = new Uint8Array(46 + nameBytes.length);
		const cv = new DataView(ch.buffer);
		cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
		cv.setUint32(16, crc, true); cv.setUint32(20, entry.content.length, true);
		cv.setUint32(24, entry.content.length, true); cv.setUint16(28, nameBytes.length, true);
		cv.setUint32(42, offset, true);
		ch.set(nameBytes, 46);
		locals.push(lh, entry.content);
		centrals.push(ch);
		offset += lh.length + entry.content.length;
	}
	const centralBuf = concatBytes(centrals);
	const eocd = new Uint8Array(22);
	const ev = new DataView(eocd.buffer);
	ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, entries.length, true);
	ev.setUint16(10, entries.length, true); ev.setUint32(12, centralBuf.length, true);
	ev.setUint32(16, offset, true);
	return concatBytes([...locals, centralBuf, eocd]);
}

export function unpackZipFiles(archive: Uint8Array): readonly ZipEntry[] {
	const dec = new TextDecoder();
	const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength);
	const entries: ZipEntry[] = [];
	let pos = 0;
	while (pos + 30 <= archive.length && view.getUint32(pos, true) === 0x04034b50) {
		const compMethod = view.getUint16(pos + 8, true);
		const compSize = view.getUint32(pos + 18, true);
		const nameLen = view.getUint16(pos + 26, true);
		const extraLen = view.getUint16(pos + 28, true);
		const nameStart = pos + 30;
		const dataStart = nameStart + nameLen + extraLen;
		const path = dec.decode(archive.subarray(nameStart, nameStart + nameLen));
		if (compMethod !== 0) throw new Error(`Unsupported ZIP compression method ${compMethod} for ${path}`);
		entries.push({ path, content: archive.slice(dataStart, dataStart + compSize) });
		pos = dataStart + compSize;
	}
	return entries;
}
