import type { CornerKind, UiComponentKind, UiNode, WireTraceRecord } from '@chronos-ui/svelte';
import type { Component, Snippet } from 'svelte';
import UiLiveNodeWidget from './UiLiveNodeWidget.svelte';

export interface LiveNodeRenderProps {
	node: UiNode;
	cornerMode: CornerKind;
	traces?: readonly WireTraceRecord[];
	selected: boolean;
	childrenSlot?: Snippet;
	onSelect: (id: string) => void;
	onNodeAction: (node: UiNode, actionLabel: string) => void;
}

const CLIENT_COMPONENT_REGISTRY = new Map<UiComponentKind, Component<LiveNodeRenderProps>>([
	['UiSection', UiLiveNodeWidget],
	['UiHeaderBar', UiLiveNodeWidget],
	['UiProjectDeck', UiLiveNodeWidget],
	['UiMetricCard', UiLiveNodeWidget],
	['UiActionBar', UiLiveNodeWidget],
	['UiProgressGauge', UiLiveNodeWidget],
	['UiBentoRadar', UiLiveNodeWidget],
	['UiBadge', UiLiveNodeWidget],
	['UiChamferButton', UiLiveNodeWidget],
	['UiMathFormula', UiLiveNodeWidget],
	['UiWireInspector', UiLiveNodeWidget],
	['UiEventGraph', UiLiveNodeWidget]
]);

export function resolveClientComponent(type: UiComponentKind): Component<LiveNodeRenderProps> {
	return CLIENT_COMPONENT_REGISTRY.get(type) ?? UiLiveNodeWidget;
}
