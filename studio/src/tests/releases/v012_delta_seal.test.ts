import { describe, expect, test } from 'bun:test';
import {
	buildMotionCssVars, buildWireTraceKey, clamp, clampStageCamera, coalesceBurstTraces, computeDagNodeStats,
	computeSafeCorridorFromRects, createModalMachine, createStagePanZoomCoalescer, createUiWireBroker,
	DEFAULT_CHAMFER_TUPLE, filterTracesByDagNode, fitNodesToSafeCorridor, getActiveMotionSensory,
	isPointerInsideRect, MOTION_PROFILE_SPECS, resolveControlSurface, setActiveMotionProfile,
	setActiveMotionSensory, VERSION, WIRE_DAG_NODES, type WireTraceRecord
} from '@chronos-ui/svelte';
import { createInitialStudioState, registerStudioIntentHandlers } from '@studio/client/state';
import { STUDIO_SPOTLIGHT_STEPS } from '@studio/config';
import { planLocalAssistantPrompt } from '@studio/core';
import { STUDIO_TOOL_REGISTRY } from '@studio/core/engine';
import { handleBuilderMcpRpc } from '@studio/mcp';

const g = globalThis as Record<string, unknown>;
if (typeof g.$state !== 'function') g.$state = Object.assign(<T>(v: T) => v, { raw: <T>(v: T) => v });

function makeTrace(seq: number, kind: WireTraceRecord['kind'], origin: WireTraceRecord['origin'], stageMs = 1): WireTraceRecord {
	return { seq, envelopeId: `env-${seq}`, spine: 'CLIENT_DAG', kind, tier: 'TIER_0_LOCAL_UI', origin, stageMs, ok: true, timestamp: Date.now(), summary: 'ok' };
}

describe('v0.0.12 ADHD-friendly global motion system (CALM_SLOW default)', () => {
	test('defaults to CALM_SLOW tokens and updates CSS vars via UI_SET_MOTION_PROFILE', () => {
		expect(VERSION).toBe('0.1.2');
		setActiveMotionProfile('CALM_SLOW');
		setActiveMotionSensory({ ambientPulsesEnabled: true, signalFlowSpeed: 1, modalMorphEnabled: true, microDetentsEnabled: true });
		const def = getActiveMotionSensory();
		expect(def.profile).toBe('CALM_SLOW');
		expect(MOTION_PROFILE_SPECS.CALM_SLOW.microMs).toBe(280);
		expect(MOTION_PROFILE_SPECS.CALM_SLOW.baseMs).toBe(440);
		expect(MOTION_PROFILE_SPECS.CALM_SLOW.morphMs).toBe(580);
		expect(MOTION_PROFILE_SPECS.CALM_SLOW.ambientMs).toBe(4200);
		const vars = buildMotionCssVars(def);
		expect(vars['--ui-dur-base']).toBe('440ms');
		expect(vars['--ui-ease-calm']).toBe('cubic-bezier(0.16, 1, 0.3, 1)');

		const broker = createUiWireBroker(createInitialStudioState());
		registerStudioIntentHandlers(broker);
		broker.dispatch('UI_SET_MOTION_PROFILE', { profile: 'REDUCED_ZERO', ambientPulsesEnabled: false, signalFlowSpeed: 0.25 });
		const updated = getActiveMotionSensory();
		expect(updated.profile).toBe('REDUCED_ZERO');
		expect(updated.ambientPulsesEnabled).toBe(false);
		expect(updated.signalFlowSpeed).toBe(0.25);
		expect(buildMotionCssVars(updated)['--ui-dur-base']).toBe('0ms');
		setActiveMotionProfile('CALM_SLOW');
		setActiveMotionSensory({ ambientPulsesEnabled: true, signalFlowSpeed: 1 });
	});
});

describe('v0.0.12 coalesced stage pan/zoom & safe-corridor framing', () => {
	test('100 consecutive pan ticks coalesce into 1 wire record with coalescedFrames === 100', () => {
		const broker = createUiWireBroker(createInitialStudioState());
		registerStudioIntentHandlers(broker);
		const liveSteps: number[] = [];
		const coalescer = createStagePanZoomCoalescer(
			{ panX: 0, panY: 0, zoom: 1 },
			(cam) => { liveSteps.push(cam.panX); },
			(commit) => { broker.dispatch('UI_STAGE_PAN_ZOOM', commit); }
		);
		for (let i = 0; i < 100; i += 1) coalescer.tickPan(1, 0.5);
		coalescer.flush();
		expect(liveSteps.length).toBe(100);
		const panTraces = broker.traces.filter((t) => t.kind === 'UI_STAGE_PAN_ZOOM');
		expect(panTraces.length).toBe(1);
		expect(panTraces[0]?.summary).toContain('100f');
		expect(broker.state.panX).toBe(100);
		expect(broker.state.panY).toBe(50);
	});

	test('fitNodesToSafeCorridor & isPointerInsideRect enforce stage framing and strict bounds', () => {
		const fit = fitNodesToSafeCorridor({ left: 0, top: 0, width: 1200, height: 900 }, { left: 72, top: 72, width: 1296, height: 650 }, 2);
		expect(fit.panX).toBe(0);
		expect(fit.panY).toBe(0);
		expect(fit.zoom).toBeLessThan(1);
		expect(fit.zoom).toBeGreaterThanOrEqual(0.5);
		const rect = { left: 72, top: 72, width: 1296, height: 744 };
		expect(isPointerInsideRect(500, 400, rect)).toBe(true);
		expect(isPointerInsideRect(12, 890, rect)).toBe(false);
	});
});

describe('v0.0.12 Modal Grow/Shrink state restoration, 2D Wire DAG & 42-tool MCP parity', () => {
	test('createModalMachine Grow/Shrink snapshots pre-expand geometry and restores bit-for-bit', () => {
		const m = createModalMachine();
		m.open({ id: 'wire' });
		const pre = { widthPx: 920, heightPx: 640, leftPx: 260, topPx: 130 };
		expect(m.isExpanded).toBe(false);
		m.toggleExpand(pre);
		expect(m.isExpanded).toBe(true);
		expect(m.restoreSnapshot).toEqual(pre);
		m.toggleExpand();
		expect(m.isExpanded).toBe(false);
		expect(m.restoreSnapshot).toEqual(pre);
	});

	test('2D Wire DAG topology computes 15 nodes, filters traces & coalesces consecutive bursts', () => {
		expect(WIRE_DAG_NODES.length).toBe(15);
		const traces: WireTraceRecord[] = [
			makeTrace(1, 'UI_STAGE_PAN_ZOOM', 'USER', 2),
			makeTrace(2, 'UI_STAGE_PAN_ZOOM', 'USER', 4),
			makeTrace(3, 'UI_STAGE_PAN_ZOOM', 'USER', 6),
			makeTrace(4, 'UI_SET_MOTION_PROFILE', 'MCP_TWIN', 1)
		];
		const stats = computeDagNodeStats(traces, true);
		expect(stats.get('USER_UI')?.count).toBe(3);
		expect(stats.get('TWIN_MCP')?.count).toBe(1);
		expect(filterTracesByDagNode(traces, 'TWIN_MCP').length).toBe(1);
		const rows = coalesceBurstTraces(traces);
		expect(rows.length).toBe(2);
		expect(rows[0]?.count).toBe(3);
		expect(rows[0]?.avgMs).toBe(4);
	});

	test('42-tool MCP registry, Tour Step 4 assistant drill & /motion slash command', async () => {
		expect(STUDIO_TOOL_REGISTRY.length).toBe(50);
		const listRes = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 1201, method: 'tools/list' });
		const tools = (listRes.result as unknown as { tools: { name: string }[] }).tools;
		expect(tools.length).toBe(50);
		const motionRes = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 1202, method: 'tools/call', params: { name: 'ui_set_motion_profile', arguments: { profile: 'BALANCED', signalFlowSpeed: 0.5 } } });
		expect(motionRes.error).toBeUndefined();
		const modalRes = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 1203, method: 'tools/call', params: { name: 'ui_modal_toggle_expand', arguments: { expanded: true } } });
		expect(modalRes.error).toBeUndefined();
		const plan = planLocalAssistantPrompt('/motion SNAPPY');
		expect(plan.actions[0]?.tool).toBe('ui_set_motion_profile');
		expect(STUDIO_SPOTLIGHT_STEPS[3]?.targetIds[0]).toBe('hud-assistant-dock');
		expect(STUDIO_SPOTLIGHT_STEPS[3]?.drillPrompt).toBe('Add Metric Card');
	});

	test('SSOT control surface, asymmetric drawer corridor, O(N) burst coalescing & MCP profile guard', async () => {
		expect(resolveControlSurface('STRAIGHT', DEFAULT_CHAMFER_TUPLE, 0.375)).toEqual({ tuple: ['STRAIGHT', 'STRAIGHT', 'STRAIGHT', 'STRAIGHT'], cutRem: 0, cutPx: 0, surfaceStyle: '' });
		expect(resolveControlSurface('ROUND', DEFAULT_CHAMFER_TUPLE, 0.375).surfaceStyle).toBe('border-radius: 0.375rem;');
		expect(resolveControlSurface('CHAMFER', DEFAULT_CHAMFER_TUPLE, 0.375).surfaceStyle).toContain('clip-path: polygon(');
		const closedCorr = computeSafeCorridorFromRects(1440, 900, true, [], 16, { leftOpen: false, leftFloating: false, rightOpen: false, rightFloating: false });
		const openCorr = computeSafeCorridorFromRects(1440, 900, true, [], 16, { leftOpen: true, leftFloating: false, rightOpen: true, rightFloating: false });
		expect(openCorr.leftPx).toBe(72); expect(openCorr.rightPx).toBe(72); expect(openCorr.stageFreeWidthPx).toBe(closedCorr.stageFreeWidthPx);
		expect(clampStageCamera({ panX: 9999, panY: -9999, zoom: 9 })).toEqual({ panX: 600, panY: -400, zoom: 2.2 });
		expect(clamp(5, 10, 20)).toBe(10);
		const burst500 = Array.from({ length: 500 }, (_, i) => makeTrace(i + 1, 'UI_STAGE_PAN_ZOOM', 'USER', 2));
		const coalesced = coalesceBurstTraces(burst500);
		expect(coalesced.length).toBe(1); expect(coalesced[0]?.count).toBe(500); expect(coalesced[0]?.key).toBe(buildWireTraceKey(burst500[0]!));
		const badProfile = await handleBuilderMcpRpc({ jsonrpc: '2.0', id: 1204, method: 'tools/call', params: { name: 'ui_set_motion_profile', arguments: { profile: 'BOGUS_MODE' } } });
		expect(JSON.stringify(badProfile.result)).toContain('CALM_SLOW');
	});
});
