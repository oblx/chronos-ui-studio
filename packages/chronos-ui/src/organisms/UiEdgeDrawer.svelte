<script lang="ts">
	import type { Snippet } from 'svelte';
	import { UiChamferButton, UiChamferFrame, UiIcon } from '../atoms';
	import { uiFoldGrip, uiSpotlight } from '../machines';
	import { uiTransition } from '../motion';
	import { mirrorCornerTuple, STRAIGHT_TUPLE, ZONE_CORNER_PRESETS, type CornerKind } from '../tokens';
	import type { DrawerTabDef } from './organisms.types';

	interface Props {
		side: 'LEFT' | 'RIGHT';
		open: boolean;
		floating: boolean;
		railOffsetY: number;
		floatX: number;
		floatY: number;
		tabs: readonly DrawerTabDef[];
		activeTabId: string;
		cornerMode?: CornerKind;
		onToggleOpen: () => void;
		onSelectTab: (tabId: string) => void;
		onToggleFloat: () => void;
		onMoveRail: (dy: number) => void;
		onMoveFloat: (dx: number, dy: number) => void;
		children?: Snippet;
	}

	let {
		side, open, floating, railOffsetY, floatX, floatY,
		tabs, activeTabId, cornerMode = 'CHAMFER',
		onToggleOpen, onSelectTab, onToggleFloat, onMoveRail, onMoveFloat, children
	}: Props = $props();

	let isRight = $derived(side === 'RIGHT');
	let topCorners = $derived(isRight ? mirrorCornerTuple(ZONE_CORNER_PRESETS.EDGE_TOP_CAP_LEFT) : ZONE_CORNER_PRESETS.EDGE_TOP_CAP_LEFT);
	let bodyCorners = $derived(isRight ? ZONE_CORNER_PRESETS.RIGHT_EDGE : ZONE_CORNER_PRESETS.LEFT_EDGE);
	let railStyle = $derived(
		`top: 50%; ${isRight ? 'right: 0.75rem;' : 'left: 0.75rem;'} transform: translate3d(0, calc(-50% + ${railOffsetY}px), 0);`
	);
	let panelStyle = $derived(
		floating
			? `left: ${floatX}px; top: ${floatY}px; width: 22rem; height: calc(100vh - var(--ui-safe-top, 4.5rem) - var(--ui-safe-bottom, 5.25rem));`
			: `top: var(--ui-safe-top, 4.5rem); ${isRight ? 'right: var(--ui-safe-right, 4.5rem);' : 'left: var(--ui-safe-left, 4.5rem);'} width: 21rem; max-height: calc(100vh - var(--ui-safe-top, 4.5rem) - var(--ui-safe-bottom, 5.25rem));`
	);
</script>

<aside
	use:uiSpotlight={side === 'LEFT' ? 'spot-edge-rails' : 'spot-edge-rail-right'}
	aria-label="{side} mini rail"
	data-testid="edge-rail-{side.toLowerCase()}"
	data-fold-axis="HORIZONTAL"
	data-fold-behavior="OVERLAY_HOVER"
	data-ui-interactive="true"
	class="ui-dur-micro fixed z-[35] hidden transition-opacity md:block {open ? 'opacity-100' : 'opacity-85 hover:opacity-100 focus-within:opacity-100'}"
	style="width: 3.25rem; {railStyle}"
>
	<UiChamferFrame corners={bodyCorners} {cornerMode} cutTier="base" bezel={false} carets={false} outerClass="w-full" className="flex flex-col items-center gap-1 p-1.5">
		<UiChamferButton
			corners={topCorners}
			{cornerMode}
			icon={isRight ? (open ? 'chevron-right' : 'chevron-left') : (open ? 'chevron-left' : 'chevron-right')}
			tip={open ? `Collapse ${side.toLowerCase()} drawer` : `Expand ${side.toLowerCase()} drawer`}
			testId="edge-rail-toggle-{side.toLowerCase()}"
			active={open}
			onclick={onToggleOpen}
			className="w-full px-0"
		/>
		{#each tabs as tab (tab.id)}
			<UiChamferButton
				corners={STRAIGHT_TUPLE}
				{cornerMode}
				icon={tab.icon}
				tip={tab.label}
				testId="edge-rail-tab-{side.toLowerCase()}-{tab.id}"
				active={open && activeTabId === tab.id}
				onclick={() => { if (!open) onToggleOpen(); onSelectTab(tab.id); }}
				className="w-full px-0"
			/>
		{/each}
		<hr
			data-testid="edge-rail-divider-{side.toLowerCase()}"
			class="my-0.5 w-full border-0 border-t"
			style="border-color: var(--ui-border-subtle);"
		/>
		<button
			type="button"
			aria-label={floating ? 'Dock drawer to edge or drag to move' : 'Click to detach drawer or drag to reposition'}
			data-ui-tip={floating ? 'Click: dock to edge\nDrag: reposition drawer' : 'Click: float drawer\nDrag: slide along rail'}
			data-testid="edge-grip-{side.toLowerCase()}"
			data-ui-floating={floating ? 'true' : 'false'}
			use:uiFoldGrip={{ axis: 'HORIZONTAL', isFloating: floating, onToggleFloat, onMoveRail, onMoveFloat }}
			class="flex h-7 w-full cursor-grab items-center justify-center active:cursor-grabbing"
			style="background-color: {floating ? 'var(--ui-primary)' : 'var(--ui-base-200)'}; color: {floating ? 'var(--ui-primary-content)' : 'var(--ui-accent)'}; border: var(--ui-hairline) solid {floating ? 'var(--ui-primary)' : 'var(--ui-border-subtle)'};"
		>
			<UiIcon name="grip" sizeRem={0.9} />
		</button>
	</UiChamferFrame>
</aside>

{#if open}
	<section
		aria-label="{side} overlay drawer"
		data-testid="edge-drawer-{side.toLowerCase()}"
		data-fold-axis="HORIZONTAL"
		data-fold-behavior="OVERLAY_HOVER"
		data-ui-interactive="true"
		in:uiTransition={{ axis: 'x', offsetPx: isRight ? 14 : -14 }}
		out:uiTransition={{ axis: 'x', offsetPx: isRight ? 14 : -14 }}
		class="fixed z-[36] flex flex-col shadow-xl"
		style={panelStyle}
	>
		<UiChamferFrame corners={bodyCorners} {cornerMode} carets={true} bezel={true} outerClass="flex min-h-0 max-h-full w-full flex-col" className="flex min-h-0 max-h-full flex-col overflow-hidden">
			<div class="flex shrink-0 items-center justify-between gap-2 px-3 py-2" style="border-bottom: var(--ui-hairline) solid var(--ui-border-subtle); background-color: var(--ui-base-300);">
				<div class="flex items-center gap-1 overflow-x-auto">
					{#each tabs as tab (tab.id)}
						<button
							type="button"
							data-testid="edge-drawer-tab-{side.toLowerCase()}-{tab.id}"
							aria-pressed={activeTabId === tab.id}
							onclick={() => onSelectTab(tab.id)}
							class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-2 py-1 text-xs font-semibold"
							style="background-color: {activeTabId === tab.id ? 'var(--ui-primary)' : 'transparent'}; color: {activeTabId === tab.id ? 'var(--ui-primary-content)' : 'var(--ui-muted-content)'};"
						>
							<UiIcon name={tab.icon} sizeRem={0.85} />
							<span>{tab.label}</span>
						</button>
					{/each}
				</div>
				<button
					type="button"
					aria-label="Drag floating drawer"
					use:uiFoldGrip={{ axis: 'HORIZONTAL', isFloating: floating, onToggleFloat, onMoveRail, onMoveFloat }}
					class="inline-flex h-6 w-6 shrink-0 cursor-grab items-center justify-center active:cursor-grabbing"
					style="color: var(--ui-accent);"
				>
					<UiIcon name="grip" sizeRem={0.85} />
				</button>
			</div>
			<div class="ui-scroll-deck min-h-0 flex-1 overflow-y-auto p-3 pb-5" data-testid="edge-drawer-body-{side.toLowerCase()}">
				{@render children?.()}
			</div>
		</UiChamferFrame>
	</section>
{/if}
