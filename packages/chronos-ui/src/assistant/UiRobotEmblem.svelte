<script lang="ts">
	import type { AssistantOcularState } from './assistant.types';

	interface Props {
		state?: AssistantOcularState;
		size?: number;
	}

	let { state = 'IDLE', size = 24 }: Props = $props();

	const EYE_COLOR: Record<AssistantOcularState, string> = {
		IDLE: 'var(--ui-primary)',
		THINKING: 'var(--ui-secondary)',
		LISTENING: 'var(--ui-info)',
		BUILDING_UI: 'var(--ui-accent)',
		MCP_DRIVEN: 'var(--ui-success)',
		ERROR: 'var(--ui-error)'
	};

	let eyeStroke = $derived(EYE_COLOR[state]);
	let pulsing = $derived(state === 'THINKING' || state === 'LISTENING' || state === 'BUILDING_UI' || state === 'MCP_DRIVEN');
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	aria-label={`Robot assistant ${state.toLowerCase()}`}
	class="shrink-0"
>
	<path d="M12 2.5v3M8.5 4h7" stroke="var(--ui-border-strong)" stroke-width="1.5" stroke-linecap="square" />
	<polygon
		points="5,6 19,6 21,8 21,17 19,19 5,19 3,17 3,8"
		fill="var(--ui-base-300)"
		stroke={eyeStroke}
		stroke-width="1.4"
	/>
	<rect x="6.5" y="9.5" width="11" height="5" fill="var(--ui-base-100)" stroke="var(--ui-border-subtle)" stroke-width="1" />
	{#if state === 'ERROR'}
		<path d="M8.5 11l2 2m0-2-2 2M13.5 11l2 2m0-2-2 2" stroke={eyeStroke} stroke-width="1.5" stroke-linecap="square" />
	{:else if state === 'BUILDING_UI'}
		<rect x="8" y="11" width="3" height="2" fill={eyeStroke} class="ui-ocular-pulse" />
		<rect x="13" y="11" width="3" height="2" fill={eyeStroke} class="ui-ocular-pulse" />
	{:else}
		<circle cx="9.5" cy="12" r="1.25" fill={eyeStroke} class={pulsing ? 'ui-ocular-pulse' : ''} />
		<circle cx="14.5" cy="12" r="1.25" fill={eyeStroke} class={pulsing ? 'ui-ocular-pulse' : ''} />
	{/if}
	<path d="M8.5 16.5h7" stroke="var(--ui-muted-content)" stroke-width="1.2" stroke-linecap="square" />
</svg>
