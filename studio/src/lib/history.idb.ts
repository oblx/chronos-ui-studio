import { clampHistoryLimit, HISTORY_LIMIT_BOUNDS, type UiNodeTree } from '@chronos-ui/svelte';
import { runIdbStoreTx } from './idb.mirror';

export interface HistorySnapshot {
	readonly projectUuid: string;
	readonly undoStack: readonly UiNodeTree[];
	readonly redoStack: readonly UiNodeTree[];
	readonly historyLimit: number;
	readonly updatedAt: number;
}

export interface HistoryStorePort {
	load(projectId: string): Promise<HistorySnapshot | null>;
	save(projectId: string, snapshot: Omit<HistorySnapshot, 'projectUuid' | 'updatedAt'>): Promise<void>;
	clear(projectId: string): Promise<void>;
	setLimit(projectId: string, limit: number): Promise<HistorySnapshot>;
}

const DB_NAME = 'chronos_ui_history_v1';
const STORE_NAME = 'histories';
const KEY_PATH = 'projectUuid';
const DB_VERSION = 1;
const memoryFallback = new Map<string, HistorySnapshot>();
const cloneNodes = (nodes: UiNodeTree): UiNodeTree => JSON.parse(JSON.stringify(nodes)) as UiNodeTree;

export function trimHistoryStacks(undoStack: readonly UiNodeTree[], redoStack: readonly UiNodeTree[], limit: number) {
	const cap = clampHistoryLimit(limit);
	return { undoStack: undoStack.slice(-cap), redoStack: redoStack.slice(-cap), historyLimit: cap };
}

export function stepHistoryStack(from: readonly UiNodeTree[], to: readonly UiNodeTree[], current: UiNodeTree, limit: number) {
	if (!from.length) return null;
	const cap = clampHistoryLimit(limit);
	return { target: cloneNodes(from[from.length - 1]), nextFrom: from.slice(0, -1), nextTo: [...to, cloneNodes(current)].slice(-cap) };
}

export function createHistoryRing(initialLimit = HISTORY_LIMIT_BOUNDS.defaultLimit) {
	let limit = clampHistoryLimit(initialLimit);
	let undoStack: UiNodeTree[] = [];
	let redoStack: UiNodeTree[] = [];
	return {
		get limit(): number { return limit; },
		get undoStack(): readonly UiNodeTree[] { return undoStack; },
		get redoStack(): readonly UiNodeTree[] { return redoStack; },
		get canUndo(): boolean { return undoStack.length > 0; },
		get canRedo(): boolean { return redoStack.length > 0; },
		push: (prev: UiNodeTree): void => { undoStack = [...undoStack, cloneNodes(prev)].slice(-limit); redoStack = []; },
		undo: (cur: UiNodeTree): UiNodeTree | null => {
			const res = stepHistoryStack(undoStack, redoStack, cur, limit);
			if (!res) return null;
			undoStack = res.nextFrom; redoStack = res.nextTo; return res.target;
		},
		redo: (cur: UiNodeTree): UiNodeTree | null => {
			const res = stepHistoryStack(redoStack, undoStack, cur, limit);
			if (!res) return null;
			redoStack = res.nextFrom; undoStack = res.nextTo; return res.target;
		},
		setLimit: (next: number): number => { limit = clampHistoryLimit(next); undoStack = undoStack.slice(-limit); redoStack = redoStack.slice(-limit); return limit; },
		hydrate: (snap: Pick<HistorySnapshot, 'undoStack' | 'redoStack' | 'historyLimit'>): void => {
			limit = clampHistoryLimit(snap.historyLimit);
			undoStack = snap.undoStack.slice(-limit).map(cloneNodes);
			redoStack = snap.redoStack.slice(-limit).map(cloneNodes);
		},
		clear: (): void => { undoStack = []; redoStack = []; }
	};
}

const runHistoryTx = <T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> =>
	runIdbStoreTx(DB_NAME, STORE_NAME, KEY_PATH, mode, op, DB_VERSION);

export const historyIdbStore: HistoryStorePort = {
	async load(projectId: string): Promise<HistorySnapshot | null> {
		const hit = (await runHistoryTx<HistorySnapshot>('readonly', (s) => s.get(projectId))) ?? memoryFallback.get(projectId) ?? null;
		if (!hit) return null;
		const trimmed = trimHistoryStacks(hit.undoStack ?? [], hit.redoStack ?? [], hit.historyLimit);
		return { projectUuid: projectId, ...trimmed, updatedAt: hit.updatedAt ?? Date.now() };
	},
	async save(projectId: string, snapshot): Promise<void> {
		const trimmed = trimHistoryStacks(snapshot.undoStack, snapshot.redoStack, snapshot.historyLimit);
		const record: HistorySnapshot = {
			projectUuid: projectId, undoStack: trimmed.undoStack.map(cloneNodes),
			redoStack: trimmed.redoStack.map(cloneNodes), historyLimit: trimmed.historyLimit, updatedAt: Date.now()
		};
		memoryFallback.set(projectId, record);
		await runHistoryTx('readwrite', (s) => s.put(record));
	},
	async clear(projectId: string): Promise<void> {
		memoryFallback.delete(projectId);
		await runHistoryTx('readwrite', (s) => s.delete(projectId));
	},
	async setLimit(projectId: string, limit: number): Promise<HistorySnapshot> {
		const existing = await historyIdbStore.load(projectId);
		const trimmed = trimHistoryStacks(existing?.undoStack ?? [], existing?.redoStack ?? [], limit);
		const next: HistorySnapshot = { projectUuid: projectId, ...trimmed, updatedAt: Date.now() };
		await historyIdbStore.save(projectId, next);
		return next;
	}
};
