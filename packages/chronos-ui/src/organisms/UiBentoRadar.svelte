<script lang="ts">
	import { UiChamferButton, UiChamferFrame } from '../atoms';
	import {
		DEFAULT_VIEWPORT, HUD_METRICS, ZONE_CORNER_PRESETS,
		type CornerAnimation, type CornerEmbellishment, type CornerKind, type CornerTuple, type UiFrameShape
	} from '../tokens';
	import type { RegisteredUiEntity } from '../wire';
	import type { RadarActionItem } from './organisms.types';

	interface Props {
		leftActions: readonly RadarActionItem[];
		rightActions: readonly RadarActionItem[];
		zoom: number;
		panX: number;
		panY: number;
		activeZoneCount: number;
		cornerMode?: CornerKind;
		corners?: CornerTuple;
		cornerRadiusRem?: number;
		shape?: UiFrameShape;
		cornerEmbellishment?: CornerEmbellishment;
		cornerAnimation?: CornerAnimation;
		entities?: readonly RegisteredUiEntity[];
		selectedUuid?: string | null;
		onOpenSkeleton?: () => void;
	}

	let {
		leftActions,
		rightActions,
		zoom,
		panX,
		panY,
		activeZoneCount,
		cornerMode = 'CHAMFER',
		corners = ZONE_CORNER_PRESETS.BOTTOM_RIGHT,
		cornerRadiusRem,
		shape = 'BOX',
		cornerEmbellishment,
		cornerAnimation = 'NONE',
		entities = [],
		selectedUuid = null,
		onOpenSkeleton
	}: Props = $props();

	let dotX = $derived(Math.max(18, Math.min(82, 50 - panX * 0.04)));
	let dotY = $derived(Math.max(18, Math.min(82, 50 - panY * 0.04)));

	function radarPoint(ent: RegisteredUiEntity, idx: number, total: number): { x: number; y: number } {
		if (ent.measuredRect && ent.measuredRect.width > 0) {
			const vw = typeof window !== 'undefined' ? Math.max(DEFAULT_VIEWPORT.minSafeW, window.innerWidth) : DEFAULT_VIEWPORT.width;
			const vh = typeof window !== 'undefined' ? Math.max(DEFAULT_VIEWPORT.minSafeH, window.innerHeight) : DEFAULT_VIEWPORT.height;
			const cx = ((ent.measuredRect.x + ent.measuredRect.width * 0.5) / vw) * 76 + 12;
			const cy = ((ent.measuredRect.y + ent.measuredRect.height * 0.5) / vh) * 76 + 12;
			return { x: Math.max(10, Math.min(90, cx)), y: Math.max(10, Math.min(90, cy)) };
		}
		const angle = (idx / Math.max(1, total)) * Math.PI * 2;
		const r = ent.parentUuid ? 18 : 30;
		return { x: Math.max(12, Math.min(88, 50 + Math.cos(angle) * r)), y: Math.max(12, Math.min(88, 50 + Math.sin(angle) * r)) };
	}

	function blipColor(ent: RegisteredUiEntity): string {
		if (ent.lifecycle === 'ERROR') return 'var(--ui-error)';
		if (ent.uuid === selectedUuid) return 'var(--ui-accent-vivid, var(--ui-accent))';
		if (ent.lifecycle === 'STAGING' || ent.lifecycle === 'BUILDING') return 'var(--ui-warning)';
		return 'var(--ui-primary)';
	}

	let pulseCutoff = $derived(Date.now() - HUD_METRICS.sonarPingMs);
</script>

<UiChamferFrame {corners} {cornerMode} {cornerRadiusRem} {shape} {cornerEmbellishment} {cornerAnimation} carets={true} className="p-2.5">
	<div class="grid h-full grid-cols-[2.25rem_1fr_2.25rem] items-stretch gap-1.5">
		<div class="flex flex-col justify-between gap-1">
			{#each leftActions.slice(0, 3) as act (act.id)}
				<UiChamferButton
					{cornerMode}
					icon={act.icon}
					tip={act.label}
					active={act.active}
					onclick={act.onClick}
					className="h-6 w-full px-0 py-0"
				/>
			{/each}
		</div>

		<button
			type="button"
			data-testid={onOpenSkeleton ? 'radar-open-skeleton' : undefined}
			data-ui-interactive="true"
			data-ui-tip="Open Wireframe Skeleton Workbench"
			aria-label="Open Wireframe Skeleton Workbench"
			onclick={() => onOpenSkeleton?.()}
			class="pointer-events-auto relative flex flex-col items-center justify-center overflow-hidden text-left transition-opacity hover:opacity-95"
			style="background-color: var(--ui-base-100); border: var(--ui-hairline) solid var(--ui-border-subtle);"
		>
			<svg viewBox="0 0 100 100" class="pointer-events-none h-full max-h-[5.5rem] w-full" aria-hidden="true">
				<circle cx="50" cy="50" r="40" fill="none" stroke="var(--ui-border-subtle)" stroke-width="1" />
				<circle cx="50" cy="50" r="22" fill="none" stroke="var(--ui-border-subtle)" stroke-width="1" stroke-dasharray="3 3" />
				<line x1="50" y1="6" x2="50" y2="94" stroke="var(--ui-border-subtle)" stroke-width="1" />
				<line x1="6" y1="50" x2="94" y2="50" stroke="var(--ui-border-subtle)" stroke-width="1" />
				<rect x={dotX - 9} y={dotY - 7} width="18" height="14" fill="none" stroke="var(--ui-muted-content)" stroke-width="1" opacity="0.55" />
				{#each entities as ent, idx (ent.uuid)}
					{@const pt = radarPoint(ent, idx, entities.length)}
					{@const isSel = ent.uuid === selectedUuid}
					{@const isPing = ent.activeEventPulseAt > pulseCutoff}
					{#if isPing}
						<circle cx={pt.x} cy={pt.y} r="4.5" fill="none" stroke={blipColor(ent)} stroke-width="1.2" class="ui-radar-ping" />
					{/if}
					{#if isSel}
						<rect x={pt.x - 4.5} y={pt.y - 4.5} width="9" height="9" fill="none" stroke="var(--ui-accent-vivid, var(--ui-accent))" stroke-width="1.2" />
					{/if}
					<circle
						cx={pt.x}
						cy={pt.y}
						r={isSel ? 2.8 : 2}
						fill={blipColor(ent)}
						opacity={ent.lifecycle === 'STAGING' ? 0.65 : 0.95}
					/>
				{/each}
			</svg>
			<div class="ui-font-mono pointer-events-none absolute bottom-0.5 flex w-full justify-between px-1.5 text-[0.58rem] tabular-nums" style="color: var(--ui-muted-content);">
				<span>{entities.length} ENT</span>
				<span>{activeZoneCount}Z · {Math.round(zoom * 100)}%</span>
			</div>
		</button>

		<div class="flex flex-col justify-between gap-1">
			{#each rightActions.slice(0, 3) as act (act.id)}
				<UiChamferButton
					{cornerMode}
					icon={act.icon}
					tip={act.label}
					active={act.active}
					onclick={act.onClick}
					className="h-6 w-full px-0 py-0"
				/>
			{/each}
		</div>
	</div>
</UiChamferFrame>
