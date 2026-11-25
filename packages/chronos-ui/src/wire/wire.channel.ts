import { HUD_METRICS } from '../tokens';
import type { DagEnvelope } from './core';

export interface MultiTabChannel {
	readonly postIntent: (envelope: DagEnvelope) => void;
	readonly notifyTokenRotated: (issuedAtMs: number) => void;
	readonly isWithinRefreshGrace: (nowMs?: number) => boolean;
	readonly destroy: () => void;
}

export function createMultiTabChannel(
	channelName: string,
	onRemoteEnvelope: (envelope: DagEnvelope) => void
): MultiTabChannel {
	let lastRotationMs = 0;
	const channel = typeof BroadcastChannel !== 'undefined'
		? new BroadcastChannel(channelName)
		: null;

	if (channel) {
		channel.onmessage = (event: MessageEvent) => {
			const data = event.data as { kind?: string; envelope?: DagEnvelope; issuedAtMs?: number };
			if (data?.kind === 'DAG_ENVELOPE' && data.envelope) {
				onRemoteEnvelope({ ...data.envelope, origin: 'BROADCAST' });
			}
			if (data?.kind === 'TOKEN_ROTATED' && typeof data.issuedAtMs === 'number') {
				lastRotationMs = data.issuedAtMs;
			}
		};
	}

	return {
		postIntent(envelope: DagEnvelope): void {
			if (!channel || envelope.origin === 'BROADCAST') {
				return;
			}
			channel.postMessage({ kind: 'DAG_ENVELOPE', envelope });
		},
		notifyTokenRotated(issuedAtMs: number): void {
			lastRotationMs = issuedAtMs;
			channel?.postMessage({ kind: 'TOKEN_ROTATED', issuedAtMs });
		},
		isWithinRefreshGrace(nowMs: number = Date.now()): boolean {
			return lastRotationMs > 0 && nowMs - lastRotationMs <= HUD_METRICS.refreshGraceMs;
		},
		destroy(): void {
			channel?.close();
		}
	};
}
