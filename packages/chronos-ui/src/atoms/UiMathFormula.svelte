<script lang="ts">
	interface Props {
		lhs: string;
		operator?: string;
		rhs: string;
		label?: string;
	}

	type MathAtom =
		| { kind: 'id'; text: string }
		| { kind: 'num'; text: string }
		| { kind: 'op'; text: string }
		| { kind: 'sub'; base: string; sub: string }
		| { kind: 'sup'; base: string; sup: string };

	let { lhs, operator = '=', rhs, label }: Props = $props();

	function parseMathExpr(expr: string): readonly MathAtom[] {
		const out: MathAtom[] = [];
		const clean = expr.replace(/\s*\*\s*/g, ' ').trim();
		const re = /([A-Za-z]+)_\{([^}]+)\}|([A-Za-z]+)_([A-Za-z0-9]+)|([A-Za-z0-9]+)\^\{([^}]+)\}|([A-Za-z0-9]+)\^\(([^)]+)\)|([A-Za-z0-9]+)\^([A-Za-z0-9]+)|(\d+(?:\.\d+)?)|([A-Za-z]+)|([+\-=/(),≤≥·])/g;
		let m: RegExpExecArray | null;
		while ((m = re.exec(clean)) !== null) {
			if (m[1] && m[2]) out.push({ kind: 'sub', base: m[1], sub: m[2] });
			else if (m[3] && m[4]) out.push({ kind: 'sub', base: m[3], sub: m[4] });
			else if (m[5] && m[6]) out.push({ kind: 'sup', base: m[5], sup: m[6] });
			else if (m[7] && m[8]) out.push({ kind: 'sup', base: m[7], sup: m[8].replace(/\*/g, '') });
			else if (m[9] && m[10]) out.push({ kind: 'sup', base: m[9], sup: m[10] });
			else if (m[11]) out.push({ kind: 'num', text: m[11] });
			else if (m[12]) out.push({ kind: 'id', text: m[12] });
			else if (m[13]) out.push({ kind: 'op', text: m[13] });
		}
		return out;
	}

	let lhsAtoms = $derived(parseMathExpr(lhs));
	let rhsAtoms = $derived(parseMathExpr(rhs));
</script>

{#snippet renderAtoms(atoms: readonly MathAtom[])}
	{#each atoms as atom, idx (`${atom.kind}-${idx}`)}
		{#if atom.kind === 'sub'}
			<msub><mi>{atom.base}</mi><mn>{atom.sub}</mn></msub>
		{:else if atom.kind === 'sup'}
			<msup><mi>{atom.base}</mi><mrow><mi>{atom.sup}</mi></mrow></msup>
		{:else if atom.kind === 'num'}
			<mn>{atom.text}</mn>
		{:else if atom.kind === 'op'}
			<mo>{atom.text}</mo>
		{:else}
			<mi>{atom.text}</mi>
		{/if}
	{/each}
{/snippet}

<div class="inline-flex flex-col gap-0.5" data-testid="ui-math-formula">
	{#if label}
		<span class="text-xs" style="color: var(--ui-muted-content);">{label}</span>
	{/if}
	<math display="inline" class="ui-font-mono text-sm" style="color: var(--ui-base-content);">
		<mrow>
			{@render renderAtoms(lhsAtoms)}
			{#if operator}<mo>{operator}</mo>{/if}
			{@render renderAtoms(rhsAtoms)}
		</mrow>
	</math>
</div>
