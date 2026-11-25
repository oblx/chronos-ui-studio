import { describe, expect, test } from 'bun:test';
import {
	buildCursorPackCss, BUILTIN_CURSOR_PACKS, computeSafeCorridor, createHeadlessWireBroker,
	CSS_CURSOR_STATES, generateUuidV7, resolveThemeCursorPalette, SAFE_CORRIDOR_REM, THEME_PACKS, VERSION
} from '@chronos-ui/svelte';
import { STUDIO_LEFT_TABS, STUDIO_RIGHT_TABS, STUDIO_SPOTLIGHT_STEPS } from '@studio/config';
import { createInitialStudioState, registerStudioIntentHandlers } from '@studio/client/state';
import { planLocalAssistantPrompt, STUDIO_TOOL_REGISTRY } from '@studio/core';
import { handleBuilderMcpRpc } from '@studio/mcp';
import { createStudioProject } from '@studio/server/routes/routes.projects';

describe('v0.0.11 concrete-hex 21-state cursor CSS engine (zero OS fallback)', () => {
	test('resolves concrete hex colors with zero var(--) tokens and valid 32x32 xmlns across all 21 states & 6 themes', () => {
		expect(VERSION).toBe('0.1.1');
		for (const theme of THEME_PACKS) {
			const palette = resolveThemeCursorPalette(theme);
			expect(palette.fillHex.startsWith('#')).toBe(true);
			expect(palette.strokeHex.startsWith('#')).toBe(true);
			expect(palette.accentHex.startsWith('#')).toBe(true);
			expect(palette.primaryHex.startsWith('#')).toBe(true);
			const css = buildCursorPackCss(BUILTIN_CURSOR_PACKS[0], palette);
			expect(css).toContain('html, body, #app { min-height: 100vh; width: 100%; }');
			expect(css).toContain('[data-ui-root]');
			expect(css).toContain('.cursor-pointer');
			expect(css).toContain('.cursor-default');
			const dataUris = css.match(/data:image\/svg\+xml,[^")]+/g) ?? [];
			expect(dataUris.length).toBeGreaterThanOrEqual(CSS_CURSOR_STATES.length);
			for (const uri of dataUris) {
				expect(uri).not.toContain('var(--');
				expect(uri).not.toContain('#');
				expect(uri).toContain('xmlns=%22http://www.w3.org/2000/svg%22');
				expect(uri).toContain('width=%2232%22');
				expect(uri).toContain('height=%2232%22');
				expect(uri).toContain('%23');
			}
		}
		const darkCss = buildCursorPackCss(BUILTIN_CURSOR_PACKS[0], resolveThemeCursorPalette(THEME_PACKS[0]));
		const lightTheme = THEME_PACKS.find((t) => t.polarity === 'light')!;
		const lightCss = buildCursorPackCss(BUILTIN_CURSOR_PACKS[0], resolveThemeCursorPalette(lightTheme));
		expect(darkCss).not.toBe(lightCss);
	});
});

describe('v0.0.11 Minimal Calm launch, unified edge rails, safe corridor & atomic Reject All', () => {
	test('boots in Minimal Calm posture with unified LEFT_EDGE (build|zones|blueprints|tour) & RIGHT_EDGE (inspector|themes|export)', () => {
		const initial = createInitialStudioState();
		expect(initial.studioChromeVisible).toBe(false);
		expect(initial.leftDrawer.open).toBe(false);
		expect(initial.leftDrawer.activeTab).toBe('build');
		expect(initial.rightDrawer.open).toBe(false);
		expect(initial.rightDrawer.activeTab).toBe('inspector');
		expect(STUDIO_LEFT_TABS.map((t) => t.id)).toEqual(['build', 'zones', 'blueprints', 'tour']);
		expect(STUDIO_RIGHT_TABS.map((t) => t.id)).toEqual(['inspector', 'themes', 'export']);
		expect(STUDIO_SPOTLIGHT_STEPS.length).toBe(7);

		const calmCorridor = computeSafeCorridor(false, 1440, 900);
		const hudCorridor = computeSafeCorridor(true, 1440, 900);
		expect(SAFE_CORRIDOR_REM.calmBottom).toBeGreaterThanOrEqual(5.25);
		expect(SAFE_CORRIDOR_REM.hudBottom).toBeGreaterThanOrEqual(8.75);
		expect(calmCorridor.bottomPx).toBeGreaterThanOrEqual(84);
		expect(hudCorridor.bottomPx).toBeGreaterThanOrEqual(140);
		expect(calmCorridor.sidePx).toBeGreaterThanOrEqual(68);
	});

	test('selecting a canvas node opens RIGHT_EDGE->Inspector, dedups staged spawns, and UI_REJECT_ALL_STAGED clears staging atomically', () => {
		const broker = createHeadlessWireBroker(createInitialStudioState());
		registerStudioIntentHandlers(broker);
		const id1 = generateUuidV7();
		const id2 = generateUuidV7();
		const id3 = generateUuidV7();
		broker.dispatch('UI_SPAWN_NODE', { node: { id: id1, type: 'UiMetricCard', zone: 'WORLD_CANVAS', label: 'Duplicate Card', lifecycle: 'STAGING', props: { value: '1' } } });
		broker.dispatch('UI_SPAWN_NODE', { node: { id: id2, type: 'UiMetricCard', zone: 'WORLD_CANVAS', label: 'Duplicate Card', lifecycle: 'STAGING', props: { value: '1' } } });
		broker.dispatch('UI_SPAWN_NODE', { node: { id: id3, type: 'UiProgressGauge', zone: 'WORLD_CANVAS', label: 'Committed Gauge', lifecycle: 'COMMITTED', props: { value: 80 } } });
		const projBefore = broker.state.projects.find((p) => p.id === broker.state.activeProjectId)!;
		expect(projBefore.nodes.filter((n) => n.lifecycle === 'STAGING').length).toBe(1);

		broker.dispatch('UI_SELECT_NODE', { nodeId: id3 });
		expect(broker.state.selectedNodeId).toBe(id3);
		expect(broker.state.rightDrawer.open).toBe(true);
		expect(broker.state.rightDrawer.activeTab).toBe('inspector');

		broker.dispatch('UI_REJECT_ALL_STAGED', {});
		const projAfter = broker.state.projects.find((p) => p.id === broker.state.activeProjectId)!;
		expect(projAfter.nodes.filter((n) => n.lifecycle !== 'COMMITTED').length).toBe(0);
		expect(projAfter.nodes.length).toBe(1);
		expect(projAfter.nodes[0]?.id).toBe(id3);

		broker.dispatch('UI_WORKSPACE_RESET_DEFAULT', {});
		expect(broker.state.studioChromeVisible).toBe(false);
		expect(broker.state.leftDrawer.open).toBe(false);
		expect(broker.state.rightDrawer.open).toBe(false);
		broker.destroy();
	});
});

describe('v0.0.11 40-tool MCP parity & ui_reject_all_staged execution', () => {
	test('registers 42 unified tools, plans /reject prompts, and executes ui_reject_all_staged via Builder MCP', async () => {
		expect(STUDIO_TOOL_REGISTRY.length).toBe(48);
		const listRes = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 1101, method: 'tools/list' });
		const tools = (listRes.result as unknown as { tools: { name: string }[] }).tools;
		expect(tools.length).toBe(48);
		expect(tools.some((t) => t.name === 'ui_reject_all_staged')).toBe(true);
		expect(planLocalAssistantPrompt('/reject').actions[0]?.tool).toBe('ui_reject_all_staged');
		expect(planLocalAssistantPrompt('reject all staged nodes').actions[0]?.tool).toBe('ui_reject_all_staged');

		const proj = await createStudioProject({
			name: 'v011 Reject Spec',
			nodes: [
				{ id: generateUuidV7(), type: 'UiMetricCard', zone: 'WORLD_CANVAS', label: 'Staged A', lifecycle: 'STAGING', props: {} },
				{ id: generateUuidV7(), type: 'UiSection', zone: 'WORLD_CANVAS', label: 'Staged B', lifecycle: 'BUILDING', props: {} },
				{ id: generateUuidV7(), type: 'UiBadge', zone: 'TOP_LEFT', label: 'Keep Me', lifecycle: 'COMMITTED', props: {} }
			]
		});
		const rejRes = await handleBuilderMcpRpc({
			jsonrpc: '2.0', id: 1102, method: 'tools/call',
			params: { name: 'ui_reject_all_staged', arguments: { projectId: proj.id } }
		});
		expect(rejRes.error).toBeUndefined();
		const payload = JSON.parse((rejRes.result as unknown as { content: { text: string }[] }).content[0].text) as { rejectedCount: number; project: { nodes: { label: string }[] } };
		expect(payload.rejectedCount).toBe(2);
		expect(payload.project.nodes.map((n) => n.label)).toEqual(['Keep Me']);
	});
});
