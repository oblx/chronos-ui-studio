<script lang="ts">
	import type { UiIconName } from '../tokens';
	import UiIcon from './UiIcon.svelte';

	interface Props {
		icon: UiIconName;
		label: string;
		tip?: string;
		active?: boolean;
		glitterBurst?: number;
		onclick?: (e: MouseEvent) => void;
		className?: string;
	}

	let {
		icon,
		label,
		tip,
		active = false,
		glitterBurst = 0,
		onclick,
		className = ''
	}: Props = $props();

	let showGlitter = $state(false);
	let lastBurst = 0;

	$effect(() => {
		if (glitterBurst > lastBurst) {
			lastBurst = glitterBurst;
			showGlitter = true;
			const timer = setTimeout(() => {
				showGlitter = false;
			}, 2400);
			return () => clearTimeout(timer);
		}
	});
</script>

<button
	type="button"
	aria-label={label}
	aria-pressed={active}
	data-ui-tip={tip ?? label}
	data-ui-interactive="true"
	{onclick}
	class="group relative inline-flex h-8 w-8 shrink-0 items-center justify-center transition-all duration-150 {className}"
	style="
		background-color: {active ? 'var(--ui-base-300)' : 'transparent'};
		color: {active ? 'var(--ui-accent)' : 'var(--ui-muted-content)'};
		border: var(--ui-hairline) solid {active ? 'var(--ui-accent)' : 'var(--ui-border-subtle)'};
		opacity: {active ? '1' : '0.72'};
	"
>
	<span class="transition-transform duration-150 group-hover:scale-105 group-hover:opacity-100" style="color: inherit;">
		<UiIcon name={icon} sizeRem={1} />
	</span>
	{#if showGlitter}
		<span class="pointer-events-none absolute -inset-1 overflow-visible" aria-hidden="true">
			{#each [0, 60, 120, 180, 240, 300] as angle (angle)}
				<span
					class="ui-glitter-spark absolute left-1/2 top-1/2 h-1.5 w-1.5"
					style="
						background-color: var(--ui-accent);
						transform: rotate({angle}deg) translateY(-0.95rem);
					"
				></span>
			{/each}
		</span>
	{/if}
</button>
