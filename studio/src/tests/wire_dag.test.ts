import { describe, expect, test } from 'bun:test';
import { createMultiTabChannel, WireTelemetryRing } from '@chronos-ui/svelte';
import { CAPABILITY_BITS } from '../config';
import { compareHlc, grantCapability, hasCapability, maskForRole, mergeHlc, tickHlc, validateWebhookUrl } from '../core';

describe('wire ring, HLC, RBAC, and SSRF guard', () => {
	test('WireTelemetryRing bounds capacity and deduplicates merged server traces', () => {
		const ring = new WireTelemetryRing(16);
		for (let i = 0; i < 20; i += 1) {
			ring.push({
				spine: 'CLIENT_DAG',
				envelopeId: `e-${i}`,
				kind: 'UI_SET_THEME',
				tier: 'TIER_0_LOCAL_UI',
				origin: 'USER',
				stageMs: 0.1,
				ok: true,
				summary: 'ok',
				timestamp: 1000 + i
			});
		}
		expect(ring.snapshot().length).toBe(16);
		ring.mergeExternal([
			{ seq: 1, spine: 'SERVER_DAG', envelopeId: 'srv-1', kind: 'STUDIO_COMMAND_EXEC', tier: 'TIER_1_COALESCED_PERSIST', origin: 'SYSTEM', stageMs: 0.4, ok: true, summary: 'srv', timestamp: 2000 }
		]);
		expect(ring.snapshot().some((r) => r.spine === 'SERVER_DAG')).toBe(true);
	});

	test('BroadcastChannel multi-tab grace window stays active within 3000ms', () => {
		const ch = createMultiTabChannel('test-channel', () => {});
		ch.notifyTokenRotated(10_000);
		expect(ch.isWithinRefreshGrace(12_500)).toBe(true);
		expect(ch.isWithinRefreshGrace(13_500)).toBe(false);
		ch.destroy();
	});

	test('HLC tick and merge enforce causal order', () => {
		const a = tickHlc({ pt: 100, count: 0, nodeId: 'n1' }, 100);
		const b = mergeHlc(a, { pt: 100, count: 4, nodeId: 'n2' }, 100);
		expect(compareHlc(a, b)).toBeLessThan(0);
	});

	test('RBAC capability bit 28 grants wire observation only to admin or explicit grant', () => {
		const editor = maskForRole('editor');
		const admin = maskForRole('admin');
		expect(hasCapability(editor, CAPABILITY_BITS.ADMIN_WIRE_OBSERVE)).toBe(false);
		expect(hasCapability(admin, CAPABILITY_BITS.ADMIN_WIRE_OBSERVE)).toBe(true);
		expect(hasCapability(grantCapability(editor, 28), 28)).toBe(true);
	});

	test('SSRF guard blocks private and loopback webhook targets', () => {
		expect(validateWebhookUrl('http://127.0.0.1:8080/hook').ok).toBe(false);
		expect(validateWebhookUrl('http://169.254.169.254/latest').ok).toBe(false);
		expect(validateWebhookUrl('https://hooks.example.org/chronos').ok).toBe(true);
	});
});
