import { HUD_ZONES, type HudZoneId } from '../tokens';
import type { UiComponentKind } from './node.types';

export interface UiPropSchemaField {
	readonly type: 'string' | 'number' | 'boolean' | 'enum';
	readonly label: string;
	readonly defaultValue: string | number | boolean;
	readonly options?: readonly string[];
}

export interface UiComponentSchema {
	readonly type: UiComponentKind;
	readonly label: string;
	readonly category: 'layout' | 'atom' | 'molecule' | 'organism';
	readonly memoryWeight: 'light' | 'medium' | 'heavy';
	readonly allowedZones: readonly HudZoneId[];
	readonly emittedIntents: readonly string[];
	readonly propSchema: Readonly<Record<string, UiPropSchemaField>>;
}

const ALL_ZONES: readonly HudZoneId[] = HUD_ZONES;

export const COMPONENT_CATALOG: readonly UiComponentSchema[] = [
	{
		type: 'UiSection', label: 'Chamfer Section', category: 'layout', memoryWeight: 'light',
		allowedZones: ['WORLD_CANVAS', 'LEFT_EDGE', 'RIGHT_EDGE'], emittedIntents: ['UI_SELECT_NODE'],
		propSchema: {
			title: { type: 'string', label: 'Heading', defaultValue: 'Live Workspace Panel' },
			subtitle: { type: 'string', label: 'Subtitle', defaultValue: 'Interactive Svelte 5 component' },
			accent: { type: 'enum', label: 'Accent', defaultValue: 'primary', options: ['primary', 'secondary', 'accent', 'neutral'] }
		}
	},
	{
		type: 'UiHeaderBar', label: 'Perimeter Header Bar', category: 'organism', memoryWeight: 'light',
		allowedZones: ['TOP_CENTER', 'TOP_LEFT', 'TOP_RIGHT', 'WORLD_CANVAS'], emittedIntents: ['UI_SET_ACTIVE_VIEW', 'UI_TOGGLE_POLARITY'],
		propSchema: {
			title: { type: 'string', label: 'Brand Title', defaultValue: 'Mission Control' },
			tabs: { type: 'string', label: 'Comma Tabs', defaultValue: 'Overview,Metrics,Logs' },
			showThemeToggle: { type: 'boolean', label: 'Theme Toggle', defaultValue: true }
		}
	},
	{
		type: 'UiProjectDeck', label: 'Horizontal Tab Deck', category: 'molecule', memoryWeight: 'light',
		allowedZones: ['PROJECT_TAB_DECK', 'TOP_CENTER', 'WORLD_CANVAS'], emittedIntents: ['UI_SET_ACTIVE_TAB'],
		propSchema: {
			items: { type: 'string', label: 'Tab Labels', defaultValue: 'Alpha,Beta,Gamma' }
		}
	},
	{
		type: 'UiMetricCard', label: 'Metric Readout Card', category: 'molecule', memoryWeight: 'light',
		allowedZones: ['WORLD_CANVAS', 'TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT'], emittedIntents: ['UI_SELECT_NODE'],
		propSchema: {
			title: { type: 'string', label: 'Metric Label', defaultValue: 'Throughput' },
			value: { type: 'string', label: 'Metric Value', defaultValue: '60 FPS' },
			delta: { type: 'string', label: 'Delta', defaultValue: '0ms drift' }
		}
	},
	{
		type: 'UiActionBar', label: 'Command Action Bar', category: 'molecule', memoryWeight: 'light',
		allowedZones: ['BOTTOM_CENTER', 'TOP_RIGHT', 'WORLD_CANVAS'], emittedIntents: ['STUDIO_COMMAND_EXEC'],
		propSchema: {
			actions: { type: 'string', label: 'Action Labels', defaultValue: 'Deploy,Inspect,Reset' }
		}
	},
	{
		type: 'UiProgressGauge', label: 'Progress Gauge', category: 'atom', memoryWeight: 'light',
		allowedZones: ALL_ZONES, emittedIntents: [],
		propSchema: {
			label: { type: 'string', label: 'Label', defaultValue: 'Sync Coverage' },
			value: { type: 'number', label: 'Value', defaultValue: 72 },
			max: { type: 'number', label: 'Max', defaultValue: 100 }
		}
	},
	{
		type: 'UiBentoRadar', label: 'Bento Tactical Radar', category: 'organism', memoryWeight: 'medium',
		allowedZones: ['BOTTOM_RIGHT', 'WORLD_CANVAS'], emittedIntents: ['UI_STAGE_PAN_ZOOM'],
		propSchema: {
			zoom: { type: 'number', label: 'Initial Zoom', defaultValue: 1 },
			activeZoneCount: { type: 'number', label: 'Tracked Zones', defaultValue: 3 }
		}
	},
	{
		type: 'UiBadge', label: 'Semantic Badge', category: 'atom', memoryWeight: 'light',
		allowedZones: ALL_ZONES, emittedIntents: [],
		propSchema: {
			label: { type: 'string', label: 'Text', defaultValue: 'Active' },
			tone: { type: 'enum', label: 'Tone', defaultValue: 'primary', options: ['neutral', 'primary', 'secondary', 'accent', 'success', 'warning', 'error'] }
		}
	},
	{
		type: 'UiChamferButton', label: 'Chamfer Action Button', category: 'atom', memoryWeight: 'light',
		allowedZones: ALL_ZONES, emittedIntents: ['STUDIO_COMMAND_EXEC'],
		propSchema: {
			label: { type: 'string', label: 'Button Label', defaultValue: 'Execute Action' },
			variant: { type: 'enum', label: 'Variant', defaultValue: 'primary', options: ['surface', 'primary', 'secondary', 'ghost', 'danger'] }
		}
	},
	{
		type: 'UiMathFormula', label: 'MathML Formula Block', category: 'atom', memoryWeight: 'light',
		allowedZones: ['WORLD_CANVAS', 'LEFT_EDGE', 'RIGHT_EDGE'], emittedIntents: [],
		propSchema: {
			lhs: { type: 'string', label: 'LHS', defaultValue: 'XP(n)' },
			rhs: { type: 'string', label: 'RHS', defaultValue: 'n^3' }
		}
	},
	{
		type: 'UiWireInspector', label: 'Live Wire Observatory', category: 'organism', memoryWeight: 'heavy',
		allowedZones: ['BOTTOM_LEFT', 'WORLD_CANVAS', 'RIGHT_EDGE'], emittedIntents: [],
		propSchema: {
			title: { type: 'string', label: 'Inspector Title', defaultValue: 'DAG Wire Stream' }
		}
	},
	{
		type: 'UiEventGraph', label: 'Live Event Graph', category: 'organism', memoryWeight: 'medium',
		allowedZones: ['WORLD_CANVAS', 'BOTTOM_LEFT', 'RIGHT_EDGE'], emittedIntents: ['UI_GRAPH_SELECT_NODE', 'UI_GRAPH_SELECT_EDGE', 'UI_GRAPH_FIT'],
		propSchema: {
			title: { type: 'string', label: 'Graph Title', defaultValue: 'Event Topology' },
			routing: { type: 'enum', label: 'Wire Routing', defaultValue: 'BEZIER', options: ['BEZIER', 'ORTHOGONAL', 'STEP'] },
			nodeShape: { type: 'enum', label: 'Node Shape', defaultValue: 'BOX', options: ['BOX', 'HEXAGON', 'OCTAGON', 'CAPSULE', 'DIAMOND', 'UML_COMPONENT'] },
			timeScaleMultiplier: { type: 'number', label: 'Time Scale', defaultValue: 2500 },
			showPackets: { type: 'boolean', label: 'Animate Packets', defaultValue: true }
		}
	}
] as const;

export function findComponentSchema(type: UiComponentKind): UiComponentSchema {
	return COMPONENT_CATALOG.find((c) => c.type === type) ?? COMPONENT_CATALOG[0];
}
