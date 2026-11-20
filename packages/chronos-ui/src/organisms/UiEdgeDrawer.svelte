<script lang="ts">
	import type { Snippet } from 'svelte';
	import { UiChamferButton, UiChamferFrame, UiIcon } from '../atoms';
	import { uiDrawerGrip } from '../machines';
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
	let botCorners = $derived(isRight ? mirrorCornerTuple(ZONE_CORNER_PRESETS.EDGE_BOT_CAP_LEFT) : ZONE_CORNER_PRESETS.EDGE_BOT_CAP_LEFT);
	let bodyCorners = $derived(isRight ? ZONE_CORNER_PRESETS.RIGHT_EDGE : ZONE_CORNER_PRESETS.LEFT_EDGE);
	let railStyle = $derived(
		`top: 50%; ${isRight ? 'right: 0.75rem;' : 'left: 0.75rem;'} transform: translate3d(0, calc(-50% + ${railOffsetY}px), 0);`
	);
	let panelStyle = $derived(
		floating
			? `left: ${floatX}px; top: ${floatY}px; width: 22rem; max-height: calc(100vh - var(--ui-safe-top, 7rem) - var(--ui-safe-bottom, 9rem));`
			: `top: var(--ui-safe-top, 7rem); ${isRight ? 'right: var(--ui-safe-side, 3.75rem);' : 'left: var(--ui-safe-side, 3.75rem);'} width: 21rem; max-height: calc(100vh - var(--ui-safe-top, 7rem) - var(--ui-safe-bottom, 9rem));`
	);
</script>

<aside
	aria-label="{side} mini rail"
	data-testid="edge-rail-{side.toLowerCase()}"
	data-ui-interactive="true"
	class="fixed z-[24] hidden flex-col items-center gap-1 md:flex"
	style="width: 3rem; {railStyle}"
>
	<UiChamferButton
		corners={topCorners}
		{cornerMode}
		icon={isRight ? (open ? 'chevron-right' : 'chevron-left') : (open ? 'chevron-left' : 'chevron-right')}
		tip={open ? `Collapse ${side.toLowerCase()} drawer` : `Expand ${side.toLowerCase()} drawer`}
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
			active={open && activeTabId === tab.id}
			onclick={() => { if (!open) onToggleOpen(); onSelectTab(tab.id); }}
			className="w-full px-0"
		/>
	{/each}
	<button
		type="button"
		aria-label="Drag to reposition or click to toggle floating drawer"
		data-ui-tip="Click: float toggle | Drag: reposition"
		data-testid="edge-grip-{side.toLowerCase()}"
		use:uiDrawerGrip={{ isFloating: floating, onToggleFloat, onMoveRail, onMoveFloat }}
		class="flex h-8 w-full cursor-grab items-center justify-center active:cursor-grabbing"
		style="background-color: var(--ui-base-200); color: var(--ui-accent); border: var(--ui-hairline) solid var(--ui-border-subtle);"
	>
		<UiIcon name="grip" sizeRem={1} />
	</button>
	<UiChamferButton
		corners={botCorners}
		{cornerMode}
		icon={floating ? 'lock' : 'layers'}
		tip={floating ? 'Dock drawer to edge' : 'Detach drawer to float'}
		active={floating}
		onclick={onToggleFloat}
		className="w-full px-0"
	/>
</aside>

{#if open}
	<section
		aria-label="{side} overlay drawer"
		data-testid="edge-drawer-{side.toLowerCase()}"
		data-ui-interactive="true"
		in:uiTransition={{ axis: 'x', offsetPx: isRight ? 14 : -14 }}
		out:uiTransition={{ axis: 'x', offsetPx: isRight ? 14 : -14 }}
		class="fixed z-[25] flex flex-col"
		style={panelStyle}
	>
		<UiChamferFrame corners={bodyCorners} {cornerMode} carets={true} bezel={true} outerClass="flex max-h-full w-full flex-col" className="flex max-h-full flex-col">
			<div class="flex items-center justify-between gap-2 px-3 py-2" style="border-bottom: var(--ui-hairline) solid var(--ui-border-subtle); background-color: var(--ui-base-300);">
				<div class="flex items-center gap-1 overflow-x-auto">
					{#each tabs as tab (tab.id)}
						<button
							type="button"
							aria-pressed={activeTabId === tab.id}
							onclick={() => onSelectTab(tab.id)}
							class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-2 py-1 text-xs font-semibold"
							style="
								background-color: {activeTabId === tab.id ? 'var(--ui-primary)' : 'transparent'};
								color: {activeTabId === tab.id ? 'var(--ui-primary-content)' : 'var(--ui-muted-content)'};
							"
						>
							<UiIcon name={tab.icon} sizeRem={0.85} />
							<span>{tab.label}</span>
						</button>
					{/each}
				</div>
				<button
					type="button"
					aria-label="Drag floating drawer"
					use:uiDrawerGrip={{ isFloating: floating, onToggleFloat, onMoveRail, onMoveFloat }}
					class="inline-flex h-6 w-6 shrink-0 cursor-grab items-center justify-center active:cursor-grabbing"
					style="color: var(--ui-accent);"
				>
					<UiIcon name="grip" sizeRem={0.85} />
				</button>
			</div>
			<div class="ui-scroll-deck overflow-y-auto p-3" style="max-height: calc(100vh - 23rem);">
				{@render children?.()}
			</div>
		</UiChamferFrame>
	</section>
{/if}
