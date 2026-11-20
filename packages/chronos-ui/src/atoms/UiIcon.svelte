<script lang="ts">
	import { UI_ICON_PATHS, type UiIconName } from '../tokens';

	interface Props {
		name: UiIconName;
		sizeRem?: number;
		strokeWidth?: number;
		className?: string;
	}

	let {
		name,
		sizeRem = 1.125,
		strokeWidth = 2,
		className = ''
	}: Props = $props();

	let pathData = $derived(UI_ICON_PATHS[name] ?? UI_ICON_PATHS.help);
</script>

<svg
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="square"
	stroke-linejoin="miter"
	aria-hidden="true"
	class={className}
	style="width: {sizeRem}rem; height: {sizeRem}rem; flex-shrink: 0;"
>
	<path d={pathData} />
</svg>
