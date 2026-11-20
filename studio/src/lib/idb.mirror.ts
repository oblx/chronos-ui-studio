const DB_NAME = 'chronos-ui-mirror';
const STORE_NAME = 'snapshots';

function openMirrorDb(): Promise<IDBDatabase | null> {
	if (typeof indexedDB === 'undefined') return Promise.resolve(null);
	return new Promise((resolve) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => {
			if (!req.result.objectStoreNames.contains(STORE_NAME)) {
				req.result.createObjectStore(STORE_NAME, { keyPath: 'key' });
			}
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => resolve(null);
	});
}

export async function writeIdbMirror<T>(key: string, value: T): Promise<void> {
	const db = await openMirrorDb();
	if (!db) return;
	await new Promise<void>((resolve) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		tx.objectStore(STORE_NAME).put({ key, value, savedAt: Date.now() });
		tx.oncomplete = () => resolve();
		tx.onerror = () => resolve();
	});
}

export async function readIdbMirror<T>(key: string): Promise<T | null> {
	const db = await openMirrorDb();
	if (!db) return null;
	return new Promise<T | null>((resolve) => {
		const tx = db.transaction(STORE_NAME, 'readonly');
		const req = tx.objectStore(STORE_NAME).get(key);
		req.onsuccess = () => resolve((req.result as { value?: T } | undefined)?.value ?? null);
		req.onerror = () => resolve(null);
	});
}
