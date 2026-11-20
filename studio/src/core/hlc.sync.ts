export interface HlcStamp {
	readonly pt: number;
	readonly count: number;
	readonly nodeId: string;
}

export function tickHlc(prev: HlcStamp | null, nodeOrNow?: string | number, nowMs?: number): HlcStamp {
	const nodeId = typeof nodeOrNow === 'string' ? nodeOrNow : (prev?.nodeId ?? 'studio');
	const now = typeof nodeOrNow === 'number' ? nodeOrNow : (nowMs ?? Date.now());
	if (!prev || now > prev.pt) {
		return { pt: now, count: 0, nodeId };
	}
	return { pt: prev.pt, count: prev.count + 1, nodeId };
}

export function formatHlc(stamp: HlcStamp): string {
	return `${stamp.pt.toString(36).padStart(9, '0')}-${stamp.count.toString(36).padStart(4, '0')}-${stamp.nodeId}`;
}

export function mergeHlc(local: HlcStamp, remote: HlcStamp, nowMs: number = Date.now()): HlcStamp {
	const maxPt = Math.max(local.pt, remote.pt, nowMs);
	if (maxPt === local.pt && maxPt === remote.pt) {
		return { pt: maxPt, count: Math.max(local.count, remote.count) + 1, nodeId: local.nodeId };
	}
	if (maxPt === local.pt) {
		return { pt: maxPt, count: local.count + 1, nodeId: local.nodeId };
	}
	if (maxPt === remote.pt) {
		return { pt: maxPt, count: remote.count + 1, nodeId: local.nodeId };
	}
	return { pt: maxPt, count: 0, nodeId: local.nodeId };
}

export function compareHlc(a: HlcStamp, b: HlcStamp): number {
	if (a.pt !== b.pt) return a.pt - b.pt;
	if (a.count !== b.count) return a.count - b.count;
	return a.nodeId.localeCompare(b.nodeId);
}
