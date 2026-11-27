<script lang="ts">
	import {
		computeMarqueeDurationMs,
		getActiveStudioDefaults,
		subscribeMotionState
	} from '@ui/motion';
	import { STUDIO_KNOB_DEFAULTS } from '@ui/tokens';

	interface Props {
		text: string;
		className?: string;
		testId?: string;
	}

	let { text, className = '', testId }: Props = $props();

	let wrapEl = $state<HTMLSpanElement | null>(null);
	let trackEl = $state<HTMLSpanElement | null>(null);
	let overflowPx = $state(0);
	let speedPxPerSec = $state<number>(getActiveStudioDefaults().marqueeSpeedPxPerSec ?? STUDIO_KNOB_DEFAULTS.marqueeSpeedPxPerSec);
	let pauseRatio = $state<number>(getActiveStudioDefaults().marqueePauseRatio ?? STUDIO_KNOB_DEFAULTS.marqueePauseRatio);

	$effect(() => subscribeMotionState(() => {
		const d = getActiveStudioDefaults();
		speedPxPerSec = d.marqueeSpeedPxPerSec ?? STUDIO_KNOB_DEFAULTS.marqueeSpeedPxPerSec;
		pauseRatio = d.marqueePauseRatio ?? STUDIO_KNOB_DEFAULTS.marqueePauseRatio;
	}));

	function measure(): void {
		if (!wrapEl || !trackEl) { overflowPx = 0; return; }
		const diff = Math.ceil(trackEl.scrollWidth - wrapEl.clientWidth);
		overflowPx = diff > 1 ? diff : 0;
	}

	$effect(() => {
		void text;
		measure();
		if (typeof ResizeObserver === 'undefined' || !wrapEl) return;
		const ro = new ResizeObserver(() => measure());
		ro.observe(wrapEl);
		if (trackEl) ro.observe(trackEl);
		return () => ro.disconnect();
	});

	let durationMs = $derived(computeMarqueeDurationMs(overflowPx, speedPxPerSec, pauseRatio));
</script>

<span
	bind:this={wrapEl}
	data-testid={testId}
	data-overflow={overflowPx > 0 ? 'true' : 'false'}
	data-overflow-px={overflowPx}
	class="ui-marquee-wrap {className}"
	style={`--ui-marquee-shift: -${overflowPx}px; --ui-marquee-dur: ${durationMs}ms;`}
>
	<span bind:this={trackEl} class="ui-marquee-track">{text}</span>
</span>
