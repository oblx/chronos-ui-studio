<script lang="ts">
	import type { TomeBlock, TomeInlineToken } from '@studio/config';

	interface Props {
		blocks: readonly TomeBlock[];
	}

	let { blocks }: Props = $props();

	function cleanLatexToDisplay(raw: string): string {
		return raw
			.replace(/\\text\{([^}]+)\}/g, '$1')
			.replace(/\\le/g, '≤')
			.replace(/\\ge/g, '≥')
			.replace(/\\times/g, '×')
			.replace(/\^\\circ/g, '°')
			.replace(/[{}]/g, '');
	}
</script>

{#snippet inlineTokens(tokens: readonly TomeInlineToken[])}
	{#each tokens as tok, ti (ti)}
		{#if tok.kind === 'strong'}
			<strong class="font-semibold" style="color: var(--ui-base-content);">{tok.text}</strong>
		{:else if tok.kind === 'code'}
			<code class="ui-font-mono border px-1 py-0.5 text-[0.72rem]" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100); color: var(--ui-primary);">{tok.text}</code>
		{:else if tok.kind === 'em'}
			<em class="italic">{tok.text}</em>
		{:else if tok.kind === 'math'}
			<math class="ui-font-mono px-0.5 text-[0.78rem]" style="color: var(--ui-secondary);"><mi>{cleanLatexToDisplay(tok.text)}</mi></math>
		{:else}
			{tok.text}
		{/if}
	{/each}
{/snippet}

<div class="flex flex-col gap-3 text-[0.8rem] leading-[1.65]" style="color: var(--ui-base-content);">
	{#each blocks as block, bi (bi)}
		{#if block.kind === 'heading'}
			<h3 class="ui-font-display border-b pb-1 text-sm font-semibold tracking-wide" style="border-color: var(--ui-border-subtle); color: var(--ui-primary);">{block.text}</h3>
		{:else if block.kind === 'paragraph'}
			<p class="leading-[1.65]">{@render inlineTokens(block.tokens)}</p>
		{:else if block.kind === 'blockquote'}
			<blockquote class="border-l-2 pl-3 italic" style="border-color: var(--ui-primary); color: var(--ui-muted-content);">{@render inlineTokens(block.tokens)}</blockquote>
		{:else if block.kind === 'list'}
			<ul class="flex flex-col gap-2 pl-4 {block.ordered ? 'list-decimal' : 'list-disc'}">
				{#each block.items as item, ii (ii)}
					<li class="leading-[1.65]">{@render inlineTokens(item)}</li>
				{/each}
			</ul>
		{:else if block.kind === 'table'}
			<div class="overflow-x-auto border" style="border-color: var(--ui-border-subtle);">
				<table class="w-full border-collapse text-left text-xs">
					<thead style="background-color: var(--ui-base-200);">
						<tr>
							{#each block.headers as h, hi (hi)}
								<th class="border-b px-2.5 py-1.5 font-semibold" style="border-color: var(--ui-border-subtle);">{@render inlineTokens(h)}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each block.rows as row, ri (ri)}
							<tr class="border-b last:border-b-0" style="border-color: var(--ui-border-subtle);">
								{#each row as cell, ci (ci)}
									<td class="px-2.5 py-1.5">{@render inlineTokens(cell)}</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/each}
</div>
