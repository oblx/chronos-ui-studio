import type { HudZoneId, UiComponentKind, UiNode, UiProjectDefinition } from '@chronos-ui/svelte';
import { DEFAULT_BUILD_CONFIG } from '../../core';
import { registerInputConnector } from '../registry';
import type { ProjectImportResult } from './json.connector';

const ZONE_MAP: Readonly<Record<string, HudZoneId>> = {
	top: 'TOP_CENTER', header: 'TOP_CENTER', nav: 'TOP_CENTER',
	tabs: 'PROJECT_TAB_DECK', deck: 'PROJECT_TAB_DECK',
	left: 'LEFT_EDGE', sidebar: 'LEFT_EDGE',
	right: 'RIGHT_EDGE', inspector: 'RIGHT_EDGE',
	radar: 'BOTTOM_RIGHT', minimap: 'BOTTOM_RIGHT',
	stream: 'BOTTOM_LEFT', wire: 'BOTTOM_LEFT',
	bottom: 'BOTTOM_CENTER', footer: 'BOTTOM_CENTER'
};

function inferZoneAndType(id: string, label: string): { zone: HudZoneId; type: UiComponentKind } {
	const hay = `${id} ${label}`.toLowerCase();
	for (const [key, zone] of Object.entries(ZONE_MAP)) {
		if (hay.includes(key)) {
			const type: UiComponentKind = zone === 'TOP_CENTER' ? 'UiHeaderBar'
				: zone === 'PROJECT_TAB_DECK' ? 'UiProjectDeck'
				: zone === 'BOTTOM_RIGHT' ? 'UiBentoRadar'
				: zone === 'BOTTOM_LEFT' ? 'UiWireInspector' : 'UiSection';
			return { zone, type };
		}
	}
	if (hay.includes('metric') || hay.includes('kpi')) return { zone: 'WORLD_CANVAS', type: 'UiMetricCard' };
	if (hay.includes('gauge') || hay.includes('progress')) return { zone: 'WORLD_CANVAS', type: 'UiProgressGauge' };
	if (hay.includes('action') || hay.includes('button')) return { zone: 'WORLD_CANVAS', type: 'UiActionBar' };
	return { zone: 'WORLD_CANVAS', type: 'UiSection' };
}

export function parseMermaidWireframe(source: string, projectName = 'Mermaid Wireframe'): ProjectImportResult {
	const trimmed = source.trim();
	if (!trimmed) return { ok: false, error: 'Empty Mermaid wireframe input.' };
	const nodeRe = /([A-Za-z0-9_-]+)\s*\[([^\]]+)\]/g;
	const seen = new Map<string, UiNode>();
	let match: RegExpExecArray | null = nodeRe.exec(trimmed);
	while (match) {
		const rawId = match[1];
		const label = match[2].replace(/^["']|["']$/g, '').trim();
		if (!seen.has(rawId)) {
			const { zone, type } = inferZoneAndType(rawId, label);
			seen.set(rawId, {
				id: `mmd-${rawId.toLowerCase()}`,
				type, zone, label, lifecycle: 'STAGING',
				props: { title: label, subtitle: `Imported from Mermaid node ${rawId}` }
			});
		}
		match = nodeRe.exec(trimmed);
	}
	if (seen.size === 0) return { ok: false, error: 'No Mermaid wireframe nodes found (expected ID[Label]).' };
	const project: UiProjectDefinition = {
		id: `proj-mmd-${Date.now().toString(36)}`,
		slug: projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
		name: projectName,
		description: 'Generated from Mermaid wireframe graph.',
		themeId: 'obsidian-brass',
		cornerMode: 'CHAMFER',
		activeRevisionId: 'rev-mmd-1',
		nodes: [...seen.values()],
		buildConfig: DEFAULT_BUILD_CONFIG,
		updatedAt: Date.now()
	};
	return { ok: true, project };
}

registerInputConnector<string, ProjectImportResult>({
	id: 'mermaid-wireframe',
	label: 'Mermaid Flowchart / Block-Beta Wireframe Connector',
	accept: 'text/vnd.mermaid',
	ingest: (src) => parseMermaidWireframe(src)
});
