import {
	STUDIO_KNOB_DEFAULTS,
	type CornerEmbellishment,
	type CornerTuple,
	type GraphEdgeRouting,
	type UiFrameShape,
	type WireTimeScaleCurve
} from '@ui/tokens';

export const LANE_HEADER_BAND_PX = 40;
export const LANE_HEADER_PAD_PX = 14;
export const GRAPH_NODE_WIDTH_PX = 186;
export const GRAPH_NODE_HEIGHT_PX = 52;

export type UiGraphNodeStatus = 'NOMINAL' | 'ACTIVE' | 'WARN' | 'BLOCKED';
export type UiGraphTone = 'primary' | 'secondary' | 'accent' | 'info' | 'warning' | 'error' | 'neutral';

export interface UiGraphLane {
	readonly id: string;
	readonly title: string;
	readonly order: number;
	readonly accentTone?: UiGraphTone;
	readonly dimmed?: boolean;
}

export interface UiGraphNode {
	readonly uuid: string;
	readonly laneId: string;
	readonly label: string;
	readonly subtitle?: string;
	readonly shape: UiFrameShape;
	readonly corners?: CornerTuple;
	readonly embellishment?: CornerEmbellishment;
	readonly status: UiGraphNodeStatus;
	readonly portsIn: number;
	readonly portsOut: number;
	readonly metricsLine?: string;
	readonly dimmed?: boolean;
}

export interface UiGraphEdge {
	readonly id: string;
	readonly fromNodeUuid: string;
	readonly toNodeUuid: string;
	readonly fromPort?: number;
	readonly toPort?: number;
	readonly routing?: GraphEdgeRouting;
	readonly label?: string;
	readonly animated?: boolean;
	readonly highlighted?: boolean;
	readonly dimmed?: boolean;
}

export interface UiGraphPacket {
	readonly id: string;
	readonly edgeId: string;
	readonly realDurationMs: number;
	readonly scaledDurationMs: number;
	readonly tone?: UiGraphTone;
	readonly label?: string;
	readonly spawnedAtMs: number;
}

export interface UiGraphConfig {
	readonly routing: GraphEdgeRouting;
	readonly nodeShape: UiFrameShape;
	readonly laneGapRem: number;
	readonly nodeGapRem: number;
	readonly showPorts: boolean;
	readonly showLaneHeaders: boolean;
	readonly showPackets: boolean;
	readonly timeScaleMultiplier: number;
	readonly timeScaleCurve: WireTimeScaleCurve;
	readonly packetSizePx: number;
	readonly fitPaddingRem: number;
}

export const DEFAULT_UI_GRAPH_CONFIG: UiGraphConfig = {
	routing: STUDIO_KNOB_DEFAULTS.graphRouting,
	nodeShape: 'BOX',
	laneGapRem: 3,
	nodeGapRem: 0.875,
	showPorts: true,
	showLaneHeaders: true,
	showPackets: true,
	timeScaleMultiplier: STUDIO_KNOB_DEFAULTS.wireTimeScaleMultiplier,
	timeScaleCurve: STUDIO_KNOB_DEFAULTS.wireTimeScaleCurve,
	packetSizePx: STUDIO_KNOB_DEFAULTS.graphPacketSizePx,
	fitPaddingRem: 1
} as const;
