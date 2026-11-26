const DB_NAME = 'chronos-ui-mirror';
const STORE_NAME = 'snapshots';

export function openIdbDatabase(dbName: string, storeName: string, keyPath: string, version = 1): Promise<IDBDatabase | null> {
	if (typeof indexedDB === 'undefined') return Promise.resolve(null);
	return new Promise((resolve) => {
		try {
			const req = indexedDB.open(dbName, version);
			req.onupgradeneeded = () => {
				if (!req.result.objectStoreNames.contains(storeName)) {
					req.result.createObjectStore(storeName, { keyPath });
				}
			};
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => resolve(null);
		} catch { resolve(null); }
	});
}

export async function runIdbStoreTx<T>(
	dbName: string,
	storeName: string,
	keyPath: string,
	mode: IDBTransactionMode,
	op: (store: IDBObjectStore) => IDBRequest<T>,
	version = 1
): Promise<T | null> {
	const db = await openIdbDatabase(dbName, storeName, keyPath, version);
	if (!db) return null;
	return new Promise<T | null>((resolve) => {
		try {
			const req = op(db.transaction(storeName, mode).objectStore(storeName));
			req.onsuccess = () => resolve((req.result ?? null) as T | null);
			req.onerror = () => resolve(null);
		} catch { resolve(null); }
	});
}

export async function writeIdbMirror<T>(key: string, value: T): Promise<void> {
	await runIdbStoreTx(DB_NAME, STORE_NAME, 'key', 'readwrite', (s) => s.put({ key, value, savedAt: Date.now() }));
}

export async function readIdbMirror<T>(key: string): Promise<T | null> {
	const hit = await runIdbStoreTx<{ value?: T }>(DB_NAME, STORE_NAME, 'key', 'readonly', (s) => s.get(key));
	return hit?.value ?? null;
}
