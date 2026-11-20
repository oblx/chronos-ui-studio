<script lang="ts">
	import {
		LAYOUT_DENSITIES, UiChamferButton, UiChamferFrame, UiIcon, uiTransition, Z_LAYERS,
		type CornerKind, type HudZoneId, type LayoutDensity, type UiComponentKind
	} from '@chronos-ui/svelte';
	import { STARTER_SAMPLE_PROJECTS } from '@studio/config';
	import { STUDIO_TOOL_REGISTRY, type UiComponentPrototype } from '@studio/core/engine';

	interface Props {
		open: boolean;
		cornerMode: CornerKind;
		layoutDensity: LayoutDensity;
		prototypes: readonly UiComponentPrototype[];
		lastMcpActivity: string | null;
		canUndo: boolean;
		onSpawnQuick: (type: UiComponentKind, zone: HudZoneId, label: string, props: Record<string, unknown>) => void;
		onSpawnPrototype: (proto: UiComponentPrototype) => void;
		onLoadSample: (sampleId: string) => void;
		onSetDensity: (density: LayoutDensity) => void;
		onOpenExport: () => void;
		onOpenStationBuilder?: () => void;
		onOpenZoneEdition?: () => void;
		onUndo: () => void;
		onClose: () => void;
	}

	let { open, cornerMode, layoutDensity, prototypes, lastMcpActivity, canUndo, onSpawnQuick, onSpawnPrototype, onLoadSample, onSetDensity, onOpenExport, onOpenStationBuilder, onOpenZoneEdition, onUndo, onClose }: Props = $props();

	const QUICK_BLOCKS: readonly { label: string; desc: string; type: UiComponentKind; zone: HudZoneId; props: Record<string, unknown> }[] = [
		{ label: 'Metric Card', desc: 'Single KPI number with trend delta', type: 'UiMetricCard', zone: 'WORLD_CANVAS', props: { title: 'Active Sessions', value: '2,418', delta: '+18%' } },
		{ label: 'Header Bar', desc: 'Navigation header across top center', type: 'UiHeaderBar', zone: 'TOP_CENTER', props: { title: 'WORKSPACE', tabs: 'Overview,Metrics,Settings', showThemeToggle: true } },
		{ label: 'Content Section', desc: 'Headline card with subtitle & UML shape', type: 'UiSection', zone: 'WORLD_CANVAS', props: { title: 'Live Workspace Panel', subtitle: 'Select to customize UML shape, corners, or animation.', accent: 'primary' } },
		{ label: 'Progress Gauge', desc: 'Visual completion meter bar', type: 'UiProgressGauge', zone: 'WORLD_CANVAS', props: { label: 'Readiness Score', value: 86, max: 100 } },
		{ label: 'Action Bar', desc: 'Row of clickable command buttons', type: 'UiActionBar', zone: 'WORLD_CANVAS', props: { actions: 'Save,Preview,Export' } },
		{ label: 'Tactical Radar', desc: 'Bottom-right radar & zoom pod', type: 'UiBentoRadar', zone: 'BOTTOM_RIGHT', props: { zoom: 1, activeZoneCount: 4 } }
	];
</script>

{#if open}
	<aside
		aria-label="Visual Build Tool Palette"
		data-testid="studio-tool-palette"
		in:uiTransition={{ axis: 'x', offsetPx: -14 }}
		out:uiTransition={{ axis: 'x', offsetPx: -14 }}
		class="ui-scroll-deck fixed w-76 overflow-y-auto"
		style={`z-index: ${Z_LAYERS.studioChrome}; top: var(--ui-safe-top, 4.25rem); left: var(--ui-safe-side, 1rem); max-height: calc(100vh - var(--ui-safe-top, 4.25rem) - var(--ui-safe-bottom, 4.5rem));`}
	>
		<UiChamferFrame {cornerMode} carets={true} className="flex flex-col gap-3 p-3.5 text-xs">
			<div class="flex items-center justify-between gap-2 border-b pb-2" style="border-color: var(--ui-border-subtle);">
				<div>
					<div class="ui-font-display font-semibold">Build Palette</div>
					<div class="text-[0.68rem]" style="color: var(--ui-muted-content);">Safe-corridor anchored · Twin MCP parity</div>
				</div>
				<UiChamferButton {cornerMode} icon="close" tip="Close build palette" variant="ghost" onclick={onClose} className="px-1.5 py-0.5" />
			</div>

			<div class="flex items-center justify-between gap-1.5 border-b pb-2" style="border-color: var(--ui-border-subtle);">
				<span class="text-[0.68rem] font-semibold" style="color: var(--ui-muted-content);">Density</span>
				<div class="flex items-center gap-1">
					{#each LAYOUT_DENSITIES as d (d)}
						<UiChamferButton {cornerMode} label={d} active={layoutDensity === d} variant={layoutDensity === d ? 'primary' : 'surface'} onclick={() => onSetDensity(d)} className="px-1.5 py-0.5 text-[0.65rem]" />
					{/each}
				</div>
			</div>

			{#if onOpenStationBuilder || onOpenZoneEdition}
				<div class="grid grid-cols-2 gap-1.5 border-b pb-2" style="border-color: var(--ui-border-subtle);">
					{#if onOpenStationBuilder}<UiChamferButton {cornerMode} icon="sliders" label="Station Builder" variant="secondary" onclick={onOpenStationBuilder} className="w-full py-1 text-[0.66rem]" />{/if}
					{#if onOpenZoneEdition}<UiChamferButton {cornerMode} icon="grid" label="Zone Edition" variant="surface" onclick={onOpenZoneEdition} className="w-full py-1 text-[0.66rem]" />{/if}
				</div>
			{/if}
			{#if lastMcpActivity}
				<div class="flex items-center justify-between gap-2 border px-2 py-1.5" style="border-color: var(--ui-secondary); background-color: var(--ui-base-100);">
					<span class="ui-font-mono truncate text-[0.68rem]" style="color: var(--ui-secondary);">{lastMcpActivity}</span>
					{#if canUndo}
						<UiChamferButton {cornerMode} icon="undo" label="Undo" variant="ghost" onclick={onUndo} className="py-0.5 text-[0.65rem]" />
					{/if}
				</div>
			{/if}

			<div class="flex flex-col gap-1.5">
				<span class="font-semibold" style="color: var(--ui-muted-content);">Add Ready-Made Blocks</span>
				<div class="grid grid-cols-2 gap-1.5">
					{#each QUICK_BLOCKS as blk (blk.label)}
						<button type="button" data-ui-focusable="true"
							onclick={() => onSpawnQuick(blk.type, blk.zone, blk.label, blk.props)}
							class="flex flex-col items-start gap-0.5 border p-2 text-left transition-colors hover:opacity-90"
							style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100); color: var(--ui-base-content);">
							<span class="font-semibold">{blk.label}</span>
							<span class="text-[0.65rem] leading-tight" style="color: var(--ui-muted-content);">{blk.desc}</span>
						</button>
					{/each}
				</div>
			</div>

			{#if prototypes.length > 0}
				<div class="flex flex-col gap-1.5 border-t pt-2" style="border-color: var(--ui-border-subtle);">
					<span class="font-semibold" style="color: var(--ui-primary);">My Reusable Blueprints ({prototypes.length})</span>
					{#each prototypes as proto (proto.id)}
						<UiChamferButton {cornerMode} icon="copy" label={proto.name} variant="secondary" onclick={() => onSpawnPrototype(proto)} className="w-full justify-start py-1 text-xs" />
					{/each}
				</div>
			{/if}

			<div class="flex flex-col gap-1.5 border-t pt-2" style="border-color: var(--ui-border-subtle);">
				<span class="font-semibold" style="color: var(--ui-muted-content);">Starter Samples</span>
				<div class="flex flex-wrap gap-1">
					{#each STARTER_SAMPLE_PROJECTS as sample (sample.id)}
						<UiChamferButton {cornerMode} label={sample.title} variant="surface" onclick={() => onLoadSample(sample.id)} className="py-0.5 text-[0.68rem]" />
					{/each}
				</div>
			</div>

			<div class="flex flex-col gap-1 border-t pt-2" style="border-color: var(--ui-border-subtle);">
				<div class="flex items-center justify-between">
					<span class="font-semibold" style="color: var(--ui-muted-content);">Twin Parity ({STUDIO_TOOL_REGISTRY.length} tools)</span>
					<UiChamferButton {cornerMode} icon="export" label="Export" variant="ghost" onclick={onOpenExport} className="py-0.5 text-[0.68rem]" />
				</div>
				<div class="flex flex-wrap gap-1">
					{#each STUDIO_TOOL_REGISTRY.slice(0, 6) as tool (tool.name)}
						<span class="inline-flex items-center gap-1 border px-1.5 py-0.5 text-[0.65rem]" style="border-color: var(--ui-border-subtle); color: var(--ui-muted-content);" title={tool.plainDescription}>
							<UiIcon name={tool.icon} sizeRem={0.7} />{tool.humanTitle}
						</span>
					{/each}
				</div>
			</div>
		</UiChamferFrame>
	</aside>
{/if}
