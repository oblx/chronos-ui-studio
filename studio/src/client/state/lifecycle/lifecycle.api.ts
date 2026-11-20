import { CURSOR_LIMITS, type CornerKind, type CssCursorState, type CursorPackDefinition, type UiNodeTree, type UiProjectDefinition } from '@chronos-ui/svelte';
import { readIdbMirror, writeIdbMirror } from '../../../lib/idb.mirror';
import { apiJsonOrThrow as jsonReq } from './http.client';

export async function apiSaveProject(projectId: string, snapshot: {
	name?: string;
	themeId?: string;
	cornerMode?: CornerKind;
	cornerRadiusRem?: number;
	activeCursorPackId?: string | null;
	nodes?: UiNodeTree;
}): Promise<{ savedAt: number; revisionId: string; project: UiProjectDefinition }> {
	return jsonReq(`/api/projects/${encodeURIComponent(projectId)}/save`, {
		method: 'POST',
		body: JSON.stringify(snapshot)
	});
}

export async function apiCleanProject(projectId: string): Promise<{ revisionId: string; project: UiProjectDefinition }> {
	return jsonReq(`/api/projects/${encodeURIComponent(projectId)}/clean`, { method: 'POST' });
}

export async function apiPatchProjectCursor(projectId: string, activeCursorPackId: string | null): Promise<UiProjectDefinition | null> {
	const data = await jsonReq<{ project?: UiProjectDefinition }>(`/api/projects/${encodeURIComponent(projectId)}`, {
		method: 'PATCH',
		body: JSON.stringify({ activeCursorPackId })
	});
	return data.project ?? null;
}

export async function apiPatchProjectCornerRadius(projectId: string, cornerRadiusRem: number): Promise<UiProjectDefinition | null> {
	const data = await jsonReq<{ project?: UiProjectDefinition }>(`/api/projects/${encodeURIComponent(projectId)}`, {
		method: 'PATCH',
		body: JSON.stringify({ cornerRadiusRem })
	});
	return data.project ?? null;
}

export async function apiFetchCursorPacks(): Promise<CursorPackDefinition[]> {
	try {
		const data = await jsonReq<{ packs?: CursorPackDefinition[] }>('/api/cursors');
		const list = data.packs ?? [];
		await writeIdbMirror('cursor_packs', list);
		return list;
	} catch {
		return (await readIdbMirror<CursorPackDefinition[]>('cursor_packs')) ?? [];
	}
}

export async function apiCreateCursorPack(payload: {
	name: string;
	description?: string;
	forkFromUuid?: string;
	sourcePngDataUrl?: string;
	baseHotspotX?: number;
	baseHotspotY?: number;
}): Promise<CursorPackDefinition> {
	const data = await jsonReq<{ pack: CursorPackDefinition }>('/api/cursors', {
		method: 'POST',
		body: JSON.stringify(payload)
	});
	return data.pack;
}

export async function apiDeriveCursorPackStates(uuid: string, opts?: { accentColor?: string; useAiLabel?: boolean }): Promise<CursorPackDefinition> {
	const data = await jsonReq<{ pack: CursorPackDefinition }>(`/api/cursors/${encodeURIComponent(uuid)}/derive-states`, {
		method: 'POST',
		body: JSON.stringify(opts ?? {})
	});
	return data.pack;
}

export async function apiUpdateCursorStateAsset(
	uuid: string,
	cssState: CssCursorState,
	patch: { hotspotX?: number; hotspotY?: number; assetDataUrl?: string }
): Promise<CursorPackDefinition> {
	const data = await jsonReq<{ pack: CursorPackDefinition }>(`/api/cursors/${encodeURIComponent(uuid)}/states/${encodeURIComponent(cssState)}`, {
		method: 'PATCH',
		body: JSON.stringify(patch)
	});
	return data.pack;
}

export function readPngFileAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error('Failed to read PNG file'));
		reader.onload = () => {
			const raw = String(reader.result ?? '');
			if (typeof Image === 'undefined' || typeof document === 'undefined') { resolve(raw); return; }
			const img = new Image();
			img.onerror = () => resolve(raw);
			img.onload = () => {
				if (img.width <= CURSOR_LIMITS.autoScaleAbovePx && img.height <= CURSOR_LIMITS.autoScaleAbovePx) { resolve(raw); return; }
				const canvas = document.createElement('canvas');
				canvas.width = CURSOR_LIMITS.normalizedPx; canvas.height = CURSOR_LIMITS.normalizedPx;
				const ctx = canvas.getContext('2d');
				if (!ctx) { resolve(raw); return; }
				ctx.drawImage(img, 0, 0, CURSOR_LIMITS.normalizedPx, CURSOR_LIMITS.normalizedPx);
				resolve(canvas.toDataURL('image/png'));
			};
			img.src = raw;
		};
		reader.readAsDataURL(file);
	});
}
