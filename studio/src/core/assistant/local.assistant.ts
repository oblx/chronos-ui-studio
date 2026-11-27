import { COMPONENT_CATALOG, CORNER_MODES, DEFAULT_DARK_THEME_ID, DEFAULT_LIGHT_THEME_ID, HUD_ZONES, pxToRem, THEME_PACKS, UI_FRAME_SHAPES, type CornerKind, type HudZoneId, type UiComponentKind, type UiFrameShape } from '@chronos-ui/svelte';
import { STUDIO_TOOL_REGISTRY, type StudioToolDescriptor } from '../engine';
export interface AssistantPlannedAction { readonly tool: string; readonly args: Record<string, unknown>; }
export interface AssistantPlan { readonly reply: string; readonly actions: readonly AssistantPlannedAction[]; }
const tokenize = (input: string): Set<string> => new Set(input.toLowerCase().split(/[^a-z0-9_-]+/).filter((t) => t.length > 1));
function detectThemeMatch(lower: string): string | null {
	for (const pack of THEME_PACKS) if (lower.includes(pack.id) || lower.includes(pack.id.replace(/-/g, ' ')) || lower.includes(pack.name.toLowerCase())) return pack.id;
	if (/\b(light|alabaster)\b/.test(lower)) return DEFAULT_LIGHT_THEME_ID;
	if (/\b(daylight|blueprint)\b/.test(lower)) return 'daylight-blueprint';
	if (/\b(dark|obsidian)\b/.test(lower)) return DEFAULT_DARK_THEME_ID;
	return /\b(crt|phosphor|tokyo)\b/.test(lower) ? 'tokyo-phosphor' : null;
}

function detectShapeMatch(lower: string): UiFrameShape | undefined {
	const map: readonly [RegExp, UiFrameShape][] = [
		[/\bpackage\b/, 'UML_PACKAGE'], [/\bcomponent\b/, 'UML_COMPONENT'], [/\bdatabase|db\b/, 'UML_DATABASE'],
		[/\bnote\b/, 'UML_NOTE'], [/\bnode.?3d|cube\b/, 'UML_NODE_3D'], [/\bhex(agon)?\b/, 'HEXAGON'],
		[/\bcapsule|pill\b/, 'CAPSULE'], [/\bdiamond|decision\b/, 'DIAMOND'], [/\bparallelogram\b/, 'PARALLELOGRAM'],
		[/\btrapezoid\b/, 'TRAPEZOID'], [/\boctagon\b/, 'OCTAGON'], [/\bdocument\b/, 'DOCUMENT'], [/\bsignal\b/, 'SIGNAL_SEND']
	];
	for (const [rx, shape] of map) if (rx.test(lower)) return shape;
	return UI_FRAME_SHAPES.find((s) => lower.includes(s.toLowerCase()));
}

function detectZoneMatch(lower: string): HudZoneId {
	if (lower.includes('top bar') || lower.includes('header')) return 'TOP_CENTER';
	if (lower.includes('project tab') || lower.includes('deck')) return 'PROJECT_TAB_DECK';
	if (lower.includes('radar') || lower.includes('minimap')) return 'BOTTOM_RIGHT';
	if (lower.includes('wire') || lower.includes('stream')) return 'BOTTOM_LEFT';
	return HUD_ZONES.find((z) => lower.includes(z.toLowerCase().replace(/_/g, ' ')) || lower.includes(z.toLowerCase())) ?? 'WORLD_CANVAS';
}

function parseRadiusRem(lower: string): number | undefined {
	const pxMatch = lower.match(/(\d+(?:\.\d+)?)\s*px/);
	if (pxMatch) return pxToRem(parseFloat(pxMatch[1]), 4);
	const remMatch = lower.match(/(\d+(?:\.\d+)?)\s*rem/);
	return remMatch ? parseFloat(remMatch[1]) : undefined;
}

function scoreCatalogWidget(tokens: Set<string>, lower: string): UiComponentKind | null {
	let bestType: UiComponentKind | null = null;
	let bestScore = 0;
	for (const item of COMPONENT_CATALOG) {
		const bag = `${item.type} ${item.label} ${item.category} ${item.allowedZones.join(' ')}`.toLowerCase();
		let score = 0;
		for (const tok of tokens) if (bag.includes(tok)) score += 2;
		if (item.type === 'UiHeaderBar' && /\b(top bar|header|tabs)\b/.test(lower)) score += 4;
		if (item.type === 'UiProgressGauge' && /\b(gauge|progress|meter)\b/.test(lower)) score += 4;
		if (item.type === 'UiMetricCard' && /\b(metric|kpi|latency|throughput)\b/.test(lower)) score += 4;
		if (item.type === 'UiBentoRadar' && /\b(radar|minimap|skeleton)\b/.test(lower)) score += 4;
		if (item.type === 'UiEventGraph' && /\b(event\s*graph|live\s*graph|graph|topology|dag|flowchart)\b/.test(lower)) score += 6;
		if (score > bestScore) { bestScore = score; bestType = item.type; }
	}
	return bestScore >= 2 ? bestType : null;
}

export function scoreToolsForPrompt(prompt: string): readonly { tool: StudioToolDescriptor; score: number }[] {
	const tokens = tokenize(prompt);
	return STUDIO_TOOL_REGISTRY.map((tool) => {
		const schemaKeys = Object.keys((tool.inputSchema.properties as Record<string, unknown> | undefined) ?? {}).join(' ');
		const corpus = `${tool.name.replace(/_/g, ' ')} ${tool.humanTitle} ${tool.description} ${schemaKeys}`.toLowerCase();
		let score = 0;
		for (const tok of tokens) if (corpus.includes(tok)) score += 1;
		return { tool, score };
	}).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
}

function planSlashCommand(prompt: string): AssistantPlan | null {
	const parts = prompt.trim().split(/\s+/);
	const cmd = parts[0].toLowerCase();
	if (cmd === '/spawn') return { reply: `Staged ${parts[1] ?? 'UiSection'} inside ${(parts[2] ?? 'WORLD_CANVAS').toUpperCase()}.`, actions: [{ tool: 'ui_spawn_node', args: { type: (parts[1] ?? 'UiSection') as UiComponentKind, zone: (parts[2] ?? 'WORLD_CANVAS').toUpperCase() as HudZoneId, label: parts[1] ?? 'UiSection', lifecycle: 'STAGING' } }] };
	if (cmd === '/commit') return { reply: 'Committed all staged elements to the live painted canvas.', actions: [{ tool: 'ui_commit_node', args: { all: true } }] };
	if (cmd === '/reject') return { reply: 'Rejected all un-committed staged nodes.', actions: [{ tool: 'ui_reject_all_staged', args: {} }] };
	if (cmd === '/save') return { reply: 'Saved workspace snapshot and entity registry.', actions: [{ tool: 'ui_save_project', args: {} }] };
	if (cmd === '/clean') return { reply: 'Cleaned workspace to Calm Empty Stage.', actions: [{ tool: 'ui_clean_project', args: {} }] };
	if (cmd === '/reset') return { reply: 'Restored default workspace view.', actions: [{ tool: 'ui_reset_workspace_view', args: {} }] };
	if (cmd === '/station') return { reply: 'Opened Station Builder workbench.', actions: [{ tool: 'ui_open_station_builder', args: {} }] };
	if (cmd === '/zone') return { reply: 'Opened Zone Edition workbench.', actions: [{ tool: 'ui_open_zone_edition', args: { zoneId: (parts[1] ?? 'TOP_RIGHT').toUpperCase() } }] };
	if (cmd === '/cursor' && parts[1]) return { reply: `Applied cursor pack ${parts[1]}.`, actions: [{ tool: 'ui_apply_cursor_pack', args: { packId: parts[1] } }] };
	if (cmd === '/project' && parts[1] === 'create') return { reply: `Created and switched to calm workspace "${parts.slice(2).join(' ') || 'Untitled Workspace'}".`, actions: [{ tool: 'ui_create_project', args: { name: parts.slice(2).join(' ') || 'Untitled Workspace' } }] };
	if (cmd === '/project' && parts[1] === 'switch' && parts[2]) return { reply: `Switched active workspace to ${parts[2]}.`, actions: [{ tool: 'ui_switch_project', args: { projectId: parts[2] } }] };
	if (cmd === '/export') return { reply: 'Triggered optimized static client build export.', actions: [{ tool: 'ui_export_static', args: { adapter: 'static-site-build' } }] };
	if (cmd === '/motion') return { reply: `Switched motion profile to ${(parts[1] ?? 'CALM_SLOW').toUpperCase()}.`, actions: [{ tool: 'ui_set_motion_profile', args: { profile: (parts[1] ?? 'CALM_SLOW').toUpperCase() } }] };
	return null;
}

function planStationOrZoneCommand(lower: string, corners: CornerKind | undefined): AssistantPlan | null {
	const radiusRem = parseRadiusRem(lower);
	const zoneId = detectZoneMatch(lower);
	if (/\b(open\s+)?wireframe(\s+skeleton)?\b/.test(lower)) return { reply: 'Opened the CS6 Wireframe Skeleton Workbench.', actions: [{ tool: 'ui_open_wireframe_skeleton', args: {} }] };
	if (/\bexport\s+full.?stack\b/.test(lower)) return { reply: 'Compiled standalone full-stack client + vendored Bun/Drizzle backend bundle.', actions: [{ tool: 'ui_export_fullstack_bundle', args: { emitZip: true } }] };
	if (/\b(reject\s+all|discard\s+staged|clear\s+staging)\b/.test(lower)) return { reply: 'Discarded all un-committed staged nodes.', actions: [{ tool: 'ui_reject_all_staged', args: {} }] };
	if (/\breset\s+(studio\s+)?defaults\b/.test(lower)) return { reply: 'Reset Studio geometry and ornament defaults to canonical baseline.', actions: [{ tool: 'ui_reset_studio_defaults', args: {} }] };
	if (/\bstation\s+builder\b/.test(lower)) return { reply: 'Opened the Station Builder architectural workbench.', actions: [{ tool: 'ui_open_station_builder', args: {} }] };
	if (/\bopen\b.*\bzone\s+edition\b/.test(lower)) return { reply: `Opened Zone Edition workbench focused on ${zoneId}.`, actions: [{ tool: 'ui_open_zone_edition', args: { zoneId } }] };
	if (/\b(edit|update|configure)\b.*\bzone\b/.test(lower)) {
		const tuple = corners ? [corners, corners, corners, corners] : undefined;
		return { reply: `Updated ${zoneId} disposition${radiusRem ? ` (${radiusRem}rem)` : ''}${corners ? ` with ${corners} corners` : ''} and mirrored bilateral twin.`, actions: [{ tool: 'ui_edit_zone_disposition', args: { zoneId, ...(tuple ? { corners: tuple } : {}), ...(radiusRem !== undefined ? { cornerRadiusRem: radiusRem } : {}), mirrorOpposite: true } }] };
	}
	if (/\bmove\b.*\bto\b/.test(lower) && zoneId !== 'WORLD_CANVAS') {
		const targetWord = lower.replace(/\b(move|the|to|zone)\b/g, '').trim().split(/\s+/)[0] ?? '';
		return { reply: `Relocated "${targetWord || 'active entity'}" to ${zoneId}.`, actions: [{ tool: 'ui_move_entity_to_zone', args: { nodeQuery: targetWord, targetZone: zoneId } }] };
	}
	const emb = /\bcrosshair\b/.test(lower) ? 'CROSSHAIR' : /\bdouble\s*line\b/.test(lower) ? 'DOUBLE_LINE' : /\bdiamond\b/.test(lower) ? 'DIAMOND' : undefined;
	const anim = /\borbit\s*trace\b/.test(lower) ? 'ORBIT_TRACE' : /\bdiagonal\s*drift\b/.test(lower) ? 'DIAGONAL_DRIFT' : /\bscan\s*glint\b/.test(lower) ? 'SCAN_GLINT' : undefined;
	if (/\bdefault\b.*\b(chamfer|cut|station|control|stroke|gutter)\b/.test(lower) || /\b(orbit\s*trace|studio\s*defaults)\b/.test(lower)) {
		return { reply: `Configured Studio defaults${radiusRem ? ` (${radiusRem}rem)` : ''}${emb ? ` · ${emb}` : ''}${anim ? ` · ${anim}` : ''}.`, actions: [{ tool: 'ui_configure_studio_defaults', args: { ...(radiusRem !== undefined ? { baseCornerCutRem: radiusRem } : {}), ...(corners ? { cornerMode: corners } : {}), ...(emb ? { cornerEmbellishment: emb } : {}), ...(anim ? { cornerAnimation: anim } : {}) } }] };
	}
	if (/\b(chamfer|corner)\s+(radius|cut|depth)\b/.test(lower) && radiusRem !== undefined) return { reply: `Set global corner radius to ${radiusRem}rem${anim ? ` with ${anim} animation` : ''}.`, actions: [{ tool: 'ui_set_corner_radius', args: { cornerRadiusRem: radiusRem, ...(corners ? { cornerMode: corners } : {}), ...(anim ? { cornerAnimation: anim } : {}) } }] };
	return null;
}

function planNaturalLanguage(prompt: string): AssistantPlan {
	const lower = prompt.toLowerCase();
	const corners = CORNER_MODES.find((c) => lower.includes(c.toLowerCase()));
	const stationPlan = planStationOrZoneCommand(lower, corners);
	if (stationPlan) return stationPlan;
	const tokens = tokenize(prompt);
	const actions: AssistantPlannedAction[] = [];
	const notes: string[] = [];
	const themeId = detectThemeMatch(lower);
	const shape = detectShapeMatch(lower);
	const cornerTuple = corners ? [corners, corners, corners, corners] : undefined;
	if (themeId && /\b(theme|switch|palette|light|dark)\b/.test(lower)) { actions.push({ tool: 'ui_apply_theme', args: { themeId } }); notes.push(`applied ${themeId}`); }
	if (/\b(dashboard|telemetry)\b/.test(lower)) {
		actions.push(
			{ tool: 'ui_spawn_node', args: { type: 'UiHeaderBar', zone: 'TOP_CENTER', label: 'Telemetry Crown', props: { title: 'Telemetry Deck', tabs: 'Overview,Nodes,Events', showThemeToggle: true } } },
			{ tool: 'ui_spawn_node', args: { type: 'UiMetricCard', zone: 'TOP_LEFT', label: 'Frame Budget', props: { title: 'Render Loop', value: '60 FPS', delta: '0ms drift' } } },
			{ tool: 'ui_spawn_node', args: { type: 'UiSection', zone: 'WORLD_CANVAS', label: 'Primary Workspace', ...(shape ? { shape } : {}), ...(cornerTuple ? { corners: cornerTuple } : {}), props: { title: 'Live Telemetry Surface', subtitle: 'AI-born dynamic Svelte 5 canvas' } } },
			{ tool: 'ui_spawn_node', args: { type: 'UiBentoRadar', zone: 'BOTTOM_RIGHT', label: 'Tactical Radar', props: { zoom: 1, activeZoneCount: 4 } } }
		);
		notes.push('staged 4 telemetry dashboard components');
	} else {
		const matchedType = scoreCatalogWidget(tokens, lower);
		if (matchedType) {
			const cat = COMPONENT_CATALOG.find((c) => c.type === matchedType)!;
			const defaults = Object.fromEntries(Object.entries(cat.propSchema).map(([k, v]) => [k, v.defaultValue]));
			actions.push({ tool: 'ui_spawn_node', args: { type: matchedType, zone: detectZoneMatch(lower) || cat.allowedZones[0] || 'WORLD_CANVAS', label: cat.label, ...(shape ? { shape } : {}), ...(cornerTuple ? { corners: cornerTuple } : {}), props: defaults } });
			notes.push(`staged ${matchedType}`);
		}
	}
	if (actions.length === 0) {
		actions.push({ tool: 'ui_spawn_node', args: { type: 'UiSection', zone: 'WORLD_CANVAS', label: prompt.slice(0, 32), ...(shape ? { shape } : {}), ...(cornerTuple ? { corners: cornerTuple } : {}), props: { title: prompt.slice(0, 48), subtitle: 'Staged by Local Schema Planner' } } });
		notes.push('staged UiSection on WORLD_CANVAS');
	}
	return { reply: `Local Agent ${notes.join(', ')}. Review wireframe overlay to Commit or Reject.`, actions };
}

export const planLocalAssistantPrompt = (prompt: string): AssistantPlan => planSlashCommand(prompt) ?? planNaturalLanguage(prompt);
