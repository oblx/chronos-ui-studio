import {
	CANONICAL_SHORTCUTS, clampControlConfig, clampHistoryLimit, clampStudioDefaults, clampTooltipInfoLevel,
	DEFAULT_STUDIO_DEFAULTS, getEffectiveShortcuts, HUD_STAGGER_BOUNDS, resolveTooltipTierLabel,
	validateShortcutRegistry, type ButtonControlConfig, type FormControlConfig, type StudioControlConfig
} from '@chronos-ui/svelte';
import { eq } from 'drizzle-orm';
import { getStudioDb, uiProjects } from '@studio/lib';
import { loadProjectWithNodes } from '@studio/server/routes/routes.projects';
import { resolveMcpProject, type ProjectMcpToolFn } from './mcp.project.tools';

async function persistProjectDefaults(projectId: string, patch: Record<string, unknown>) {
	const project = await resolveMcpProject({ projectId });
	const nextDefaults = clampStudioDefaults(patch, project.studioDefaults ?? DEFAULT_STUDIO_DEFAULTS);
	const db = await getStudioDb();
	await db.update(uiProjects).set({ studioDefaultsJson: JSON.stringify(nextDefaults), updatedAt: Date.now() }).where(eq(uiProjects.id, project.id));
	return { nextDefaults, project: await loadProjectWithNodes(project.id) };
}

async function toolConfigureControls(args: Record<string, unknown>) {
	const project = await resolveMcpProject(args);
	const current = project.studioDefaults?.controlConfig ?? DEFAULT_STUDIO_DEFAULTS.controlConfig;
	const patch: { buttonConfig?: Partial<ButtonControlConfig>; formConfig?: Partial<FormControlConfig> } = {
		...(args.buttonConfig && typeof args.buttonConfig === 'object' ? { buttonConfig: args.buttonConfig as Partial<ButtonControlConfig> } : {}),
		...(args.formConfig && typeof args.formConfig === 'object' ? { formConfig: args.formConfig as Partial<FormControlConfig> } : {})
	};
	const controlConfig: StudioControlConfig = clampControlConfig(patch, current);
	const { project: updated } = await persistProjectDefaults(project.id, { controlConfig });
	return {
		summary: `controls ${controlConfig.buttonConfig.variant}/${controlConfig.buttonConfig.density}`,
		controlConfig,
		project: updated,
		clientIntents: [{ kind: 'UI_SET_CONTROL_CONFIG', payload: { controlConfig } }]
	};
}

async function toolSetHistoryLimit(args: Record<string, unknown>) {
	const project = await resolveMcpProject(args);
	const historyLimit = clampHistoryLimit(Number(args.limit));
	const { project: updated } = await persistProjectDefaults(project.id, { historyLimit });
	return {
		summary: `history limit ${historyLimit}`,
		historyLimit,
		project: updated,
		clientIntents: [{ kind: 'UI_SET_HISTORY_LIMIT', payload: { limit: historyLimit } }]
	};
}

async function toolSetTooltipInfoLevel(args: Record<string, unknown>) {
	const project = await resolveMcpProject(args);
	const tooltipInfoLevel = clampTooltipInfoLevel(Number(args.infoLevel));
	const tier = resolveTooltipTierLabel(tooltipInfoLevel);
	const { project: updated } = await persistProjectDefaults(project.id, { tooltipInfoLevel });
	return {
		summary: `tooltip infoLevel ${tooltipInfoLevel} (${tier})`,
		tooltipInfoLevel,
		tier,
		project: updated,
		clientIntents: [{ kind: 'UI_SET_TOOLTIP_INFO_LEVEL', payload: { infoLevel: tooltipInfoLevel } }]
	};
}

async function toolReplayHudSequence(args: Record<string, unknown>) {
	const raw = typeof args.intervalMs === 'number' && Number.isFinite(args.intervalMs) ? args.intervalMs : HUD_STAGGER_BOUNDS.defaultMs;
	const intervalMs = Math.max(HUD_STAGGER_BOUNDS.minMs, Math.min(HUD_STAGGER_BOUNDS.maxMs, Math.round(raw)));
	return {
		summary: `replayed HUD boot sequence (${intervalMs}ms ASC)`,
		replayed: true,
		intervalMs,
		clientIntents: [{ kind: 'UI_REPLAY_HUD_SEQUENCE', payload: { intervalMs } }]
	};
}

async function toolConfigureGraph(args: Record<string, unknown>) {
	const project = await resolveMcpProject(args);
	const patch: Record<string, unknown> = {
		...(typeof args.routing === 'string' ? { graphRouting: args.routing } : {}),
		...(typeof args.packetSizePx === 'number' ? { graphPacketSizePx: args.packetSizePx } : {})
	};
	const { nextDefaults, project: updated } = await persistProjectDefaults(project.id, patch);
	return {
		summary: `graph ${nextDefaults.graphRouting}/${nextDefaults.graphPacketSizePx}px`,
		graphRouting: nextDefaults.graphRouting,
		graphPacketSizePx: nextDefaults.graphPacketSizePx,
		project: updated,
		clientIntents: [{ kind: 'UI_CONFIGURE_GRAPH', payload: { routing: nextDefaults.graphRouting, packetSizePx: nextDefaults.graphPacketSizePx, ...(typeof args.nodeId === 'string' ? { nodeId: args.nodeId } : {}) } }]
	};
}

async function toolSetWireTimescale(args: Record<string, unknown>) {
	const project = await resolveMcpProject(args);
	const patch: Record<string, unknown> = {
		...(typeof args.multiplier === 'number' ? { wireTimeScaleMultiplier: args.multiplier } : {}),
		...(typeof args.curve === 'string' ? { wireTimeScaleCurve: args.curve } : {})
	};
	const { nextDefaults, project: updated } = await persistProjectDefaults(project.id, patch);
	return {
		summary: `wire time-scale ${nextDefaults.wireTimeScaleMultiplier}x (${nextDefaults.wireTimeScaleCurve})`,
		wireTimeScaleMultiplier: nextDefaults.wireTimeScaleMultiplier,
		wireTimeScaleCurve: nextDefaults.wireTimeScaleCurve,
		project: updated,
		clientIntents: [{ kind: 'UI_SET_WIRE_TIMESCALE', payload: { multiplier: nextDefaults.wireTimeScaleMultiplier, curve: nextDefaults.wireTimeScaleCurve } }]
	};
}

async function toolListShortcuts(args: Record<string, unknown>) {
	const project = await resolveMcpProject(args);
	const overrides = project.studioDefaults?.shortcutOverrides ?? {};
	const effectiveShortcuts = getEffectiveShortcuts(overrides);
	const validation = validateShortcutRegistry(effectiveShortcuts);
	return {
		summary: `${effectiveShortcuts.length} shortcuts (${validation.valid ? '0 collisions' : `${validation.collisions.length} collisions`})`,
		canonicalShortcuts: CANONICAL_SHORTCUTS,
		effectiveShortcuts,
		validation
	};
}

async function toolOpenGlobalSearch(args: Record<string, unknown>) {
	const query = typeof args.query === 'string' ? args.query : '';
	const category = typeof args.category === 'string' ? args.category : 'ALL';
	return {
		summary: `opened Global Search (${category}${query ? `: ${query}` : ''})`,
		opened: true,
		query,
		category,
		clientIntents: [{ kind: 'UI_OPEN_MODAL', payload: { id: 'global-search', modalId: 'GLOBAL_SEARCH', query, category } }]
	};
}

export function buildV011McpTools(): readonly [string, ProjectMcpToolFn][] {
	return [
		['ui_configure_controls', toolConfigureControls],
		['ui_set_history_limit', toolSetHistoryLimit],
		['ui_undo', async () => ({ summary: 'dispatched undo revision', dispatched: true, clientIntents: [{ kind: 'UI_UNDO_REVISION', payload: {} }] })],
		['ui_redo', async () => ({ summary: 'dispatched redo revision', dispatched: true, clientIntents: [{ kind: 'UI_REDO_REVISION', payload: {} }] })],
		['ui_replay_hud_sequence', toolReplayHudSequence],
		['ui_set_tooltip_info_level', toolSetTooltipInfoLevel],
		['ui_configure_graph', toolConfigureGraph],
		['ui_set_wire_timescale', toolSetWireTimescale],
		['ui_list_shortcuts', toolListShortcuts],
		['ui_open_global_search', toolOpenGlobalSearch]
	];
}
