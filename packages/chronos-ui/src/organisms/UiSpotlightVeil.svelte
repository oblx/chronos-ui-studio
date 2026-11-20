<script lang="ts">
	import { untrack } from 'svelte';
	import { UiChamferButton, UiChamferFrame } from '../atoms';
	import { measureSpotlightRects, type SpotlightRect, type SpotlightStep } from '../machines';
	import { DEFAULT_VIEWPORT, type CornerKind } from '../tokens';

	interface Props {
		active: boolean;
		step: SpotlightStep | null;
		stepIndex: number;
		totalSteps: number;
		cornerMode?: CornerKind;
		onPrev: () => void;
		onNext: () => void;
		onStop: () => void;
	}

	let {
		active,
		step,
		stepIndex,
		totalSteps,
		cornerMode = 'CHAMFER',
		onPrev,
		onNext,
		onStop
	}: Props = $props();

	let cutouts = $state.raw<readonly SpotlightRect[]>([]);
	let vw = $state<number>(DEFAULT_VIEWPORT.width);
	let vh = $state<number>(DEFAULT_VIEWPORT.height);

	$effect(() => {
		if (!active || !step) {
			untrack(() => { cutouts = []; });
			return;
		}
		const ids = step.targetIds;
		const sync = (): void => {
			const nextRects = measureSpotlightRects(ids);
			untrack(() => {
				vw = window.innerWidth;
				vh = window.innerHeight;
				cutouts = nextRects;
			});
		};
		sync();
		window.addEventListener('resize', sync);
		return () => window.removeEventListener('resize', sync);
	});
</script>

{#if active && step}
	<div
		role="dialog"
		aria-label="Spotlight guided tour"
		data-testid="spotlight-veil"
		data-ui-interactive="true"
		class="fixed inset-0 z-[70]"
	>
		<svg class="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 {vw} {vh}" preserveAspectRatio="none">
			<defs>
				<mask id="ui-spotlight-mask">
					<rect x="0" y="0" width={vw} height={vh} fill="white" />
					{#each cutouts as rect (rect.targetId)}
						<rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={cornerMode === 'CHAMFER' ? 8 : 0} fill="black" />
					{/each}
				</mask>
			</defs>
			<rect x="0" y="0" width={vw} height={vh} fill="black" fill-opacity="0.72" mask="url(#ui-spotlight-mask)" />
			{#each cutouts as rect (rect.targetId)}
				<rect
					x={rect.x}
					y={rect.y}
					width={rect.width}
					height={rect.height}
					fill="none"
					stroke="var(--ui-accent)"
					stroke-width="2"
				/>
			{/each}
		</svg>

		<div class="pointer-events-none fixed inset-x-0 bottom-[9.25rem] z-10 flex justify-center px-4">
			<div class="pointer-events-auto w-full max-w-md">
				<UiChamferFrame {cornerMode} bezel={true} carets={true} outerClass="w-full">
					<div class="flex flex-col gap-3 p-4">
						<div class="flex items-center justify-between gap-2">
							<span class="ui-font-mono text-xs font-semibold" style="color: var(--ui-primary);">
								Step {stepIndex + 1} of {totalSteps}
							</span>
							<UiChamferButton {cornerMode} label="Skip Tour" variant="ghost" onclick={onStop} />
						</div>
						<h3 class="ui-font-display text-sm font-bold" style="color: var(--ui-base-content);">{step.title}</h3>
						<p class="text-xs leading-relaxed" style="color: var(--ui-muted-content);">{step.body}</p>
						<div class="flex items-center justify-end gap-2">
							<UiChamferButton {cornerMode} label="Previous" disabled={stepIndex === 0} onclick={onPrev} />
							<UiChamferButton
								{cornerMode}
								label={stepIndex + 1 >= totalSteps ? 'Finish' : 'Next'}
								variant="primary"
								onclick={onNext}
							/>
						</div>
					</div>
				</UiChamferFrame>
			</div>
		</div>
	</div>
{/if}
