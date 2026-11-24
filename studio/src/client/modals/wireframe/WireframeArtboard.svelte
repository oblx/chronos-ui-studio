<script lang="ts">
	import { buildShapeGeometry, clamp, type CornerKind, type HudZoneId, type RegisteredUiEntity } from '@chronos-ui/svelte';
	import { ARTBOARD_H_TICKS, ARTBOARD_SPEC, ARTBOARD_V_TICKS, ARTBOARD_ZONES, type WireframeToolId } from './wireframe.types';

	interface Props {
		cornerMode: CornerKind; entities: readonly RegisteredUiEntity[]; selectedUuid: string | null; hoveredUuid: string | null;
		activeTool: WireframeToolId; snapGrid: boolean; snapStepPx: number; showArcs: boolean; zoom: number; panX: number; panY: number;
		onSelectEntity: (uuid: string) => void; onHoverEntity: (uuid: string | null) => void; onClickZone: (zoneId: HudZoneId) => void;
		onSpawnInZone: (zoneId: HudZoneId) => void; onPanDelta: (dx: number, dy: number) => void; onZoomWheel: (delta: number) => void;
	}

	let p: Props = $props();
	let dragging = $state(false), lastX = 0, lastY = 0;
	let pointerSvg = $state<{ x: number; y: number } | null>(null);
	let svgEl = $state<SVGSVGElement | null>(null);

	interface PlacedNode { readonly ent: RegisteredUiEntity; readonly x: number; readonly y: number; readonly w: number; readonly h: number; }

	let byZone = $derived.by(() => {
		const map = new Map<HudZoneId, RegisteredUiEntity[]>();
		for (const ent of p.entities) {
			const list = map.get(ent.zoneId) ?? [];
			list.push(ent);
			map.set(ent.zoneId, list);
		}
		return map;
	});

	let placed = $derived.by<readonly PlacedNode[]>(() => {
		const out: PlacedNode[] = [];
		for (const z of ARTBOARD_ZONES) {
			const list = byZone.get(z.id) ?? [];
			const cols = z.id === 'WORLD_CANVAS' ? clamp(Math.ceil(Math.sqrt(list.length)), 2, 3) : clamp(list.length, 1, 2);
			const rows = Math.max(1, Math.ceil(list.length / cols));
			const pad = ARTBOARD_SPEC.cellPadPx;
			const cellW = Math.max(ARTBOARD_SPEC.minCellW, (z.w - pad * (cols + 1)) / cols);
			const cellH = clamp((z.h - 22 - pad * rows) / rows, ARTBOARD_SPEC.minCellH, ARTBOARD_SPEC.maxCellH);
			list.forEach((ent, i) => {
				const c = i % cols; const r = Math.floor(i / cols);
				out.push({ ent, x: z.x + pad + c * (cellW + pad), y: z.y + 18 + r * (cellH + pad), w: cellW, h: cellH });
			});
		}
		return out;
	});

	let selectedPlaced = $derived(placed.find((n) => n.ent.uuid === p.selectedUuid) ?? null);
	const ARC_KINDS = ['INTENT', 'DATA', 'SYNC'] as const;

	let eventArcs = $derived.by(() => {
		if (!p.showArcs || placed.length < 2) return [];
		const arcs: Array<{ id: string; d: string; x1: number; y1: number; x2: number; y2: number; mx: number; my: number; label: string }> = [];
		for (let i = 0; i < placed.length - 1; i += 1) {
			const a = placed[i]; const b = placed[i + 1];
			if (!a.ent.intentBinding && a.ent.parentUuid !== b.ent.uuid && b.ent.parentUuid !== a.ent.uuid && i > 4) continue;
			const x1 = a.x + a.w; const y1 = a.y + a.h * 0.5;
			const x2 = b.x; const y2 = b.y + b.h * 0.5;
			const cx = (x1 + x2) * 0.5; const cy = Math.min(y1, y2) - 22;
			arcs.push({ id: `${a.ent.uuid}-${b.ent.uuid}`, d: `M ${x1} ${y1} Q ${cx} ${cy}, ${x2} ${y2}`, x1, y1, x2, y2, mx: cx, my: (y1 + y2) * 0.25 + cy * 0.5, label: ARC_KINDS[i % ARC_KINDS.length] });
		}
		return arcs;
	});

	function updatePointer(e: PointerEvent): void {
		if (!svgEl) return;
		const r = svgEl.getBoundingClientRect();
		if (r.width <= 0 || r.height <= 0) return;
		const sx = clamp(Math.round(((e.clientX - r.left) / r.width) * ARTBOARD_SPEC.w), 0, ARTBOARD_SPEC.w);
		const sy = clamp(Math.round(((e.clientY - r.top) / r.height) * ARTBOARD_SPEC.h), 0, ARTBOARD_SPEC.h);
		pointerSvg = { x: sx, y: sy };
	}
	function handlePointerDown(e: PointerEvent): void { if (p.activeTool === 'PAN') { dragging = true; lastX = e.clientX; lastY = e.clientY; } }
	function handlePointerMove(e: PointerEvent): void { updatePointer(e); if (!dragging) return; p.onPanDelta(e.clientX - lastX, e.clientY - lastY); lastX = e.clientX; lastY = e.clientY; }
	function handleWheel(e: WheelEvent): void { e.preventDefault(); p.onZoomWheel(e.deltaY < 0 ? ARTBOARD_SPEC.zoomStep : -ARTBOARD_SPEC.zoomStep); }
</script>

<div role="region" aria-label="Interactive Skeleton Artboard" data-testid="wf-artboard" onpointerdown={handlePointerDown} onpointermove={handlePointerMove} onpointerup={() => { dragging = false; }} onpointerleave={() => { dragging = false; pointerSvg = null; }} onwheel={handleWheel}
	class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden select-none"
	style="background-color: var(--ui-base-100); {p.snapGrid ? `background-image: linear-gradient(to right, color-mix(in srgb, var(--ui-border-subtle) 32%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--ui-border-subtle) 32%, transparent) 1px, transparent 1px); background-size: ${p.snapStepPx * 2.5}px ${p.snapStepPx * 2.5}px;` : ''}">
	<div class="flex h-[1.25rem] shrink-0 border-b" style="background-color: var(--ui-base-200); border-color: var(--ui-border-subtle);" data-testid="wf-ruler-top">
		<div class="w-[1.25rem] shrink-0 border-r" style="border-color: var(--ui-border-subtle);"></div>
		<div class="ui-font-mono relative flex flex-1 items-center justify-between px-2 text-[0.55rem]" style="color: var(--ui-muted-content);">
			{#each ARTBOARD_H_TICKS as t (t)}<span>{t}</span>{/each}
			{#if pointerSvg}<span class="pointer-events-none absolute top-0 bottom-0 w-px" style="left: {(pointerSvg.x / ARTBOARD_SPEC.w) * 100}%; background-color: var(--ui-accent-vivid, var(--ui-primary));"></span>{/if}
		</div>
	</div>
	<div class="relative flex min-h-0 flex-1">
		<div class="ui-font-mono relative flex w-[1.25rem] shrink-0 flex-col justify-between border-r py-2 text-center text-[0.52rem]" style="background-color: var(--ui-base-200); border-color: var(--ui-border-subtle); color: var(--ui-muted-content);" data-testid="wf-ruler-left">
			{#each ARTBOARD_V_TICKS as t (t)}<span>{t}</span>{/each}
			{#if pointerSvg}<span class="pointer-events-none absolute right-0 left-0 h-px" style="top: {(pointerSvg.y / ARTBOARD_SPEC.h) * 100}%; background-color: var(--ui-accent-vivid, var(--ui-primary));"></span>{/if}
		</div>
		<div class="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden p-2">
			<div class="ui-font-mono pointer-events-none absolute top-1.5 right-2 z-10 border px-1.5 py-0.5 text-[0.6rem]" data-testid="wf-crosshair-badge" style="background-color: var(--ui-base-200); border-color: var(--ui-border-subtle); color: var(--ui-base-content);">
				X:{pointerSvg?.x ?? Math.round(selectedPlaced?.x ?? 0)} Y:{pointerSvg?.y ?? Math.round(selectedPlaced?.y ?? 0)} · {Math.round(selectedPlaced?.w ?? 0)}x{Math.round(selectedPlaced?.h ?? 0)}
			</div>
			<svg bind:this={svgEl} viewBox={`0 0 ${ARTBOARD_SPEC.w} ${ARTBOARD_SPEC.h}`} width={ARTBOARD_SPEC.w} height={ARTBOARD_SPEC.h} class="ui-dur-micro h-full max-h-full w-full max-w-full transition-transform" style="transform: translate3d({p.panX}px, {p.panY}px, 0) scale({p.zoom}); transform-origin: center;">
				<defs>
					<marker id="wf-arc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
						<path d="M 0 1 L 10 5 L 0 9 z" fill="var(--ui-accent-vivid, var(--ui-primary))" />
					</marker>
				</defs>
				{#each ARTBOARD_ZONES as z (z.id)}
					{@const empty = (byZone.get(z.id)?.length ?? 0) === 0}
					<g>
						<rect x={z.x} y={z.y} width={z.w} height={z.h} rx={p.cornerMode === 'ROUND' ? 6 : 0} fill="color-mix(in srgb, var(--ui-base-200) 65%, transparent)" stroke="var(--ui-border-subtle)" stroke-width="1" stroke-dasharray="4 3" role="button" tabindex="0" aria-label={`Zone ${z.label}`} data-testid={`wf-zone-${z.id}`} onclick={() => p.onClickZone(z.id)} onkeydown={(e) => { if (e.key === 'Enter') p.onClickZone(z.id); }} />
						<text x={z.x + 6} y={z.y + 12} fill="var(--ui-muted-content)" font-size="8.5" font-family="var(--ui-font-mono)">{z.label}</text>
						{#if empty && z.h >= 30}
							<g role="button" tabindex="0" aria-label={`Add component to ${z.label}`} data-testid={`wf-zone-add-${z.id}`} onclick={(e) => { e.stopPropagation(); p.onSpawnInZone(z.id); }} onkeydown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); p.onSpawnInZone(z.id); } }}>
								<text x={z.x + z.w * 0.5} y={z.y + Math.max(22, z.h * 0.58)} text-anchor="middle" fill="var(--ui-primary)" font-size="8.5" font-family="var(--ui-font-mono)" opacity="0.72">+ Add Component</text>
							</g>
						{/if}
					</g>
				{/each}
				{#each eventArcs as arc (arc.id)}
					<path d={arc.d} fill="none" stroke="var(--ui-accent-vivid, var(--ui-primary))" stroke-width="1.35" opacity="0.76" marker-end="url(#wf-arc-arrow)" class="ui-dag-arc pointer-events-none" />
					<circle cx={arc.x1} cy={arc.y1} r="2.6" fill="var(--ui-primary)" class="pointer-events-none" />
					<circle cx={arc.x2} cy={arc.y2} r="2.6" fill="var(--ui-secondary)" class="pointer-events-none" />
					<rect x={arc.mx - 20} y={arc.my - 7} width="40" height="13" fill="var(--ui-base-200)" stroke="var(--ui-border-subtle)" stroke-width="0.8" class="pointer-events-none" />
					<text x={arc.mx} y={arc.my + 2.5} text-anchor="middle" fill="var(--ui-primary)" font-size="7.2" font-family="var(--ui-font-mono)" class="pointer-events-none">{arc.label}</text>
				{/each}
				{#each placed as item (item.ent.uuid)}
					{@const isSel = item.ent.uuid === p.selectedUuid}
					{@const isHov = item.ent.uuid === p.hoveredUuid}
					{@const compact = item.h < ARTBOARD_SPEC.compactHeightPx}
					{@const geom = buildShapeGeometry(item.ent.shape, item.w, item.h, p.cornerMode === 'STRAIGHT' ? 0 : 8, item.ent.corners)}
					{@const meta = `${item.ent.shortId} · ${item.ent.shape}`}
					<g transform="translate({item.x}, {item.y})" opacity={item.ent.visible ? 1 : 0.32} role="button" tabindex="0" aria-label={`Select entity ${item.ent.label}`} data-testid={`wf-node-${item.ent.shortId}`} data-compact={compact ? 'true' : 'false'} onclick={(e) => { e.stopPropagation(); p.onSelectEntity(item.ent.uuid); }} onkeydown={(e) => { if (e.key === 'Enter') p.onSelectEntity(item.ent.uuid); }} onmouseenter={() => p.onHoverEntity(item.ent.uuid)} onmouseleave={() => p.onHoverEntity(null)}>
						<path d={geom.outerPath} fill={isSel ? 'color-mix(in srgb, var(--ui-primary) 22%, var(--ui-base-200))' : 'var(--ui-base-200)'} stroke={isSel ? 'var(--ui-accent-vivid, var(--ui-primary))' : isHov ? 'var(--ui-secondary)' : 'var(--ui-border-subtle)'} stroke-width={isSel || isHov ? 2 : 1.25} />
						{#if compact}
							<text x="8" y={item.h * 0.5 + 3.5} data-wf-label="title" fill="var(--ui-base-content)" font-size="9.5" font-weight="600" font-family="var(--ui-font-display)">{item.ent.label.slice(0, Math.max(8, Math.floor((item.w - 92) / 6.2)))}{item.ent.locked ? ' [L]' : ''}</text>
							<text x={item.w - 8} y={item.h * 0.5 + 3} text-anchor="end" data-wf-label="meta" fill="var(--ui-muted-content)" font-size="7.8" font-family="var(--ui-font-mono)">{meta}</text>
						{:else}
							<text x="8" y="17" data-wf-label="title" fill="var(--ui-base-content)" font-size="10" font-weight="600" font-family="var(--ui-font-display)">{item.ent.label.slice(0, 20)}{item.ent.locked ? ' [LOCK]' : ''}</text>
							<text x="8" y="34" data-wf-label="meta" fill="var(--ui-muted-content)" font-size="8.2" font-family="var(--ui-font-mono)">{meta}</text>
						{/if}
					</g>
				{/each}
			</svg>
		</div>
	</div>
</div>
