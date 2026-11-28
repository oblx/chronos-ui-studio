import {
	formatShortcutBadge, getEffectiveShortcuts, shortUuid,
	type CursorPackDefinition, type IntentKind, type RegisteredUiEntity,
	type ThemePack, type UiIconName, type UiProjectDefinition
} from '@chronos-ui/svelte';
import type { StudioModalId } from '@studio/client/state';
import { STARTER_SAMPLE_PROJECTS, TOME_SSG_CHAPTERS } from '@studio/config';
import { STUDIO_TOOL_REGISTRY } from '@studio/core/engine';

export type SearchCategory = 'ALL' | 'ENTITIES' | 'ACTIONS' | 'PROJECTS' | 'TOME' | 'THEMES' | 'SHORTCUTS';

export interface SearchItem {
	readonly id: string;
	readonly category: Exclude<SearchCategory, 'ALL'>;
	readonly title: string;
	readonly subtitle: string;
	readonly badge: string;
	readonly icon: UiIconName;
	readonly run: () => void;
}

export interface SearchCatalogContext {
	readonly entities: readonly RegisteredUiEntity[];
	readonly projects: readonly UiProjectDefinition[];
	readonly activeProjectId: string;
	readonly themes: readonly ThemePack[];
	readonly cursorPacks: readonly CursorPackDefinition[];
	readonly shortcutOverrides?: Readonly<Record<string, string>>;
	readonly onOpenModal: (id: StudioModalId) => void;
	readonly onInspectEntity: (uuid: string) => void;
	readonly onSelectProject: (id: string) => void;
	readonly onLoadSample: (sampleId: string) => void;
	readonly onSelectTheme: (themeId: string) => void;
	readonly onApplyCursorPack: (packId: string) => void;
	readonly onOpenTomeTopic: (topic: string) => void;
	readonly onDispatchIntent: (kind: IntentKind, payload: Record<string, unknown>) => void;
	readonly onStartSpotlight: () => void;
	readonly onReplayHudSequence: () => void;
	readonly onSaveWorkspace: () => void;
	readonly onClose: () => void;
}

export const SEARCH_CATEGORIES: readonly { id: SearchCategory; label: string }[] = [
	{ id: 'ALL', label: 'All' },
	{ id: 'ACTIONS', label: 'Actions & MCP' },
	{ id: 'ENTITIES', label: 'Entities' },
	{ id: 'PROJECTS', label: 'Projects & Samples' },
	{ id: 'TOME', label: 'Field Tome' },
	{ id: 'THEMES', label: 'Themes & Cursors' },
	{ id: 'SHORTCUTS', label: 'Shortcuts' }
];

function buildActionAndMcpItems(ctx: SearchCatalogContext): SearchItem[] {
	const sc = ctx.shortcutOverrides;
	const actions: SearchItem[] = [
		{ id: 'act-wireframe', category: 'ACTIONS', title: 'Wireframe & Radar Skeleton Workbench', subtitle: 'Open interactive wireframe skeleton & perimeter radar modal', badge: formatShortcutBadge('open-wireframe-radar', sc) || 'MODAL', icon: 'radar', run: () => ctx.onOpenModal('radar-skeleton') },
		{ id: 'act-wire-obs', category: 'ACTIONS', title: 'Dual-Spine Live Wire Observatory', subtitle: 'Inspect real-time DAG envelopes and human time-scale packets', badge: 'MODAL', icon: 'wire', run: () => ctx.onOpenModal('wire') },
		{ id: 'act-station', category: 'ACTIONS', title: 'Station Builder & Geometry Workbench', subtitle: 'Configure station layers, corner radius, and time-scale knobs', badge: 'MODAL', icon: 'settings', run: () => ctx.onOpenModal('station-builder') },
		{ id: 'act-zones', category: 'ACTIONS', title: '11-Zone Perimeter Disposition Editor', subtitle: 'Edit HUD zone visibility, shapes, and bilateral mirroring', badge: 'MODAL', icon: 'layers', run: () => ctx.onOpenModal('zone-edition') },
		{ id: 'act-cursors', category: 'ACTIONS', title: '21-State Cursor Studio Workbench', subtitle: 'Customize frameless 32x32 cursor silhouettes and hotspots', badge: 'MODAL', icon: 'star', run: () => ctx.onOpenModal('cursors') },
		{ id: 'act-settings', category: 'ACTIONS', title: 'Studio Settings & Shortcuts', subtitle: 'Configure AI models, visuals, input modality, and keyboard shortcuts', badge: formatShortcutBadge('open-settings', sc) || 'MODAL', icon: 'settings', run: () => ctx.onOpenModal('settings') },
		{ id: 'act-export', category: 'ACTIONS', title: 'Build & Portable Export Dialog', subtitle: 'Compile static bundle or export full-stack project manifest', badge: formatShortcutBadge('open-export', sc) || 'MODAL', icon: 'export', run: () => ctx.onOpenModal('export') },
		{ id: 'act-hud', category: 'ACTIONS', title: 'Toggle Studio HUD / Calm View', subtitle: 'Switch between Calm Genesis View and 11-Zone Builder Studio HUD', badge: formatShortcutBadge('toggle-studio-chrome', sc), icon: 'layers', run: () => { ctx.onDispatchIntent('UI_TOGGLE_STUDIO_CHROME', {}); ctx.onClose(); } },
		{ id: 'act-save', category: 'ACTIONS', title: 'Save Project Snapshot', subtitle: 'Persist current workspace nodes and studio defaults', badge: formatShortcutBadge('project-save', sc), icon: 'check', run: () => { ctx.onSaveWorkspace(); ctx.onClose(); } },
		{ id: 'act-spotlight', category: 'ACTIONS', title: 'Start Guided Spotlight Tour', subtitle: 'Launch interactive spotlight walkthrough of Studio zones', badge: 'TOUR', icon: 'spotlight', run: () => { ctx.onClose(); ctx.onStartSpotlight(); } },
		{ id: 'act-replay-hud', category: 'ACTIONS', title: 'Replay HUD Reveal Sequence', subtitle: 'Re-run sequential perimeter zone reveal choreography', badge: 'MOTION', icon: 'play', run: () => ctx.onReplayHudSequence() }
	];
	const mcp: SearchItem[] = STUDIO_TOOL_REGISTRY.slice(0, 18).map((t) => ({
		id: `mcp-${t.name}`, category: 'ACTIONS', title: `${t.humanTitle} (${t.name})`,
		subtitle: t.plainDescription, badge: 'MCP TOOL', icon: t.icon,
		run: () => { ctx.onDispatchIntent(t.intentKind, {}); ctx.onClose(); }
	}));
	return [...actions, ...mcp];
}

export function buildGlobalSearchItems(ctx: SearchCatalogContext): readonly SearchItem[] {
	const entityItems: SearchItem[] = ctx.entities.map((e) => ({
		id: `ent-${e.uuid}`, category: 'ENTITIES', title: `${e.label} (${e.kind})`,
		subtitle: `Zone ${e.zoneId} · Shape ${e.shape} · UUID ${shortUuid(e.uuid)}`, badge: e.zoneId, icon: 'layers',
		run: () => { ctx.onInspectEntity(e.uuid); ctx.onClose(); }
	}));
	const projectItems: SearchItem[] = [
		...ctx.projects.map((p) => ({
			id: `proj-${p.id}`, category: 'PROJECTS' as const, title: `Project: ${p.name}`,
			subtitle: `${p.nodes.length} nodes · Theme ${p.themeId}${p.id === ctx.activeProjectId ? ' (Active)' : ''}`,
			badge: 'PROJECT', icon: 'folder' as UiIconName, run: () => { ctx.onSelectProject(p.id); ctx.onClose(); }
		})),
		...STARTER_SAMPLE_PROJECTS.map((s) => ({
			id: `sample-${s.id}`, category: 'PROJECTS' as const, title: `Sample: ${s.title}`,
			subtitle: s.tagline, badge: 'SAMPLE', icon: 'star' as UiIconName, run: () => { ctx.onLoadSample(s.id); ctx.onClose(); }
		}))
	];
	const tomeItems: SearchItem[] = TOME_SSG_CHAPTERS.map((ch) => ({
		id: `tome-${ch.id}`, category: 'TOME', title: ch.title, subtitle: ch.summary,
		badge: 'TOME', icon: 'help', run: () => ctx.onOpenTomeTopic(ch.contextTopic)
	}));
	const themeItems: SearchItem[] = [
		...ctx.themes.map((t) => ({
			id: `theme-${t.id}`, category: 'THEMES' as const, title: `Theme: ${t.name}`,
			subtitle: `${t.polarity.toUpperCase()} polarity · Primary ${t.tokens['--ui-primary']}`, badge: t.polarity.toUpperCase(),
			icon: 'palette' as UiIconName, run: () => { ctx.onSelectTheme(t.id); ctx.onClose(); }
		})),
		...ctx.cursorPacks.map((c) => ({
			id: `cursor-${c.uuid}`, category: 'THEMES' as const, title: `Cursor Pack: ${c.name}`,
			subtitle: `21-state frameless cursor pack (${c.slug})`, badge: 'CURSOR',
			icon: 'star' as UiIconName, run: () => { ctx.onApplyCursorPack(c.uuid); ctx.onClose(); }
		}))
	];
	const shortcutItems: SearchItem[] = getEffectiveShortcuts(ctx.shortcutOverrides).map((b) => ({
		id: `sc-${b.id}`, category: 'SHORTCUTS', title: b.label, subtitle: `${b.description} (${b.intent})`,
		badge: formatShortcutBadge(b.id, ctx.shortcutOverrides), icon: 'code',
		run: () => { ctx.onDispatchIntent(b.intent, { ...(b.payload ?? {}) }); if (b.intent !== 'UI_OPEN_MODAL') ctx.onClose(); }
	}));
	return [...buildActionAndMcpItems(ctx), ...entityItems, ...projectItems, ...tomeItems, ...themeItems, ...shortcutItems];
}
