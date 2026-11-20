<script lang="ts">
	import { UiBentoRadar, uiSpotlight, type CornerKind, type RadarActionItem, type RegisteredUiEntity } from '@chronos-ui/svelte';
	import type { ZoneBlueprintConfig } from '../../config';

	interface Props {
		cornerMode: CornerKind;
		zoneConfig?: ZoneBlueprintConfig;
		zoom: number;
		panX: number;
		panY: number;
		activeZoneCount: number;
		entities?: readonly RegisteredUiEntity[];
		selectedUuid?: string | null;
		onOpenSkeleton?: () => void;
		onZoomIn: () => void;
		onZoomOut: () => void;
		onResetCamera: () => void;
		onToggleLeftDrawer: () => void;
		onToggleRightDrawer: () => void;
		onStartSpotlight: () => void;
	}

	let {
		cornerMode,
		zoneConfig,
		zoom,
		panX,
		panY,
		activeZoneCount,
		entities = [],
		selectedUuid = null,
		onOpenSkeleton,
		onZoomIn,
		onZoomOut,
		onResetCamera,
		onToggleLeftDrawer,
		onToggleRightDrawer,
		onStartSpotlight
	}: Props = $props();

	let leftActions = $derived<readonly RadarActionItem[]>([
		{ id: 'zoom-in', label: 'Zoom in stage', icon: 'plus', onClick: onZoomIn },
		{ id: 'zoom-out', label: 'Zoom out stage', icon: 'minus', onClick: onZoomOut },
		{ id: 'reset', label: 'Reset camera', icon: 'reset', onClick: onResetCamera }
	]);

	let rightActions = $derived<readonly RadarActionItem[]>([
		{ id: 'skeleton', label: 'Wireframe skeleton', icon: 'radar', onClick: () => onOpenSkeleton?.() },
		{ id: 'left-rail', label: 'Toggle composer drawer', icon: 'layers', onClick: onToggleLeftDrawer },
		{ id: 'tour', label: 'Launch spotlight tour', icon: 'spotlight', onClick: onStartSpotlight }
	]);
</script>

<div use:uiSpotlight={'spot-bottom-right'} class="h-full w-full">
	<UiBentoRadar
		{leftActions}
		{rightActions}
		{zoom}
		{panX}
		{panY}
		{activeZoneCount}
		{cornerMode}
		corners={zoneConfig?.corners}
		cornerRadiusRem={zoneConfig?.cornerRadiusRem}
		shape={zoneConfig?.shape}
		cornerEmbellishment={zoneConfig?.cornerEmbellishment}
		cornerAnimation={zoneConfig?.cornerAnimation}
		{entities}
		{selectedUuid}
		{onOpenSkeleton}
	/>
</div>
