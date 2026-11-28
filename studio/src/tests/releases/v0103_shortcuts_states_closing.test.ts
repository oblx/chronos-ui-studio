import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import {
	CANONICAL_SHORTCUTS, canonicalizeChordString, computeDagNodeStats, computeHumanScaledDurationMs,
	findShortcutById, formatShortcutBadge, getEffectiveShortcuts, isEditableInputTarget,
	normalizeKeyboardEventChord, resolveShortcutForEvent, validateShortcutRegistry, VERSION
} from '@chronos-ui/svelte';
import { STUDIO_TOOL_REGISTRY } from '@studio/core/engine';
import { handleBuilderMcpRpc } from '@studio/mcp';
import { runStaticAudit } from '@studio/workers/qa_audit';
import { getSprintTimerStatus, startFreshSprintTimer } from '@studio/workers/qa_timer';

describe('v0.1.3 Declarative Shortcut Registry & Ctrl/Cmd+K Global Search', () => {
	it('registers 13 zero-collision shortcuts with Ctrl/Cmd+K Global Search and Ctrl/Cmd+Shift+H HUD toggle', () => {
		expect(VERSION).toBe('0.1.3');
		expect(CANONICAL_SHORTCUTS.length).toBe(13);
		const validation = validateShortcutRegistry(CANONICAL_SHORTCUTS);
		expect(validation.valid).toBe(true);
		expect(validation.collisions.length).toBe(0);

		const globalSearch = findShortcutById('global-search');
		expect(globalSearch?.chord).toBe('Ctrl+K');
		expect(globalSearch?.intent).toBe('UI_OPEN_MODAL');
		expect(globalSearch?.allowInInput).toBe(true);

		const hudToggle = findShortcutById('toggle-studio-chrome');
		expect(hudToggle?.chord).toBe('Ctrl+Shift+H');
		expect(hudToggle?.intent).toBe('UI_TOGGLE_STUDIO_CHROME');
		expect(hudToggle?.allowInInput).toBe(true);

		expect(formatShortcutBadge('global-search', {}, false)).toBe('Ctrl+K');
		expect(formatShortcutBadge('toggle-studio-chrome', {}, true)).toBe('Cmd+Shift+H');
	});

	it('normalizes chords, guards editable input fields, and rejects colliding custom overrides', () => {
		expect(canonicalizeChordString('ctrl+shift+h')).toBe('Ctrl+Shift+H');
		expect(normalizeKeyboardEventChord({ key: 'k', ctrlKey: true })).toBe('Ctrl+K');
		expect(normalizeKeyboardEventChord({ key: ',', metaKey: true })).toBe('Ctrl+,');

		const inputTarget = { tagName: 'INPUT' } as unknown as EventTarget;
		const textareaTarget = { tagName: 'TEXTAREA' } as unknown as EventTarget;
		expect(isEditableInputTarget(inputTarget)).toBe(true);
		const kMatch = resolveShortcutForEvent({ key: 'k', ctrlKey: true, target: inputTarget });
		expect(kMatch?.id).toBe('global-search');
		const bBlocked = resolveShortcutForEvent({ key: 'b', ctrlKey: true, target: inputTarget }, { studioChromeOpen: true });
		expect(bBlocked).toBeNull();
		const escMatch = resolveShortcutForEvent({ key: 'Escape', target: textareaTarget });
		expect(escMatch?.id).toBe('dismiss-overlay');

		const colliding = getEffectiveShortcuts({ 'toggle-assistant': 'Ctrl+K' });
		const badVal = validateShortcutRegistry(colliding);
		expect(badVal.valid).toBe(false);
		expect(badVal.collisions.length).toBe(1);
	});
});

describe('v0.1.3 SVG-Native 5-State Cornered Controls & Static Audit Guard', () => {
	it('renders SVG contour + focus-halo paths inside UiVectorBorder with zero rectangular CSS borders', () => {
		const vectorSrc = readFileSync('packages/chronos-ui/src/atoms/UiVectorBorder.svelte', 'utf8');
		expect(vectorSrc).toContain('data-ui-contour-path="true"');
		expect(vectorSrc).toContain('data-ui-focus-halo="true"');

		const stylesSrc = readFileSync('packages/chronos-ui/src/styles.css', 'utf8');
		expect(stylesSrc).toContain('border: 0 !important;');
		expect(stylesSrc).toContain('outline: none !important;');
		expect(stylesSrc).toContain('box-shadow: none !important;');
		expect(stylesSrc).toContain('.ui-ctl:focus-visible .ui-vector-focus-halo');

		const violations = runStaticAudit(process.cwd(), { full: false });
		expect(violations.filter((v) => v.rule === 'NO_RECTANGULAR_BORDER_ON_CORNERED_CTL').length).toBe(0);
	});
});

describe('v0.1.3 True-Ratio Human Time-Scale Calibration & Live Hop Protection', () => {
	it('preserves 4.0x LINEAR ratio (2500x -> 10000x) and >= 1.6x LOGARITHMIC separation without meta-intent dilution', () => {
		const lin2500 = computeHumanScaledDurationMs(0.15, { multiplier: 2500, curve: 'LINEAR' });
		const lin10000 = computeHumanScaledDurationMs(0.15, { multiplier: 10000, curve: 'LINEAR' });
		expect(lin2500).toBe(375);
		expect(lin10000).toBe(1500);
		expect(lin10000 / lin2500).toBeGreaterThanOrEqual(3.8);

		for (const realMs of [0.05, 0.15, 0.5]) {
			const log2500 = computeHumanScaledDurationMs(realMs, { multiplier: 2500, curve: 'LOGARITHMIC' });
			const log10000 = computeHumanScaledDurationMs(realMs, { multiplier: 10000, curve: 'LOGARITHMIC' });
			expect(log10000 / log2500).toBeGreaterThanOrEqual(1.6);
		}
		expect(computeHumanScaledDurationMs(120, { multiplier: 25000, curve: 'LOGARITHMIC' })).toBeLessThanOrEqual(4000);

		const stats = computeDagNodeStats([
			{ seq: 1, envelopeId: 'e1', spine: 'CLIENT_DAG', tier: 'TIER_0_LOCAL_UI', kind: 'UI_COMMIT_NODE', origin: 'ASSISTANT_CHAT', timestamp: 1, stageMs: 0.18, realDurationMs: 0.18, ok: true, summary: 'commit' },
			{ seq: 2, envelopeId: 'e2', spine: 'CLIENT_DAG', tier: 'TIER_0_LOCAL_UI', kind: 'UI_SET_WIRE_TIMESCALE', origin: 'USER', timestamp: 2, stageMs: 0.005, realDurationMs: 0.005, ok: true, summary: 'scale' }
		], true);
		expect(stats.get('C1_VALIDATE')?.avgMs).toBeCloseTo(0.18, 4);
		expect(stats.get('USER_UI')?.avgMs).toBe(0);
	});
});

describe('v0.1.3 52-Tool MCP Parity & Sprint Timer Atomic Reset', () => {
	it('exposes 52 MCP tools including ui_list_shortcuts and ui_open_global_search and resets sprint timer atomically', async () => {
		expect(STUDIO_TOOL_REGISTRY.length).toBe(52);
		const listRes = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
		const tools = (listRes?.result as unknown as { tools: { name: string }[] }).tools;
		expect(tools.length).toBe(52);

		const scRes = await handleBuilderMcpRpc({
			jsonrpc: '2.0', id: 2, method: 'tools/call',
			params: { name: 'ui_list_shortcuts', arguments: { projectId: 'proj-genesis' } }
		});
		const scPayload = (scRes?.result as unknown as { structured: { canonicalShortcuts: unknown[]; validation: { valid: boolean } } }).structured;
		expect(scPayload.canonicalShortcuts.length).toBe(13);
		expect(scPayload.validation.valid).toBe(true);

		const searchRes = await handleBuilderMcpRpc({
			jsonrpc: '2.0', id: 3, method: 'tools/call',
			params: { name: 'ui_open_global_search', arguments: { query: 'Wireframe', category: 'COMMANDS' } }
		});
		const searchPayload = (searchRes?.result as unknown as { structured: { opened: boolean; clientIntents: { kind: string }[] } }).structured;
		expect(searchPayload.opened).toBe(true);
		expect(searchPayload.clientIntents[0]?.kind).toBe('UI_OPEN_MODAL');

		startFreshSprintTimer(25);
		const fresh = getSprintTimerStatus();
		expect(fresh.elapsedMs).toBeLessThan(150);
		expect(fresh.band).toBe('GREEN');
	});
});
