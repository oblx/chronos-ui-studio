import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
	buildCursorPackCss, BUILTIN_CURSOR_PACKS, clampControlConfig, clampHistoryLimit, clampTooltipInfoLevel,
	createHudBootChoreographer, createModalLifecycleEngine, CSS_CURSOR_STATES, CURSOR_CALIBRATED_HOTSPOTS,
	DEFAULT_CONTROL_CONFIG, HISTORY_LIMIT_BOUNDS, HUD_BOOT_ZONE_ORDER, resolveThemeCursorPalette,
	resolveTooltipTierLabel, shouldDisplayTooltip, THEME_PACKS, VERSION
} from '@chronos-ui/svelte';
import { STUDIO_TOOL_REGISTRY } from '@studio/core/engine';
import { createHistoryRing, historyIdbStore } from '@studio/lib';
import { handleBuilderMcpRpc } from '@studio/mcp';
import { emitProjectCssTokens } from '@studio/plugins';

const ROOT = process.cwd();
const countFiles = (relDir: string): number =>
	readdirSync(join(ROOT, relDir)).filter((n) => !n.startsWith('.') && statSync(join(ROOT, relDir, n)).isFile()).length;

describe('v0.1.1 Bespoke 21-State CSS Cursor Silhouettes', () => {
	test('renders 21 distinct 32x32 silhouettes across 4 differentiated packs with zero var(-- tokens', () => {
		expect(VERSION).toBe('0.1.1');
		expect(BUILTIN_CURSOR_PACKS.length).toBe(4);
		const defaultByPack = new Set<string>();
		const crosshairByPack = new Set<string>();
		for (const pack of BUILTIN_CURSOR_PACKS) {
			const uris = new Set<string>();
			for (const st of CSS_CURSOR_STATES) {
				const asset = pack.states[st];
				expect(asset.assetDataUrl.startsWith('data:image/svg+xml,')).toBe(true);
				expect(asset.assetDataUrl).not.toContain('var(--');
				expect(decodeURIComponent(asset.assetDataUrl)).toContain('width="32"');
				expect(decodeURIComponent(asset.assetDataUrl)).toContain('height="32"');
				const [hx, hy] = CURSOR_CALIBRATED_HOTSPOTS[st];
				expect(asset.hotspotX).toBe(hx);
				expect(asset.hotspotY).toBe(hy);
				uris.add(asset.assetDataUrl);
			}
			expect(uris.size).toBe(21);
			defaultByPack.add(pack.states.default.assetDataUrl);
			crosshairByPack.add(pack.states.crosshair.assetDataUrl);
			const css = buildCursorPackCss(pack, resolveThemeCursorPalette(THEME_PACKS[0]));
			expect(css).not.toContain('var(--');
			expect(css).toContain('data-ui-cursor="grab"');
			expect(css).toContain('data-ui-cursor="text"');
		}
		expect(defaultByPack.size).toBe(4);
		expect(crosshairByPack.size).toBe(4);
		const emitted = emitProjectCssTokens({ id: 'p-css', slug: 'demo', name: 'Demo', description: '', themeId: 'obsidian-brass', cornerMode: 'CHAMFER', activeCursorPackId: BUILTIN_CURSOR_PACKS[0].uuid, activeRevisionId: 'r1', nodes: [], buildConfig: { protocol: 'https', basePath: '/', apiEndpoint: '/api', secretRefs: [], inlineBundle: false }, updatedAt: Date.now() }).content;
		expect(emitted).toContain('--ui-scroll-thumb:');
		expect(emitted).toContain('--ui-state-hover-bg:');
		expect(emitted).toContain('--ui-stagger-zone-ms:');
		expect(emitted).toContain('Control Config:');
	});
});

describe('v0.1.1 IndexedDB-Only Undo/Redo History Ring (default 5, max 128)', () => {
	test('enforces default 5, 1..128 bounds, oldest eviction, redo clearing, and persistence', async () => {
		expect(HISTORY_LIMIT_BOUNDS.defaultLimit).toBe(5);
		expect(HISTORY_LIMIT_BOUNDS.maxLimit).toBe(128);
		expect(clampHistoryLimit(0)).toBe(1);
		expect(clampHistoryLimit(512)).toBe(128);
		const ring = createHistoryRing();
		expect(ring.limit).toBe(5);
		expect(ring.canUndo).toBe(false);
		expect(ring.canRedo).toBe(false);
		const mk = (id: string) => [{ id, type: 'UiMetricCard' as const, zone: 'WORLD_CANVAS' as const, label: id, lifecycle: 'COMMITTED' as const, props: {} }];
		for (let i = 0; i < 7; i += 1) ring.push(mk(`n-${i}`));
		expect(ring.undoStack.length).toBe(5);
		expect(ring.undoStack[0][0].id).toBe('n-2');
		const undone = ring.undo(mk('n-current'));
		expect(undone?.[0].id).toBe('n-6');
		expect(ring.canRedo).toBe(true);
		expect(ring.redo(undone!)?.[0].id).toBe('n-current');
		expect(ring.setLimit(2)).toBe(2);
		expect(ring.undoStack.length).toBe(2);
		await historyIdbStore.save('proj-v011-test', { undoStack: ring.undoStack, redoStack: ring.redoStack, historyLimit: 2 });
		const loaded = await historyIdbStore.load('proj-v011-test');
		expect(loaded?.historyLimit).toBe(2);
		expect(loaded?.undoStack.length).toBe(2);
		await historyIdbStore.clear('proj-v011-test');
	});
});

describe('v0.1.1 4-Phase Modal Lifecycle & 250ms ASC HUD Boot Choreographer', () => {
	test('transitions modal FSM CLOSED -> OPENING -> OPEN -> CLOSING -> CLOSED with callbacks', () => {
		const events: string[] = [];
		const fsm = createModalLifecycleEngine({
			onPhaseChange: (p) => events.push(`phase:${p}`),
			onOpened: (id) => events.push(`opened:${id}`),
			onClosed: (id) => events.push(`closed:${id}`)
		});
		expect(fsm.phase).toBe('CLOSED');
		fsm.open('settings'); expect(fsm.phase).toBe('OPENING');
		fsm.markOpened(); expect(fsm.phase).toBe('OPEN');
		fsm.close(); expect(fsm.phase).toBe('CLOSING');
		fsm.markClosed(); expect(fsm.phase).toBe('CLOSED');
		expect(events).toEqual(['phase:OPENING', 'phase:OPEN', 'opened:settings', 'phase:CLOSING', 'phase:CLOSED', 'closed:settings']);
	});

	test('reveals all 9 HUD zones strictly in ASC order and supports replay + reduced motion', async () => {
		const seen: string[] = [];
		const seq = createHudBootChoreographer({ intervalMs: 4, isReducedMotion: () => false, onRevealZone: (z) => seen.push(z) });
		seq.replay(4);
		await new Promise((r) => setTimeout(r, 80));
		expect(seen).toEqual([...HUD_BOOT_ZONE_ORDER]);
		expect(seq.hasCompletedOnce()).toBe(true);
		const instantSeen: string[] = [];
		const fast = createHudBootChoreographer({ intervalMs: 250, isReducedMotion: () => true, onRevealZone: (z) => instantSeen.push(z) });
		fast.replay(250);
		expect(instantSeen).toEqual([...HUD_BOOT_ZONE_ORDER]);
	});
});

describe('v0.1.1 Tooltip infoLevel, Control Config, MCP Parity & Decongestion', () => {
	test('filters tooltips by infoLevel (0..100), validates controls, MCP 1:1 parity, and folder caps <= 8', async () => {
		expect(clampTooltipInfoLevel(-10)).toBe(0);
		expect(clampTooltipInfoLevel(140)).toBe(100);
		expect(resolveTooltipTierLabel(0)).toBe('Silent');
		expect(resolveTooltipTierLabel(20)).toBe('Essential');
		expect(resolveTooltipTierLabel(50)).toBe('Standard');
		expect(resolveTooltipTierLabel(75)).toBe('Guided');
		expect(resolveTooltipTierLabel(100)).toBe('Verbose');
		expect(shouldDisplayTooltip(15, 20)).toBe(true);
		expect(shouldDisplayTooltip(85, 20)).toBe(false);
		expect(shouldDisplayTooltip(85, 100)).toBe(true);
		expect(shouldDisplayTooltip(10, 0)).toBe(false);
		const cfg = clampControlConfig({ buttonConfig: { variant: 'SOLID', density: 'COMPACT' }, formConfig: { surfaceStyle: 'RECESSED' } }, DEFAULT_CONTROL_CONFIG);
		expect(cfg.buttonConfig.variant).toBe('SOLID');
		expect(cfg.formConfig.surfaceStyle).toBe('RECESSED');
		const css = readFileSync(join(ROOT, 'packages/chronos-ui/src/styles.css'), 'utf8');
		expect(css).toContain('scrollbar-width: thin');
		expect(css).toContain('.ui-ctl:hover');
		expect(css).toContain('.ui-modal-morph[data-modal-phase="CLOSING"]');
		const listRes = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
		const mcpTools = ((listRes.result as { tools: readonly { name: string }[] }).tools).map((t) => t.name);
		for (const name of ['ui_configure_controls', 'ui_set_history_limit', 'ui_undo', 'ui_redo', 'ui_replay_hud_sequence', 'ui_set_tooltip_info_level']) {
			expect(mcpTools).toContain(name);
			expect(STUDIO_TOOL_REGISTRY.some((t) => t.name === name)).toBe(true);
		}
		expect(mcpTools.length).toBe(STUDIO_TOOL_REGISTRY.length);
		for (const dir of ['packages/chronos-ui/src/machines', 'packages/chronos-ui/src/atoms', 'packages/chronos-ui/src/molecules', 'studio/src/client/canvas', 'studio/src/core/engine', 'studio/src/server', 'studio/src/workers']) {
			expect(countFiles(dir)).toBeLessThanOrEqual(8);
		}
	});
});
