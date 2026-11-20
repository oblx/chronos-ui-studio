import { deterministicUuidV7Seed, HUD_METRICS, type CornerKind, type HudZoneId, type UiNode } from '@chronos-ui/svelte';
import { SHAPE_MATRIX_NODES } from './sample.matrix';

export interface StarterSampleProject {
	readonly id: string;
	readonly title: string;
	readonly tagline: string;
	readonly themeId: string;
	readonly cornerMode: CornerKind;
	readonly nodes: readonly UiNode[];
}

export const SAMPLE_LOAD_CHOREOGRAPHY = {
	stepDelayMs: HUD_METRICS.sampleStepMs,
	zoneBandOrder: {
		TOP_LEFT: 0, TOP_CENTER: 0, TOP_RIGHT: 0, PROJECT_TAB_DECK: 0,
		LEFT_EDGE: 1, RIGHT_EDGE: 1, WORLD_CANVAS: 2,
		BOTTOM_LEFT: 3, BOTTOM_CENTER: 3, BOTTOM_RIGHT: 3
	} as Readonly<Record<HudZoneId, number>>
} as const;

const uid = deterministicUuidV7Seed;

export const STARTER_SAMPLE_PROJECTS: readonly StarterSampleProject[] = [
	{
		id: 'sample-neon-ops', title: 'Neon Ops Command Deck',
		tagline: 'Obsidian Brass perimeter HUD with live telemetry KPIs & tactical radar',
		themeId: 'obsidian-brass', cornerMode: 'CHAMFER',
		nodes: [
			{ id: uid('ops-nav'), type: 'UiHeaderBar', zone: 'TOP_CENTER', label: 'Ops Crown', lifecycle: 'COMMITTED', props: { title: 'NEON OPS', tabs: 'Overview,Fleet,Alerts,Topology', showThemeToggle: true } },
			{ id: uid('ops-kpi-1'), type: 'UiMetricCard', zone: 'WORLD_CANVAS', label: 'Throughput KPI', lifecycle: 'COMMITTED', props: { title: 'Events / Sec', value: '148.2k', delta: '+14.2%' } },
			{ id: uid('ops-kpi-2'), type: 'UiMetricCard', zone: 'WORLD_CANVAS', label: 'P99 Latency', lifecycle: 'COMMITTED', props: { title: 'P99 Wire Latency', value: '0.42 ms', delta: '-0.11 ms' } },
			{ id: uid('ops-section'), type: 'UiSection', zone: 'WORLD_CANVAS', label: 'Cluster Overview', lifecycle: 'COMMITTED', props: { title: 'Global Cluster Health', subtitle: 'Sub-millisecond event bus synced across 14 edge regions', accent: 'primary' } },
			{ id: uid('ops-gauge'), type: 'UiProgressGauge', zone: 'WORLD_CANVAS', label: 'Edge Sync Gauge', lifecycle: 'COMMITTED', props: { label: 'Cluster Sync', value: 96, max: 100 } },
			{ id: uid('ops-wire'), type: 'UiWireInspector', zone: 'BOTTOM_LEFT', label: 'Live Wire Stream', lifecycle: 'COMMITTED', props: { title: 'DAG Wire Stream' } },
			{ id: uid('ops-radar'), type: 'UiBentoRadar', zone: 'BOTTOM_RIGHT', label: 'Tactical Radar', lifecycle: 'COMMITTED', props: { zoom: 1, activeZoneCount: 7 } }
		]
	},
	{
		id: 'sample-bio-lab', title: 'Bio-Telemetry Lab',
		tagline: 'Alabaster Lab light cockpit with assay gauges & mathematical readouts',
		themeId: 'alabaster-lab', cornerMode: 'CHAMFER',
		nodes: [
			{ id: uid('bio-nav'), type: 'UiHeaderBar', zone: 'TOP_CENTER', label: 'Lab Header', lifecycle: 'COMMITTED', props: { title: 'BIO-LAB OS', tabs: 'Assays,Spectra,Protocols', showThemeToggle: true } },
			{ id: uid('bio-kpi-1'), type: 'UiMetricCard', zone: 'WORLD_CANVAS', label: 'Culture Temp', lifecycle: 'COMMITTED', props: { title: 'Incubator Temp', value: '37.0 C', delta: 'STABLE' } },
			{ id: uid('bio-kpi-2'), type: 'UiMetricCard', zone: 'WORLD_CANVAS', label: 'O2 Saturation', lifecycle: 'COMMITTED', props: { title: 'Dissolved O2', value: '98.4%', delta: '+0.6%' } },
			{ id: uid('bio-gauge'), type: 'UiProgressGauge', zone: 'WORLD_CANVAS', label: 'Optical Density', lifecycle: 'COMMITTED', props: { label: 'Assay Saturation', value: 84, max: 100 } },
			{ id: uid('bio-math'), type: 'UiMathFormula', zone: 'WORLD_CANVAS', label: 'Growth Equation', lifecycle: 'COMMITTED', props: { lhs: 'N(t)', rhs: 'N_0 e^{rt}' } },
			{ id: uid('bio-actions'), type: 'UiActionBar', zone: 'WORLD_CANVAS', label: 'Lab Controls', lifecycle: 'COMMITTED', props: { actions: 'Log Sample,Calibrate,Export CSV' } }
		]
	},
	{
		id: 'sample-synth-console', title: 'Synth Audio Console',
		tagline: 'Tokyo Phosphor studio desk with harmonic meters & patch triggers',
		themeId: 'tokyo-phosphor', cornerMode: 'CHAMFER',
		nodes: [
			{ id: uid('syn-nav'), type: 'UiHeaderBar', zone: 'TOP_CENTER', label: 'Synth Header', lifecycle: 'COMMITTED', props: { title: 'PHOSPHOR SYNTH', tabs: 'Oscillators,Matrix,Master', showThemeToggle: false } },
			{ id: uid('syn-deck'), type: 'UiProjectDeck', zone: 'PROJECT_TAB_DECK', label: 'Patch Banks', lifecycle: 'COMMITTED', props: { items: 'Bank A,Bank B,Arp Live,Master Bus' } },
			{ id: uid('syn-kpi'), type: 'UiMetricCard', zone: 'WORLD_CANVAS', label: 'Master Clock', lifecycle: 'COMMITTED', props: { title: 'Master Tempo', value: '128 BPM', delta: 'LOCKED' } },
			{ id: uid('syn-gauge'), type: 'UiProgressGauge', zone: 'WORLD_CANVAS', label: 'Filter Cutoff', lifecycle: 'COMMITTED', props: { label: 'Resonance Envelope', value: 74, max: 100 } },
			{ id: uid('syn-actions'), type: 'UiActionBar', zone: 'WORLD_CANVAS', label: 'Transport Bar', lifecycle: 'COMMITTED', props: { actions: 'Arm Sequence,Quantize,Record Stem' } }
		]
	},
	{
		id: 'sample-writers-cockpit', title: "Writer's Focus Cockpit",
		tagline: 'Archival Vellum straight-corner manuscript & chapter outline workspace',
		themeId: 'archival-vellum', cornerMode: 'STRAIGHT',
		nodes: [
			{ id: uid('wri-nav'), type: 'UiHeaderBar', zone: 'TOP_CENTER', label: 'Manuscript Header', lifecycle: 'COMMITTED', props: { title: 'ARCHIVAL DRAFT', tabs: 'Outline,Manuscript,Notes', showThemeToggle: true } },
			{ id: uid('wri-section'), type: 'UiSection', zone: 'WORLD_CANVAS', label: 'Chapter Beat', lifecycle: 'COMMITTED', props: { title: 'Chapter IV: Calm Tools', subtitle: 'Clean hierarchy, high readability, and zero ambient noise.', accent: 'primary' } },
			{ id: uid('wri-kpi'), type: 'UiMetricCard', zone: 'WORLD_CANVAS', label: 'Word Count', lifecycle: 'COMMITTED', props: { title: 'Session Words', value: '1,840', delta: '+420 today' } },
			{ id: uid('wri-gauge'), type: 'UiProgressGauge', zone: 'WORLD_CANVAS', label: 'Draft Goal', lifecycle: 'COMMITTED', props: { label: 'Daily Target', value: 92, max: 100 } },
			{ id: uid('wri-badge'), type: 'UiBadge', zone: 'TOP_LEFT', label: 'Draft State', lifecycle: 'COMMITTED', props: { label: 'Focus Mode', tone: 'secondary' } }
		]
	},
	{
		id: 'sample-shape-matrix', title: 'Shape Matrix Lab',
		tagline: 'All 14 true-contour UML & diagram hulls nested inside UUID v7 packages with diagonal drift',
		themeId: 'midnight-carbon', cornerMode: 'CHAMFER',
		nodes: SHAPE_MATRIX_NODES
	}
];

export function findStarterSample(sampleId: string): StarterSampleProject | undefined {
	return STARTER_SAMPLE_PROJECTS.find((s) => s.id === sampleId);
}

export function sortNodesForChoreography(nodes: readonly UiNode[]): readonly UiNode[] {
	return [...nodes].sort((a, b) => SAMPLE_LOAD_CHOREOGRAPHY.zoneBandOrder[a.zone] - SAMPLE_LOAD_CHOREOGRAPHY.zoneBandOrder[b.zone]);
}
