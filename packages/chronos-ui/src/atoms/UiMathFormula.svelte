<script lang="ts">
	interface Props {
		lhs: string;
		operator?: string;
		rhs: string;
		label?: string;
	}

	let {
		lhs,
		operator = '=',
		rhs,
		label
	}: Props = $props();
</script>

<div class="inline-flex flex-col gap-0.5">
	{#if label}
		<span class="text-xs" style="color: var(--ui-muted-content);">{label}</span>
	{/if}
	<math display="inline" class="ui-font-mono text-sm" style="color: var(--ui-base-content);">
		<mrow>
			<mi>{lhs}</mi>
			<mo>{operator}</mo>
			<mi>{rhs}</mi>
		</mrow>
	</math>
</div>
