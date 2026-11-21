<script lang="ts">
	import {
		clampCornerRadiusRem, CORNER_ANIMATIONS, CORNER_EMBELLISHMENTS, CORNER_MODES, CORNER_RADIUS_LIMITS,
		DEFAULT_EMBELLISHMENT_CONFIG, findComponentSchema, HUD_ZONES, shortUuid,
		UI_FRAME_SHAPES, UiChamferButton, UiInput, UiSelect,
		type CornerAnimation, type CornerEmbellishment, type CornerKind, type CornerTuple,
		type HudZoneId, type UiFrameShape, type UiNode
	} from '@chronos-ui/svelte';

	interface Props {
		node: UiNode | null;
		cornerMode: CornerKind;
		onPatch: (nodeId: string, patch: Partial<UiNode>) => void;
		onDeriveBlueprint: (nodeId: string, name: string) => void;
		onCommitNode?: (nodeId: string) => void;
		onRejectNode?: (nodeId: string) => void;
		onRemove: (nodeId: string) => void;
		onCopiedUuid?: (uuid: string) => void;
		onClose: () => void;
	}

	let { node, cornerMode, onPatch, onDeriveBlueprint, onCommitNode, onRejectNode, onRemove, onCopiedUuid, onClose }: Props = $props();
	let schema = $derived(node ? findComponentSchema(node.type) : null);

	const ACTION_BINDINGS = [
		{ value: '', label: 'None (Display Only)' },
		{ value: 'UI_TOGGLE_POLARITY', label: 'Toggle Light / Dark Theme' },
		{ value: 'UI_STAGE_PAN_ZOOM', label: 'Reset Canvas Camera' },
		{ value: 'UI_TOGGLE_STUDIO_CHROME', label: 'Toggle Full Studio HUD' },
		{ value: 'UI_UNDO_REVISION', label: 'Undo Last Edit' }
	];
	const ZONE_OPTIONS = HUD_ZONES.map((z) => ({ value: z, label: z }));
	const SHAPE_OPTIONS = UI_FRAME_SHAPES.map((s) => ({ value: s, label: s }));
	const EMB_OPTIONS = CORNER_EMBELLISHMENTS.map((e) => ({ value: e, label: e }));
	const ANIM_OPTIONS = CORNER_ANIMATIONS.map((a) => ({ value: a, label: a }));

	function patchProp(key: string, value: string | number | boolean): void {
		if (!node) return;
		onPatch(node.id, { props: { ...node.props, [key]: value } });
	}

	function setUniformCorners(kind: CornerKind): void {
		if (!node) return;
		const tuple: CornerTuple = [kind, kind, kind, kind];
		onPatch(node.id, { corners: tuple });
	}

	function copyUuid(): void {
		if (!node) return;
		if (typeof navigator !== 'undefined' && navigator.clipboard) void navigator.clipboard.writeText(node.id);
		onCopiedUuid?.(node.id);
	}
</script>

{#if node && schema}
	<div aria-label="Runtime Node Inspector" data-testid="node-inspector-panel" class="flex flex-col gap-2.5 pb-3 text-xs">
		<div class="flex items-center justify-between gap-2 border-b pb-2" style="border-color: var(--ui-border-subtle);">
			<div>
				<div class="ui-font-display font-semibold">{schema.label}</div>
				<div class="ui-font-mono flex items-center gap-1.5 text-[0.68rem]" style="color: var(--ui-muted-content);">
					<button type="button" onclick={copyUuid} class="underline hover:opacity-80" data-testid="inspector-copy-uuid" title={node.id}>
						{shortUuid(node.id)}
					</button>
					<span>· {schema.memoryWeight} · {node.lifecycle}</span>
				</div>
			</div>
			<UiChamferButton {cornerMode} icon="close" tip="Clear selection" variant="ghost" onclick={onClose} className="px-1.5 py-0.5" />
		</div>

		{#if node.lifecycle !== 'COMMITTED' && (onCommitNode || onRejectNode)}
			<div class="grid grid-cols-2 gap-1.5">
				{#if onCommitNode}<UiChamferButton {cornerMode} icon="check" label="Commit Node" variant="primary" onclick={() => onCommitNode(node.id)} className="w-full py-1 text-xs" />{/if}
				{#if onRejectNode}<UiChamferButton {cornerMode} icon="close" label="Reject Node" variant="danger" onclick={() => onRejectNode(node.id)} className="w-full py-1 text-xs" />{/if}
			</div>
		{/if}

		<div class="flex flex-col gap-1">
			<span style="color: var(--ui-muted-content);">Label</span>
			<UiInput {cornerMode} value={node.label} label="Node label" oninput={(v) => onPatch(node.id, { label: v })} />
		</div>

		<div class="grid grid-cols-2 gap-1.5">
			<div class="flex flex-col gap-1">
				<span style="color: var(--ui-muted-content);">Target Zone</span>
				<UiSelect {cornerMode} value={node.zone} options={ZONE_OPTIONS} label="Target Zone" onchange={(v) => onPatch(node.id, { zone: v as HudZoneId })} />
			</div>
			<div class="flex flex-col gap-1">
				<span style="color: var(--ui-muted-content);">UML Frame Shape</span>
				<UiSelect {cornerMode} value={node.shape ?? 'BOX'} options={SHAPE_OPTIONS} label="UML Frame Shape" onchange={(v) => onPatch(node.id, { shape: v as UiFrameShape })} />
			</div>
		</div>

		<div class="flex flex-col gap-1">
			<span style="color: var(--ui-muted-content);">Corner Geometry</span>
			<div class="grid grid-cols-3 gap-1">
				{#each CORNER_MODES as ck (ck)}
					<UiChamferButton {cornerMode} label={ck} active={(node.corners?.[0] ?? cornerMode) === ck} variant={(node.corners?.[0] ?? cornerMode) === ck ? 'primary' : 'surface'} onclick={() => setUniformCorners(ck)} className="px-1 py-0.5 text-[0.65rem]" />
				{/each}
			</div>
		</div>

		<div class="grid grid-cols-2 gap-1.5">
			<div class="flex flex-col gap-1">
				<span style="color: var(--ui-muted-content);">Embellishment</span>
				<UiSelect {cornerMode} value={node.cornerEmbellishment ?? 'CARET'} options={EMB_OPTIONS} label="Embellishment" onchange={(v) => onPatch(node.id, { cornerEmbellishment: v as CornerEmbellishment })} />
			</div>
			<div class="flex flex-col gap-1">
				<span style="color: var(--ui-muted-content);">Corner Effect</span>
				<UiSelect {cornerMode} value={node.cornerAnimation ?? 'NONE'} options={ANIM_OPTIONS} label="Corner Effect" onchange={(v) => onPatch(node.id, { cornerAnimation: v as CornerAnimation })} />
			</div>
		</div>

		<div class="grid grid-cols-3 gap-1.5">
			<UiInput {cornerMode} value={String(node.cornerRadiusRem ?? CORNER_RADIUS_LIMITS.defaultRem)} label="Radius rem" className="ui-font-mono" oninput={(v) => onPatch(node.id, { cornerRadiusRem: clampCornerRadiusRem(Number(v)) })} />
			<UiInput {cornerMode} value={String((node.embellishmentConfig ?? DEFAULT_EMBELLISHMENT_CONFIG).offsetRem)} label="Offset rem" className="ui-font-mono" oninput={(v) => onPatch(node.id, { embellishmentConfig: { ...(node.embellishmentConfig ?? DEFAULT_EMBELLISHMENT_CONFIG), offsetRem: Number(v) || 0 } })} />
			<UiInput {cornerMode} value={String((node.embellishmentConfig ?? DEFAULT_EMBELLISHMENT_CONFIG).amplitudeRem)} label="Drift rem" className="ui-font-mono" oninput={(v) => onPatch(node.id, { embellishmentConfig: { ...(node.embellishmentConfig ?? DEFAULT_EMBELLISHMENT_CONFIG), amplitudeRem: Number(v) || 0 } })} />
		</div>

		<div class="flex flex-col gap-1">
			<span style="color: var(--ui-muted-content);">When Clicked (Action Binder)</span>
			<UiSelect {cornerMode} value={node.intentBinding ?? ''} options={ACTION_BINDINGS} label="Action Binder" onchange={(v) => onPatch(node.id, { intentBinding: v || undefined })} />
		</div>

		{#each Object.entries(schema.propSchema) as [key, field] (key)}
			<div class="flex flex-col gap-1">
				<span style="color: var(--ui-muted-content);">{field.label}</span>
				{#if field.type === 'number'}
					<UiInput {cornerMode} value={String(Number(node.props[key] ?? field.defaultValue))} label={field.label} className="ui-font-mono" oninput={(v) => patchProp(key, Number(v) || 0)} />
				{:else}
					<UiInput {cornerMode} value={String(node.props[key] ?? field.defaultValue)} label={field.label} oninput={(v) => patchProp(key, v)} />
				{/if}
			</div>
		{/each}

		<UiChamferButton {cornerMode} icon="copy" label="Promote to Reusable Blueprint" variant="secondary"
			onclick={() => onDeriveBlueprint(node.id, `${node.label} Blueprint`)} className="w-full py-1 text-xs" />

		<div class="flex items-center justify-between gap-2 pt-1">
			<UiChamferButton {cornerMode} icon="trash" label="Remove" variant="danger" onclick={() => onRemove(node.id)} className="py-1 text-xs" />
			<UiChamferButton {cornerMode} label="Done" variant="primary" onclick={onClose} className="py-1 text-xs" />
		</div>
	</div>
{:else}
	<div data-testid="node-inspector-empty" class="flex flex-col gap-2 border p-3 text-xs" style="border-color: var(--ui-border-subtle); background-color: var(--ui-base-100); color: var(--ui-muted-content);">
		<span class="ui-font-display font-semibold" style="color: var(--ui-base-content);">No Canvas Node Selected</span>
		<p class="leading-relaxed">Click any painted canvas block or pick an entity from the Wireframe Skeleton Workbench to edit its props, UML frame shape, corner geometry, or action binding.</p>
	</div>
{/if}
