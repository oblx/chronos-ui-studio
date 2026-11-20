import type { AssistantDockState, LayoutDensity, StudioDefaultsConfig } from '@chronos-ui/svelte';
import { readIdbMirror, writeIdbMirror } from '@studio/lib/idb.mirror';

export interface PersistedStudioSession {
	readonly activeProjectId: string;
	readonly layoutDensity: LayoutDensity;
	readonly studioChromeVisible: boolean;
	readonly toolPaletteOpen: boolean;
	readonly leftDrawerOpen: boolean;
	readonly rightDrawerOpen: boolean;
	readonly assistantDock: AssistantDockState;
	readonly studioDefaults: StudioDefaultsConfig;
	readonly activeCursorPackId: string | null;
	readonly updatedAt: number;
}

const SESSION_KEY = 'chronos:studio:session:v1';

export function readSessionSnapshotSync(): PersistedStudioSession | null {
	if (typeof window === 'undefined' || !window.localStorage) return null;
	try {
		const raw = window.localStorage.getItem(SESSION_KEY);
		return raw ? (JSON.parse(raw) as PersistedStudioSession) : null;
	} catch {
		return null;
	}
}

export async function readSessionSnapshot(): Promise<PersistedStudioSession | null> {
	const syncSnap = readSessionSnapshotSync();
	if (syncSnap) return syncSnap;
	return readIdbMirror<PersistedStudioSession>(SESSION_KEY);
}

export function writeSessionSnapshot(snap: PersistedStudioSession): void {
	if (typeof window !== 'undefined' && window.localStorage) {
		try { window.localStorage.setItem(SESSION_KEY, JSON.stringify(snap)); } catch { /* ignore quota */ }
	}
	void writeIdbMirror(SESSION_KEY, snap);
}
