<script lang="ts">
	import type { Snippet } from 'svelte';
	import { UiChamferButton } from '../atoms';
	import { uiTransition } from '../motion';
	import type { CornerKind, HudZoneId } from '../tokens';

	interface Props {
		hiddenZones?: ReadonlySet<HudZoneId>;
		revealedZones?: ReadonlySet<HudZoneId> | null;
		cornerMode?: CornerKind;
		onOpenLeftMobile?: () => void;
		onOpenRightMobile?: () => void;
		onOpenSettingsMobile?: () => void;
		worldCanvas?: Snippet;
		topLeft?: Snippet;
		topCenter?: Snippet;
		projectDeck?: Snippet;
		topRight?: Snippet;
		bottomLeft?: Snippet;
		bottomCenter?: Snippet;
		bottomRight?: Snippet;
		drawers?: Snippet;
		modals?: Snippet;
		overlays?: Snippet;
	}

	let {
		hiddenZones = new Set<HudZoneId>(),
		revealedZones = null,
		cornerMode = 'CHAMFER',
		onOpenLeftMobile,
		onOpenRightMobile,
		onOpenSettingsMobile,
		worldCanvas,
		topLeft,
		topCenter,
		projectDeck,
		topRight,
		bottomLeft,
		bottomCenter,
		bottomRight,
		drawers,
		modals,
		overlays
	}: Props = $props();

	let show = (id: HudZoneId): boolean => !hiddenZones.has(id) && (!revealedZones || revealedZones.has(id));
</script>

<div class="relative h-screen w-screen overflow-hidden">
	{@render worldCanvas?.()}

	<header
		data-testid="hud-top-band"
		class="pointer-events-none fixed inset-x-3 top-3 z-20 hidden items-stretch gap-3 md:grid"
		style="height: var(--hud-top-band-h, 6.25rem); grid-template-columns: var(--ui-side-track-w) minmax(0, 1fr) var(--ui-side-track-w);"
	>
		<div class="pointer-events-auto h-full" data-testid="zone-top-left" data-zone-revealed={show('TOP_LEFT') ? 'true' : 'false'}>
			{#if show('TOP_LEFT')}<div class="ui-hud-zone-slot h-full w-full" in:uiTransition={{ offsetPx: 8 }}>{@render topLeft?.()}</div>{/if}
		</div>
		<div class="pointer-events-auto mx-auto flex h-full w-full flex-col justify-between" style="max-width: var(--ui-corridor-max-w);">
			<div style="height: 3.125rem;" data-testid="zone-top-center" data-zone-revealed={show('TOP_CENTER') ? 'true' : 'false'}>
				{#if show('TOP_CENTER')}<div class="ui-hud-zone-slot h-full w-full" in:uiTransition={{ offsetPx: 8 }}>{@render topCenter?.()}</div>{/if}
			</div>
			<div style="height: 2.375rem;" data-testid="zone-project-deck" data-zone-revealed={show('PROJECT_TAB_DECK') ? 'true' : 'false'}>
				{#if show('PROJECT_TAB_DECK')}<div class="ui-hud-zone-slot h-full w-full" in:uiTransition={{ offsetPx: 6 }}>{@render projectDeck?.()}</div>{/if}
			</div>
		</div>
		<div class="pointer-events-auto h-full" data-testid="zone-top-right" data-zone-revealed={show('TOP_RIGHT') ? 'true' : 'false'}>
			{#if show('TOP_RIGHT')}<div class="ui-hud-zone-slot h-full w-full" in:uiTransition={{ offsetPx: 8 }}>{@render topRight?.()}</div>{/if}
		</div>
	</header>

	{@render drawers?.()}

	<footer
		data-testid="hud-bottom-band"
		class="pointer-events-none fixed inset-x-3 bottom-3 z-20 hidden items-stretch gap-3 md:grid"
		style="height: var(--hud-bottom-dock-h, 8.25rem); grid-template-columns: var(--ui-side-track-w) minmax(0, 1fr) var(--ui-side-track-w);"
	>
		<div class="pointer-events-auto h-full" data-testid="zone-bottom-left" data-zone-revealed={show('BOTTOM_LEFT') ? 'true' : 'false'}>
			{#if show('BOTTOM_LEFT')}<div class="ui-hud-zone-slot h-full w-full" in:uiTransition={{ offsetPx: 8 }}>{@render bottomLeft?.()}</div>{/if}
		</div>
		<div class="pointer-events-auto mx-auto h-full w-full" style="max-width: var(--ui-corridor-max-w);" data-testid="zone-bottom-center" data-zone-revealed={show('BOTTOM_CENTER') ? 'true' : 'false'}>
			{#if show('BOTTOM_CENTER')}<div class="ui-hud-zone-slot h-full w-full" in:uiTransition={{ offsetPx: 8 }}>{@render bottomCenter?.()}</div>{/if}
		</div>
		<div class="pointer-events-auto h-full" data-testid="zone-bottom-right" data-zone-revealed={show('BOTTOM_RIGHT') ? 'true' : 'false'}>
			{#if show('BOTTOM_RIGHT')}<div class="ui-hud-zone-slot h-full w-full" in:uiTransition={{ offsetPx: 8 }}>{@render bottomRight?.()}</div>{/if}
		</div>
	</footer>

	<nav
		aria-label="Mobile perimeter dock"
		class="fixed inset-x-2 bottom-2 z-30 flex items-center justify-between gap-2 px-3 py-2 md:hidden"
		style="background-color: var(--ui-base-200); border: var(--ui-hairline) solid var(--ui-border-subtle);"
	>
		<UiChamferButton {cornerMode} icon="layers" label="Zones" onclick={onOpenLeftMobile} />
		<UiChamferButton {cornerMode} icon="palette" label="Theme" onclick={onOpenRightMobile} />
		<UiChamferButton {cornerMode} icon="settings" label="Prefs" onclick={onOpenSettingsMobile} />
	</nav>

	{@render modals?.()}
	{@render overlays?.()}
</div>
