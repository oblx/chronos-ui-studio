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
		title: 'System Crest & Save Actions',
		body: 'TOP_LEFT anchors the active blueprint grade, perimeter coverage gauge, Save trigger, and Reset recovery control.'
	},
	{
		id: 'step-top-center',
		targetIds: ['spot-top-center'],
		title: 'View Switcher & Calm View Toggle',
		body: 'TOP_CENTER switches Workbench, Tokens, Decks, and Twin MCP cleanly and returns to Calm View from the exact same desktop coordinate.'
	},
	{
		id: 'step-edge-rails',
		targetIds: ['spot-edge-rails', 'spot-edge-rail-right'],
		title: 'Unified Left Build & Right Inspector Rails',
		body: 'LEFT_EDGE unifies Build, Zones, Blueprints, and Tour; RIGHT_EDGE unifies Inspector, Themes, and Export with persistent folded icon tabs.'
	},
	{
		id: 'step-assistant-dock',
		targetIds: ['hud-assistant-dock'],
		title: 'Discover the AI Build Assistant',
		body: 'Generate live UI components with natural language, voice capture, or /build and /reject slash commands directly from the docked BOTTOM_CENTER console.',
		drillLabel: 'Try Prompt: "Add Metric Card"',
		drillPrompt: 'Add Metric Card'
	},
	{
		id: 'step-station-zone',
		targetIds: ['spot-station-zone'],
		title: 'Station Builder & Zone Edition',
		body: 'Open live-preview Station tuning and 11-zone bilateral disposition controls directly from the top deck.'
	},
	{
		id: 'step-bento-radar',
		targetIds: ['spot-bento-radar'],
		title: 'Bento Radar & CS6 Wireframe Workbench',
		body: 'Click the live radar viewport or wireframe trigger to launch the 5-panel CS6 Wireframe Skeleton Workbench with Eye/Lock layers.'
	},
	{
		id: 'step-export-pipeline',
		targetIds: ['spot-export-pipeline'],
		title: 'Export, Static WebMCP & Full-Stack Bundle',
		body: 'Export W3C/Lighthouse static builds with WebMCP manifests or a standalone vendored SQLite + Drizzle backend bundle.'
	}
] as const;

export const STUDIO_LEFT_TABS = [
	{ id: 'build', label: 'Build', icon: 'wrench' as const },
	{ id: 'zones', label: 'Zones', icon: 'layers' as const },
	{ id: 'blueprints', label: 'Blueprints', icon: 'book' as const },
	{ id: 'tour', label: 'Tour', icon: 'spotlight' as const }
] as const;

export const STUDIO_RIGHT_TABS = [
	{ id: 'inspector', label: 'Inspector', icon: 'sliders' as const },
	{ id: 'themes', label: 'Themes', icon: 'palette' as const },
	{ id: 'export', label: 'Export', icon: 'export' as const }
] as const;

export const STUDIO_VIEWS = [
	{ id: 'WORKBENCH' as const, label: 'Workbench', topic: 'composer' },
	{ id: 'THEMES' as const, label: 'Tokens', topic: 'theme' },
	{ id: 'BLUEPRINTS' as const, label: 'Decks', topic: 'stage' },
	{ id: 'MCP_TWIN' as const, label: 'Twin MCP', topic: 'mcp' }
] as const;
