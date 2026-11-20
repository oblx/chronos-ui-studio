import type { SpotlightStep, ViewportTier } from '@chronos-ui/svelte';

export interface ViewportPreset {
	readonly tier: ViewportTier;
	readonly label: string;
	readonly widthPx: number;
	readonly heightPx: number;
}

export const VIEWPORT_PRESETS: readonly ViewportPreset[] = [
	{ tier: 'PHONE', label: 'Phone (390)', widthPx: 390, heightPx: 844 },
	{ tier: 'TABLET_PORTRAIT', label: 'Tablet P (820)', widthPx: 820, heightPx: 1080 },
	{ tier: 'TABLET_LANDSCAPE', label: 'Tablet L (1100)', widthPx: 1100, heightPx: 768 },
	{ tier: 'DESKTOP', label: 'Desktop (1440)', widthPx: 1440, heightPx: 900 },
	{ tier: 'WQHD_UWQHD', label: 'UWQHD (2560)', widthPx: 2560, heightPx: 1080 }
] as const;

export const STUDIO_SPOTLIGHT_STEPS: readonly SpotlightStep[] = [
	{
		id: 'step-top-left',
		targetIds: ['spot-top-left'],
		title: 'System Crest & Progression',
		body: 'TOP_LEFT anchors the active blueprint grade, level gauge, and corner posture at a unified 6.25rem band height.'
	},
	{
		id: 'step-rails',
		targetIds: ['edge-rail-left', 'edge-rail-right'],
		title: 'Dual Edge Rails & Dotted Grip',
		body: 'Click either dotted grip to detach a floating drawer or drag 5px+ to slide along the edge with 0px canvas shift.'
	},
	{
		id: 'step-utilities',
		targetIds: ['spot-top-right'],
		title: 'Off-When-Idle Utility Cluster',
		body: 'Bilateral mirror of TOP_LEFT hosting User, Wire Tap, Polarity, Contextual Help (F1), and Settings triggers.'
	},
	{
		id: 'step-radar',
		targetIds: ['spot-bottom-right'],
		title: '3-Column Bento Radar',
		body: 'Tracks live stage pan/zoom coordinates flanked by symmetrical quick-action buttons inside the 8.25rem bottom dock.'
	}
] as const;

export const STUDIO_LEFT_TABS = [
	{ id: 'zones', label: 'Zones', icon: 'layers' as const },
	{ id: 'blueprints', label: 'Blueprints', icon: 'book' as const },
	{ id: 'spotlight', label: 'Tour', icon: 'spotlight' as const }
] as const;

export const STUDIO_RIGHT_TABS = [
	{ id: 'themes', label: 'Themes', icon: 'palette' as const },
	{ id: 'export', label: 'Export', icon: 'export' as const }
] as const;

export const STUDIO_VIEWS = [
	{ id: 'WORKBENCH' as const, label: 'Workbench', topic: 'composer' },
	{ id: 'THEMES' as const, label: 'Tokens', topic: 'theme' },
	{ id: 'BLUEPRINTS' as const, label: 'Decks', topic: 'stage' },
	{ id: 'MCP_TWIN' as const, label: 'Twin MCP', topic: 'mcp' }
] as const;
