import { describe, expect, test } from 'bun:test';
import {
	buildControlHtmlAttrs, buildMotionCssVars, BUILTIN_CURSOR_PACKS, createUiWireBroker, CSS_CURSOR_STATES,
	DEFAULT_SURFACE_MOTION_PROFILES, DEFAULT_STUDIO_DEFAULTS, getActiveMotionSensory, MOTION_DESIGN_TOKENS,
	resetActiveStudioDefaults, resolveActiveSurfaceMs, setActiveMotionProfile, setActiveMotionSensory,
	setActiveStudioDefaults, type UiNode
} from '@chronos-ui/svelte';
import { createInitialStudioState, registerStudioIntentHandlers, type StudioState } from '@studio/client/state';
import { CAPABILITY_BITS } from '@studio/config';
import { hasCapability, maskForRole, validateUiNode } from '@studio/core';
import { documentGraphToNodeTree, nodeTreeToDocumentGraph, WORKSPACE_CURSOR_TOOL_DESCRIPTORS } from '@studio/core/engine';
import { handleBuilderMcpRpc } from '@studio/mcp';

const g = globalThis as Record<string, unknown>;
if (typeof g.$state !== 'function') g.$state = Object.assign(<T>(v: T) => v, { raw: <T>(v: T) => v });

describe('Audit invariants: RBAC bit indices & 21-state cursor derivation', () => {
	test('WORKSPACE_CURSOR_TOOL_DESCRIPTORS use valid CAPABILITY_BITS indices for viewer/editor roles', () => {
		const byName = new Map<string, number>(WORKSPACE_CURSOR_TOOL_DESCRIPTORS.map((d) => [d.name, d.requiredCapabilityBit]));
		expect(byName.get('ui_list_cursor_packs')).toBe(CAPABILITY_BITS.READ_BLUEPRINTS);
		expect(byName.get('ui_reset_workspace_view')).toBe(CAPABILITY_BITS.READ_BLUEPRINTS);
		expect(byName.get('ui_save_project')).toBe(CAPABILITY_BITS.WRITE_BLUEPRINTS);
		expect(byName.get('ui_apply_cursor_pack')).toBe(CAPABILITY_BITS.WRITE_THEMES);
		expect(byName.get('ui_derive_cursor_states')).toBe(CAPABILITY_BITS.WRITE_THEMES);
		const viewerMask = maskForRole('viewer');
		const editorMask = maskForRole('editor');
		expect(hasCapability(viewerMask, byName.get('ui_list_cursor_packs')!)).toBe(true);
		expect(hasCapability(viewerMask, byName.get('ui_reset_workspace_view')!)).toBe(true);
		expect(hasCapability(viewerMask, byName.get('ui_apply_cursor_pack')!)).toBe(false);
		expect(hasCapability(editorMask, byName.get('ui_apply_cursor_pack')!)).toBe(true);
		expect(hasCapability(editorMask, byName.get('ui_derive_cursor_states')!)).toBe(true);
	});

	test('ui_derive_cursor_states reports all derived states (CSS_CURSOR_STATES.length - 1 = 20)', async () => {
		const res = await handleBuilderMcpRpc({
			jsonrpc: '2.0', id: 9001, method: 'tools/call',
			params: { name: 'ui_derive_cursor_states', arguments: { packId: BUILTIN_CURSOR_PACKS[0].uuid } }
		});
		expect(res.error).toBeUndefined();
		const structured = (res.result as { structured?: { derivedCount?: number; summary?: string } }).structured;
		expect(structured?.derivedCount).toBe(CSS_CURSOR_STATES.length - 1);
		expect(structured?.derivedCount).toBe(20);
		expect(structured?.summary).toContain(String(CSS_CURSOR_STATES.length));
	});
});

describe('Audit invariants: per-node controlConfig, historyLimit & surface motion CSS vars', () => {
	test('validateUiNode & DocumentGraph preserve controlConfig, cornerRadiusRem, locked, visible & emit data-ui attrs', () => {
		const raw: UiNode = {
			id: 'node-ctl-1', type: 'UiActionBar', zone: 'WORLD_CANVAS', label: 'Controls', lifecycle: 'COMMITTED',
			props: { title: 'Controls' }, cornerRadiusRem: 0.75, locked: true, visible: false,
			controlConfig: { buttonConfig: { variant: 'SOLID', density: 'COMPACT' }, formConfig: { surfaceStyle: 'RECESSED', sliderTrackStyle: 'SOLID' } }
		};
		const parsed = validateUiNode(raw);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		expect(parsed.node.cornerRadiusRem).toBe(0.75);
		expect(parsed.node.locked).toBe(true);
		expect(parsed.node.visible).toBe(false);
		expect(parsed.node.controlConfig?.buttonConfig?.variant).toBe('SOLID');
		const roundTrip = documentGraphToNodeTree(nodeTreeToDocumentGraph([parsed.node]))[0];
		expect(roundTrip?.controlConfig).toEqual(parsed.node.controlConfig);
		expect(roundTrip?.cornerRadiusRem).toBe(0.75);
		expect(roundTrip?.locked).toBe(true);
		expect(roundTrip?.visible).toBe(false);
		const attrs = buildControlHtmlAttrs(roundTrip?.controlConfig);
		expect(attrs['data-ui-btn-variant']).toBe('SOLID');
		expect(attrs['data-ui-btn-density']).toBe('COMPACT');
		expect(attrs['data-ui-form-surface']).toBe('RECESSED');
		expect(attrs['data-ui-slider-track']).toBe('SOLID');
	});

	test('UI_MOVE_ENTITY_TO_ZONE obeys configured studioDefaults.historyLimit instead of hardcoded 20', () => {
		const base = createInitialStudioState();
		const seedNode: UiNode = { id: 'n-hist', type: 'UiMetricCard', zone: 'WORLD_CANVAS', label: 'Metric', lifecycle: 'COMMITTED', props: {} };
		const seeded: StudioState = {
			...base,
			studioDefaults: { ...DEFAULT_STUDIO_DEFAULTS, historyLimit: 3 },
			projects: base.projects.map((p, i) => (i === 0 ? { ...p, nodes: [seedNode] } : p))
		};
		const broker = createUiWireBroker<StudioState>(seeded);
		registerStudioIntentHandlers(broker);
		const zones = ['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT', 'WORLD_CANVAS'] as const;
		for (const targetZone of zones) broker.dispatch('UI_MOVE_ENTITY_TO_ZONE', { nodeId: 'n-hist', targetZone });
		expect(broker.state.undoStack.length).toBe(3);
		expect(broker.state.projects[0]?.nodes[0]?.zone).toBe('WORLD_CANVAS');
	});

	test('buildMotionCssVars & resolveActiveSurfaceMs honor surface overrides, hudZoneStaggerMs & REDUCED_ZERO', () => {
		setActiveMotionProfile('CALM_SLOW');
		setActiveStudioDefaults({ hudZoneStaggerMs: 180 });
		setActiveMotionSensory({
			surfaces: {
				...DEFAULT_SURFACE_MOTION_PROFILES,
				MODAL: { enterMs: 360, exitMs: 240, easing: MOTION_DESIGN_TOKENS.easeEnter },
				HUD_ZONE: { enterMs: 290, exitMs: 190, easing: MOTION_DESIGN_TOKENS.easeEnter }
			}
		});
		expect(getActiveMotionSensory().hudZoneStaggerMs).toBe(175);
		const vars = buildMotionCssVars(getActiveMotionSensory(), false);
		expect(vars['--ui-dur-modal-enter']).toBe('360ms');
		expect(vars['--ui-dur-modal-exit']).toBe('240ms');
		expect(vars['--ui-dur-hud-enter']).toBe('290ms');
		expect(vars['--ui-stagger-zone-ms']).toBe('175ms');
		expect(resolveActiveSurfaceMs('MODAL', 'enter')).toBe(360);
		expect(resolveActiveSurfaceMs('MODAL', 'exit')).toBe(240);
		expect(resolveActiveSurfaceMs('MODAL', 'enter', true)).toBe(0);
		setActiveMotionProfile('REDUCED_ZERO');
		expect(resolveActiveSurfaceMs('MODAL', 'enter')).toBe(0);
		setActiveMotionProfile('CALM_SLOW');
		setActiveMotionSensory({ surfaces: DEFAULT_SURFACE_MOTION_PROFILES });
		resetActiveStudioDefaults();
	});
});
