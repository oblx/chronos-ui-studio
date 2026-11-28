import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	buildCursorPackCss, buildGraphEdgePath, BUILTIN_CURSOR_PACKS, buildVectorCursorDataUrl, clampStudioDefaults, COMPONENT_CATALOG,
	computeGraphFitTransform, computeGraphLayout, computeHumanScaledDurationMs, computeMarqueeDurationMs,
	computePerceptualFloorMs, CSS_CURSOR_STATES, CURSOR_CALIBRATED_HOTSPOTS, CURSOR_DRAG_TARGET_STATES,
	DEFAULT_STUDIO_DEFAULTS, formatSubMsDuration, GRAPH_EDGE_ROUTINGS, LANE_HEADER_BAND_PX, LANE_HEADER_PAD_PX,
	resolveThemeCursorPalette, STUDIO_KNOB_DEFAULTS, THEME_PACKS, UI_FRAME_SHAPES, VERSION,
	type CursorPackStyleId
} from '@chronos-ui/svelte';
import * as graphSub from '@chronos-ui/svelte/graph';
import { planLocalAssistantPrompt, STUDIO_TOOL_REGISTRY } from '@studio/core';
import { handleBuilderMcpRpc } from '@studio/mcp';
import { emitProjectCssTokens } from '@studio/plugins';
import { createStudioProject } from '@studio/server/routes/routes.projects';

const ROOT = process.cwd();
const DRAG_SET = new Set<string>(CURSOR_DRAG_TARGET_STATES);

describe('v0.1.2 Frameless Tip-Clean 21-State Cursors', () => {
	test('emits zero decorative frames on 17 non-drag states, tip-clean pointers, and gated drag-target frames', () => {
		expect(VERSION).toBe('0.1.3');
		const basePalette = resolveThemeCursorPalette(THEME_PACKS[0]);
		for (const pack of BUILTIN_CURSOR_PACKS) {
			const style = pack.slug as CursorPackStyleId;
			for (const st of CSS_CURSOR_STATES) {
				const uriOn = buildVectorCursorDataUrl(st, basePalette.fillHex, basePalette.strokeHex, basePalette.accentHex, basePalette.errorHex, style, true);
				const uriOff = buildVectorCursorDataUrl(st, basePalette.fillHex, basePalette.strokeHex, basePalette.accentHex, basePalette.errorHex, style, false);
				const svgOn = decodeURIComponent(uriOn.slice('data:image/svg+xml,'.length));
				const svgOff = decodeURIComponent(uriOff.slice('data:image/svg+xml,'.length));
				expect(svgOn).not.toContain('var(--');
				expect(svgOn).toContain('width="32"');
				expect(svgOn).toContain('height="32"');
				if (DRAG_SET.has(st)) {
					expect(svgOn).toContain('data-drag-target-frame="true"');
					expect(svgOff).not.toContain('data-drag-target-frame="true"');
				} else {
					expect(svgOn).not.toContain('data-drag-target-frame');
				}
			}
			const cssOff = buildCursorPackCss(pack, { ...basePalette, dragTargetFrames: false });
			expect(cssOff).not.toContain('data-drag-target-frame');
		}
		for (const tipState of ['default', 'progress', 'context-menu'] as const) {
			const [hx, hy] = CURSOR_CALIBRATED_HOTSPOTS[tipState];
			const uri = buildVectorCursorDataUrl(tipState, basePalette.fillHex, basePalette.strokeHex, basePalette.accentHex, basePalette.errorHex, 'cyber-reticle', true);
			const svg = decodeURIComponent(uri.slice('data:image/svg+xml,'.length));
			const m = /d="M\s*([0-9.]+)\s+([0-9.]+)/.exec(svg);
			expect(m).not.toBeNull();
			expect(Number(m![1])).toBeGreaterThanOrEqual(hx);
			expect(Number(m![2])).toBeGreaterThanOrEqual(hy);
		}
	});
});

describe('v0.1.2 Human Time-Scale Engine, Sub-ms Formatting & Pure-CSS Marquee', () => {
	test('scales measured durations monotonically for LINEAR & LOGARITHMIC curves and never formats 0.0ms', () => {
		const floor60 = computePerceptualFloorMs(60, 12);
		expect(floor60).toBe(200);
		const linSlow = computeHumanScaledDurationMs(0.05, { multiplier: 2500, curve: 'LINEAR', refreshRateHz: 60 });
		const linFast = computeHumanScaledDurationMs(0.5, { multiplier: 2500, curve: 'LINEAR', refreshRateHz: 60 });
		expect(linFast).toBeGreaterThan(linSlow);
		expect(linSlow).toBeGreaterThanOrEqual(floor60);
		const logSlow = computeHumanScaledDurationMs(0.05, { multiplier: 2500, curve: 'LOGARITHMIC', refreshRateHz: 60 });
		const logFast = computeHumanScaledDurationMs(0.5, { multiplier: 2500, curve: 'LOGARITHMIC', refreshRateHz: 60 });
		expect(logFast).toBeGreaterThan(logSlow);
		const scaled10k = computeHumanScaledDurationMs(0.2, { multiplier: 10000, curve: 'LINEAR', refreshRateHz: 60 });
		const scaled2500 = computeHumanScaledDurationMs(0.2, { multiplier: 2500, curve: 'LINEAR', refreshRateHz: 60 });
		expect(scaled10k).toBeGreaterThan(scaled2500);
		expect(formatSubMsDuration(0.001)).toBe('< 0.01ms');
		expect(formatSubMsDuration(0.043)).toBe('0.04ms');
		expect(formatSubMsDuration(1.25)).toBe('1.25ms');
		expect(formatSubMsDuration(0)).not.toBe('0.0ms');
		const fastMarquee = computeMarqueeDurationMs(120, 96, 0.15);
		const slowMarquee = computeMarqueeDurationMs(120, 24, 0.15);
		expect(slowMarquee).toBeGreaterThan(fastMarquee);
		const css = readFileSync(join(ROOT, 'packages/chronos-ui/src/styles.css'), 'utf8');
		expect(css).toContain('@keyframes ui-marquee-pingpong');
		expect(css).toContain('.ui-marquee-track');
	});
});

describe('v0.1.2 Reusable UiEventGraph Organism, Subpath & Zero-Collision Layout', () => {
	test('computes zero-collision lane geometry, supports 14 shapes & 3 routings, and exports ./graph subpath', () => {
		expect(typeof graphSub.computeGraphLayout).toBe('function');
		expect(COMPONENT_CATALOG.some((c) => c.type === 'UiEventGraph')).toBe(true);
		const lanes = [
			{ id: 'emit', title: 'EMITTERS', order: 0 },
			{ id: 'tx', title: 'TRANSPORT', order: 1 },
			{ id: 'srv', title: 'SERVER_DAG', order: 2 }
		];
		const nodes = UI_FRAME_SHAPES.slice(0, 6).map((shape, idx) => ({
			uuid: `n-${idx}`, laneId: lanes[idx % 3].id, label: `Node ${idx}`, shape, status: 'NOMINAL' as const, portsIn: 1, portsOut: 1
		}));
		const layout = computeGraphLayout(lanes, nodes);
		for (const ln of layout.nodes) {
			expect(ln.y).toBeGreaterThanOrEqual(LANE_HEADER_BAND_PX + LANE_HEADER_PAD_PX);
			for (const pl of layout.lanes) {
				expect(ln.y).toBeGreaterThan(pl.headerRect.y + pl.headerRect.h);
			}
		}
		for (const routing of GRAPH_EDGE_ROUTINGS) {
			const d = buildGraphEdgePath(layout.nodes[0], layout.nodes[1], routing);
			expect(d.startsWith('M ')).toBe(true);
		}
		const fit = computeGraphFitTransform(layout.bounds, { width: 800, height: 320 });
		expect(fit.scale).toBeGreaterThan(0);
		const plan = planLocalAssistantPrompt('add a live event graph with hexagon nodes');
		expect(plan.actions[0]?.tool).toBe('ui_spawn_node');
		expect(plan.actions[0]?.args.type).toBe('UiEventGraph');
		expect(plan.actions[0]?.args.shape).toBe('HEXAGON');
	});
});

describe('v0.1.2 50-Tool MCP Parity & Real-Number Knob Persistence', () => {
	test('executes ui_configure_graph, ui_set_wire_timescale, ui_spawn_node(UiEventGraph) and emits CSS tokens', async () => {
		expect(STUDIO_TOOL_REGISTRY.length).toBe(52);
		const listRes = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 1201, method: 'tools/list' });
		const tools = (listRes.result as { tools: readonly { name: string }[] }).tools.map((t) => t.name);
		expect(tools.length).toBe(52);
		expect(tools).toContain('ui_configure_graph');
		expect(tools).toContain('ui_set_wire_timescale');
		const proj = await createStudioProject({ name: 'v012 Graph & TimeScale Spec' });
		const tsRes = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 1202, method: 'tools/call', params: { name: 'ui_set_wire_timescale', arguments: { projectId: proj.id, multiplier: 10000, curve: 'LOGARITHMIC' } } });
		expect(tsRes.error).toBeUndefined();
		const grRes = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 1203, method: 'tools/call', params: { name: 'ui_configure_graph', arguments: { projectId: proj.id, routing: 'ORTHOGONAL', packetSizePx: 8 } } });
		expect(grRes.error).toBeUndefined();
		const spawnRes = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 1204, method: 'tools/call', params: { name: 'ui_spawn_node', arguments: { projectId: proj.id, type: 'UiEventGraph', zone: 'WORLD_CANVAS', label: 'Pipeline Graph', shape: 'HEXAGON' } } });
		expect(spawnRes.error).toBeUndefined();
		const clamped = clampStudioDefaults({ wireTimeScaleMultiplier: 10000, wireTimeScaleCurve: 'LOGARITHMIC', marqueeSpeedPxPerSec: 72, graphRouting: 'ORTHOGONAL', cursorDragTargetFrames: false }, DEFAULT_STUDIO_DEFAULTS);
		expect(clamped.wireTimeScaleMultiplier).toBe(10000);
		expect(clamped.cursorDragTargetFrames).toBe(false);
		expect(STUDIO_KNOB_DEFAULTS.wireTimeScaleMultiplier).toBe(2500);
		const css = emitProjectCssTokens({ ...proj, studioDefaults: clamped }).content;
		expect(css).toContain('--ui-wire-timescale: 10000');
		expect(css).toContain('--ui-marquee-speed: 72');
	});
});
