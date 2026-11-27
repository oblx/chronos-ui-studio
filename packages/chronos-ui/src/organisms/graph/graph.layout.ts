import { clamp, remToPx, type GraphEdgeRouting } from '@ui/tokens';
import {
	DEFAULT_UI_GRAPH_CONFIG, GRAPH_NODE_HEIGHT_PX, GRAPH_NODE_WIDTH_PX, LANE_HEADER_BAND_PX,
	LANE_HEADER_PAD_PX, type UiGraphConfig, type UiGraphEdge, type UiGraphLane, type UiGraphNode
} from './graph.types';

export interface GraphPoint { readonly x: number; readonly y: number; }
export interface GraphRect { readonly x: number; readonly y: number; readonly w: number; readonly h: number; }

export interface PositionedGraphLane {
	readonly lane: UiGraphLane;
	readonly x: number; readonly y: number; readonly w: number; readonly h: number;
	readonly headerRect: GraphRect;
}

export interface PositionedGraphNode {
	readonly node: UiGraphNode;
	readonly x: number; readonly y: number; readonly w: number; readonly h: number;
	readonly inPorts: readonly GraphPoint[];
	readonly outPorts: readonly GraphPoint[];
}

export interface UiGraphBounds {
	readonly minX: number; readonly minY: number; readonly maxX: number; readonly maxY: number;
	readonly width: number; readonly height: number;
}

export interface UiGraphLayoutResult {
	readonly lanes: readonly PositionedGraphLane[];
	readonly nodes: readonly PositionedGraphNode[];
	readonly nodeById: ReadonlyMap<string, PositionedGraphNode>;
	readonly bounds: UiGraphBounds;
}

export interface UiGraphFitTransform { readonly scale: number; readonly panX: number; readonly panY: number; }

function distributePorts(x: number, y: number, h: number, count: number): readonly GraphPoint[] {
	const safeCount = Math.max(0, Math.round(count));
	return Array.from({ length: safeCount }, (_, i) => ({ x, y: Number((y + ((i + 1) / (safeCount + 1)) * h).toFixed(2)) }));
}

function positionLaneNodes(
	laneNodes: readonly UiGraphNode[],
	lx: number,
	contentTop: number,
	stackHeight: number,
	maxRows: number,
	nodeGapPx: number
): PositionedGraphNode[] {
	const laneStackH = laneNodes.length > 0 ? laneNodes.length * GRAPH_NODE_HEIGHT_PX + (laneNodes.length - 1) * nodeGapPx : 0;
	const offsetY = laneNodes.length < maxRows ? Math.floor((stackHeight - laneStackH) * 0.5) : 0;
	return laneNodes.map((node, rowIdx) => {
		const ny = Math.max(contentTop, contentTop + offsetY + rowIdx * (GRAPH_NODE_HEIGHT_PX + nodeGapPx));
		return {
			node, x: lx, y: ny, w: GRAPH_NODE_WIDTH_PX, h: GRAPH_NODE_HEIGHT_PX,
			inPorts: distributePorts(lx, ny, GRAPH_NODE_HEIGHT_PX, node.portsIn),
			outPorts: distributePorts(lx + GRAPH_NODE_WIDTH_PX, ny, GRAPH_NODE_HEIGHT_PX, node.portsOut)
		};
	});
}

export function computeGraphLayout(
	lanes: readonly UiGraphLane[],
	nodes: readonly UiGraphNode[],
	configPatch?: Partial<UiGraphConfig>
): UiGraphLayoutResult {
	const cfg: UiGraphConfig = { ...DEFAULT_UI_GRAPH_CONFIG, ...configPatch };
	const sortedLanes = [...lanes].sort((a, b) => a.order - b.order);
	const padPx = Math.max(12, remToPx(cfg.fitPaddingRem));
	const laneGapPx = Math.max(24, remToPx(cfg.laneGapRem));
	const nodeGapPx = Math.max(8, remToPx(cfg.nodeGapRem));
	const byLane = new Map<string, UiGraphNode[]>(sortedLanes.map((l) => [l.id, []]));
	for (const node of nodes) byLane.get(node.laneId)?.push(node);
	const maxRows = Math.max(1, ...[...byLane.values()].map((list) => list.length));
	const contentTop = LANE_HEADER_BAND_PX + LANE_HEADER_PAD_PX;
	const stackHeight = maxRows * GRAPH_NODE_HEIGHT_PX + (maxRows - 1) * nodeGapPx;
	const totalHeight = contentTop + stackHeight + padPx;
	const positionedLanes: PositionedGraphLane[] = [];
	const positionedNodes: PositionedGraphNode[] = [];
	const nodeById = new Map<string, PositionedGraphNode>();

	sortedLanes.forEach((lane, laneIdx) => {
		const lx = padPx + laneIdx * (GRAPH_NODE_WIDTH_PX + laneGapPx);
		positionedLanes.push({ lane, x: lx, y: 0, w: GRAPH_NODE_WIDTH_PX, h: totalHeight, headerRect: { x: lx, y: 8, w: GRAPH_NODE_WIDTH_PX, h: 26 } });
		for (const pos of positionLaneNodes(byLane.get(lane.id) ?? [], lx, contentTop, stackHeight, maxRows, nodeGapPx)) {
			positionedNodes.push(pos);
			nodeById.set(pos.node.uuid, pos);
		}
	});
	const totalWidth = Math.max(padPx * 2 + GRAPH_NODE_WIDTH_PX, padPx * 2 + sortedLanes.length * GRAPH_NODE_WIDTH_PX + Math.max(0, sortedLanes.length - 1) * laneGapPx);
	return { lanes: positionedLanes, nodes: positionedNodes, nodeById, bounds: { minX: 0, minY: 0, maxX: totalWidth, maxY: totalHeight, width: totalWidth, height: totalHeight } };
}

export function buildGraphEdgePath(
	from: PositionedGraphNode,
	to: PositionedGraphNode,
	routing: GraphEdgeRouting = 'BEZIER',
	edge?: Pick<UiGraphEdge, 'fromPort' | 'toPort'>
): string {
	if (from.node.laneId === to.node.laneId) {
		const x = Number((from.x + from.w * 0.5).toFixed(2));
		return `M ${x} ${from.y <= to.y ? from.y + from.h : from.y} L ${x} ${from.y <= to.y ? to.y : to.y + to.h}`;
	}
	const p1 = from.outPorts[edge?.fromPort ?? 0] ?? { x: from.x + from.w, y: from.y + from.h * 0.5 };
	const p2 = to.inPorts[edge?.toPort ?? 0] ?? { x: to.x, y: to.y + to.h * 0.5 };
	const midX = Number(((p1.x + p2.x) * 0.5).toFixed(2));
	if (routing === 'ORTHOGONAL') return `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;
	if (routing === 'STEP') {
		const stepX = Number((p1.x + (p2.x - p1.x) * 0.72).toFixed(2));
		return `M ${p1.x} ${p1.y} L ${stepX} ${p1.y} L ${stepX} ${p2.y} L ${p2.x} ${p2.y}`;
	}
	return `M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`;
}

export function computeGraphFitTransform(
	bounds: UiGraphBounds,
	viewportRect: { readonly width: number; readonly height: number },
	fitPaddingPx = 16
): UiGraphFitTransform {
	const vw = Math.max(1, viewportRect.width), vh = Math.max(1, viewportRect.height);
	const bw = Math.max(1, bounds.width), bh = Math.max(1, bounds.height);
	const scale = Number(clamp(Math.min(Math.max(1, vw - fitPaddingPx * 2) / bw, Math.max(1, vh - fitPaddingPx * 2) / bh), 0.35, 1.5).toFixed(3));
	return {
		scale,
		panX: Number(((vw - bw * scale) * 0.5 - bounds.minX * scale).toFixed(2)),
		panY: Number(((vh - bh * scale) * 0.5 - bounds.minY * scale).toFixed(2))
	};
}
