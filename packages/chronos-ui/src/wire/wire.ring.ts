import { HUD_METRICS } from '../tokens';
import type { WireTraceRecord } from './core';

export class WireTelemetryRing {
	private readonly capacity: number;
	private buffer: WireTraceRecord[] = [];
	private cursor = 0;

	constructor(capacity: number = HUD_METRICS.ringCapacity) {
		this.capacity = Math.max(16, capacity);
	}

	push(entry: Omit<WireTraceRecord, 'seq'>): WireTraceRecord {
		this.cursor += 1;
		const record: WireTraceRecord = { ...entry, seq: this.cursor };
		const next = this.buffer.length >= this.capacity
			? [...this.buffer.slice(1), record]
			: [...this.buffer, record];
		this.buffer = next;
		return record;
	}

	snapshot(): readonly WireTraceRecord[] {
		return this.buffer;
	}

	mergeExternal(records: readonly WireTraceRecord[]): void {
		const seen = new Set(this.buffer.map((r) => `${r.spine}:${r.envelopeId}`));
		const fresh = records.filter((r) => !seen.has(`${r.spine}:${r.envelopeId}`));
		if (fresh.length === 0) {
			return;
		}
		const combined = [...this.buffer, ...fresh].sort((a, b) => a.timestamp - b.timestamp);
		this.buffer = combined.slice(-this.capacity);
	}

	clear(): void {
		this.buffer = [];
	}
}
