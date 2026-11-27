import type { CssCursorState } from './cursor.types';

export type CursorPackStyleId = 'cyber-reticle' | 'archival-nib' | 'tactical-brass' | 'minimal-precision';
export const CURSOR_PACK_STYLES: readonly CursorPackStyleId[] = ['cyber-reticle', 'archival-nib', 'tactical-brass', 'minimal-precision'] as const;
export const CURSOR_DRAG_TARGET_STATES: ReadonlySet<CssCursorState> = new Set<CssCursorState>(['grab', 'grabbing', 'copy', 'alias']);

export function resolveCursorPackStyle(slug?: string): CursorPackStyleId {
	return CURSOR_PACK_STYLES.includes(slug as CursorPackStyleId) ? (slug as CursorPackStyleId) : 'cyber-reticle';
}

export interface CursorSilhouetteColors {
	readonly fill: string;
	readonly stroke: string;
	readonly accent: string;
	readonly danger: string;
	readonly style?: CursorPackStyleId;
	readonly dragTargetFrames?: boolean;
}

export const CURSOR_CALIBRATED_HOTSPOTS: Readonly<Record<CssCursorState, readonly [number, number]>> = {
	default: [4, 3], pointer: [10, 3], grab: [16, 16], grabbing: [16, 16], text: [16, 16],
	move: [16, 16], 'not-allowed': [16, 16], wait: [16, 16], progress: [4, 3], crosshair: [16, 16],
	help: [12, 12], 'zoom-in': [13, 13], 'zoom-out': [13, 13], 'col-resize': [16, 16],
	'row-resize': [16, 16], 'nesw-resize': [16, 16], 'nwse-resize': [16, 16],
	copy: [4, 3], alias: [4, 3], cell: [16, 16], 'context-menu': [4, 3]
} as const;

type SilhouetteFn = (c: CursorSilhouetteColors, sw: number, join: string) => string;

function packInteriorAccent(state: CssCursorState, c: CursorSilhouetteColors): string {
	const style = resolveCursorPackStyle(c.style);
	if (state === 'default') {
		if (style === 'archival-nib') return `<path d="M8.5 10.5l3 5.2" stroke="${c.accent}" stroke-width="1.35" stroke-linecap="round"/><circle cx="11.6" cy="15.8" r="1.15" fill="${c.accent}"/>`;
		if (style === 'tactical-brass') return `<path d="M7.5 11.5h4M9.5 14.5h3" stroke="${c.accent}" stroke-width="1.45"/>`;
		if (style === 'minimal-precision') return `<path d="M7 9.5l3.8 2.8" stroke="${c.accent}" stroke-width="1.2"/>`;
		return `<path d="M7.2 10.6l3.2 4.2-3.2 1.2z" fill="${c.accent}"/>`;
	}
	if (state === 'text' && style === 'archival-nib') {
		return `<circle cx="16" cy="4.5" r="1.3" fill="${c.accent}"/><circle cx="16" cy="27.5" r="1.3" fill="${c.accent}"/>`;
	}
	return '';
}

function dragTargetBracketOverlay(state: CssCursorState, c: CursorSilhouetteColors): string {
	if (c.dragTargetFrames === false || !CURSOR_DRAG_TARGET_STATES.has(state)) return '';
	if (state === 'copy' || state === 'alias') {
		return `<path data-drag-target-frame="true" d="M25 29h4v-4" fill="none" stroke="${c.accent}" stroke-width="1.25" opacity="0.82"/>`;
	}
	return `<path data-drag-target-frame="true" d="M26 3h3v3M3 26v3h3" fill="none" stroke="${c.accent}" stroke-width="1.25" opacity="0.82"/>`;
}

function renderPointerGroup(state: CssCursorState, c: CursorSilhouetteColors, sw: number, join: string): string | null {
	const ml = 'stroke-miterlimit="3"';
	if (state === 'default') {
		const path = c.style === 'archival-nib'
			? 'M4 3L19.5 13.5L13.7 15.7L17.1 22.9L14.5 24.2L11 17.1L5.8 21.5L4 3Z'
			: c.style === 'minimal-precision'
				? 'M4 3L18.8 13.4L13.1 14.8L16.2 21.6L13.9 22.7L10.8 16L4 20.8Z'
				: 'M4 3L20.5 14L14 15.8L17.6 23.2L14.5 24.6L10.9 17.3L4 22.2Z';
		return `<path d="${path}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}" ${ml}/>`;
	}
	if (state === 'pointer') {
		return `<path d="M10 3h3.2v10.2h2.2V9.8h3v3.4h2.2v-2.4h3V18c0 5.2-3 9.2-7.8 9.2h-2.8c-3.8 0-6.6-2.8-7.4-6.4L4 14.5l2.5-1.7 3.5 3.4V3z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}" ${ml}/><path d="M10.4 5.5h2.4v4.5h-2.4z" fill="${c.accent}"/>`;
	}
	if (state === 'grab') {
		return `<path d="M9 13V7.5h2.5V12h1.4V5.5h2.5V12h1.4V6.2h2.5V12h1.4V8.5h2.5v9.8c0 4.6-2.9 8.2-7.4 8.2h-2.6c-4 0-6.8-3-7.2-7.2L5.5 14l2.2-1.2L9 14.8z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}" ${ml}/><path d="M11 21h9" stroke="${c.accent}" stroke-width="1.6"/>`;
	}
	if (state === 'grabbing') {
		return `<path d="M8.5 12h3v3h1.2v-3.5h3v3.5h1.2v-3.5h3v3.5h1.1v-2.5h2.5v7.2c0 4.6-2.8 7.8-7.3 7.8h-2.6c-4.2 0-6.8-3.1-6.8-7.5v-5.2l1.7-2.8z" fill="${c.stroke}" stroke="${c.fill}" stroke-width="1.4" stroke-linejoin="${join}" ${ml}/><path d="M11 19.5h10M11 22.5h8" stroke="${c.accent}" stroke-width="1.8"/>`;
	}
	if (state === 'text') {
		const cap = c.style === 'archival-nib' ? 'round' : 'square';
		return `<path d="M10 4h12M16 4v24M10 28h12" fill="none" stroke="${c.fill}" stroke-width="${sw + 2.4}" stroke-linecap="${cap}"/><path d="M10.5 4.5h11M16 4.5v23M10.5 27.5h11" fill="none" stroke="${c.stroke}" stroke-width="${sw}" stroke-linecap="${cap}"/><path d="M13 16h6" stroke="${c.accent}" stroke-width="2"/>`;
	}
	return null;
}

function renderTargetAndMoveGroup(state: CssCursorState, c: CursorSilhouetteColors, sw: number, join: string): string | null {
	const ml = 'stroke-miterlimit="3"';
	if (state === 'crosshair') {
		const ring = c.style === 'tactical-brass' ? `<polygon points="16,9 23,16 16,23 9,16" fill="none" stroke="${c.accent}" stroke-width="1.6"/>` : `<circle cx="16" cy="16" r="6" fill="none" stroke="${c.accent}" stroke-width="1.5" stroke-dasharray="6 3.5"/>`;
		return `<path d="M16 3v7M16 22v7M3 16h7M22 16h7" stroke="${c.fill}" stroke-width="${sw + 2}"/><path d="M16 3.5v6.5M16 22v6.5M3.5 16h6.5M22 16h6.5" stroke="${c.stroke}" stroke-width="${sw}"/>${ring}`;
	}
	if (state === 'cell') {
		return `<path d="M13 4h6v9h9v6h-9v9h-6v-9H4v-6h9V4z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}" ${ml}/><path d="M16 8v16M8 16h16" stroke="${c.accent}" stroke-width="1.4"/>`;
	}
	if (state === 'move') {
		return `<path d="M16 3l4.2 4.6H18v6.4h6.4v-2.2L29 16l-4.6 4.2V18H18v6.4h2.2L16 29l-4.2-4.6H14V18H7.6v2.2L3 16l4.6-4.2V14H14V7.6h-2.2L16 3z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}" ${ml}/><polygon points="16,13 19,16 16,19 13,16" fill="${c.accent}"/>`;
	}
	if (state === 'col-resize') {
		return `<path d="M16 5v22" stroke="${c.fill}" stroke-width="${sw + 2}"/><path d="M16 6v20" stroke="${c.accent}" stroke-width="2"/><path d="M3 16l6-5.5V14h14v-3.5L29 16l-6 5.5V18H9v3.5L3 16z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}" ${ml}/>`;
	}
	if (state === 'row-resize') {
		return `<path d="M5 16h22" stroke="${c.fill}" stroke-width="${sw + 2}"/><path d="M6 16h20" stroke="${c.accent}" stroke-width="2"/><path d="M16 3l5.5 6H18v14h3.5L16 29l-5.5-6H14V9h-3.5L16 3z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}" ${ml}/>`;
	}
	if (state === 'nesw-resize') {
		return `<path d="M9 9l14 14" stroke="${c.accent}" stroke-width="1.8"/><path d="M26 6l-9 1 2.7 2.7-10 10L7 17l-1 9 9-1-2.7-2.7 10-10L25 15l1-9z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}" ${ml}/>`;
	}
	if (state === 'nwse-resize') {
		return `<path d="M23 9L9 23" stroke="${c.accent}" stroke-width="1.8"/><path d="M6 6l9 1-2.7 2.7 10 10L25 17l1 9-9-1 2.7-2.7-10-10L7 15 6 6z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}" ${ml}/>`;
	}
	return null;
}

function renderUtilityGroup(state: CssCursorState, c: CursorSilhouetteColors, sw: number, join: string): string {
	const ml = 'stroke-miterlimit="3"';
	const lensShape = c.style === 'archival-nib' || c.style === 'minimal-precision'
		? `<circle cx="13" cy="13" r="8.5" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}"/>`
		: `<polygon points="9,4.5 17,4.5 21.5,9 21.5,17 17,21.5 9,21.5 4.5,17 4.5,9" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}" ${ml}/>`;
	const map: Readonly<Record<string, SilhouetteFn>> = {
		'zoom-in': () => `${lensShape}<path d="M19.5 19.5l8 8" stroke="${c.stroke}" stroke-width="3" stroke-linecap="square"/><path d="M13 8.5v9M8.5 13h9" stroke="${c.accent}" stroke-width="2.1"/>`,
		'zoom-out': () => `${lensShape}<path d="M19.5 19.5l8 8" stroke="${c.stroke}" stroke-width="3" stroke-linecap="square"/><path d="M8.5 13h9" stroke="${c.accent}" stroke-width="2.1"/>`,
		wait: () => `<circle cx="16" cy="16" r="11.5" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-dasharray="14 4"/><path d="M11 8.5h10l-4 7.5 4 7.5H11l4-7.5-4-7.5z" fill="none" stroke="${c.accent}" stroke-width="1.8" stroke-linejoin="${join}" ${ml}/>`,
		progress: () => `<path d="M4 3L15 11L10.5 12.3L13 17.5L10.8 18.5L8.3 13.3L4 16.5Z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5" stroke-linejoin="${join}" ${ml}/><circle cx="22" cy="22" r="6" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5" stroke-dasharray="11 4"/><circle cx="22" cy="22" r="2.1" fill="${c.accent}"/>`,
		'not-allowed': () => `<polygon points="11,4 21,4 28,11 28,21 21,28 11,28 4,21 4,11" fill="${c.fill}" stroke="${c.danger}" stroke-width="2.3" stroke-linejoin="${join}" ${ml}/><path d="M9.5 22.5l13-13" stroke="${c.danger}" stroke-width="2.5"/>`,
		help: () => `<polygon points="16,3 29,16 16,29 3,16" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}" ${ml}/><path d="M12.8 12.2c0-2.1 6.4-2.1 6.4 0 0 1.9-3.2 2.3-3.2 4.6M16 21.8h.01" fill="none" stroke="${c.accent}" stroke-width="2.1" stroke-linecap="round"/>`,
		'context-menu': () => `<polygon points="4,3 24,3 28,7 28,26 8,26 4,22" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}" ${ml}/><path d="M9 10.5h14M9 15h14M9 19.5h10" stroke="${c.accent}" stroke-width="2"/>`,
		copy: () => `<rect x="4" y="3" width="13" height="15" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"/><polygon points="11,9 24,9 27,12 27,26 11,26" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}" ${ml}/><path d="M19 13.5v8M15 17.5h8" stroke="${c.accent}" stroke-width="2.1"/>`,
		alias: () => `<polygon points="4,3 24,3 27,6 27,26 7,26 4,23" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}" ${ml}/><path d="M10 21c0-6 4-9 11-9m-4-4l5 4-5 4" fill="none" stroke="${c.accent}" stroke-width="2.1" stroke-linejoin="${join}" ${ml}/>`
	};
	return (map[state] ?? map.help)(c, sw, join);
}

export function buildBespokeCursorBody(state: CssCursorState, colors: CursorSilhouetteColors): string {
	const sw = colors.style === 'minimal-precision' ? 1.4 : colors.style === 'tactical-brass' ? 2.1 : 1.75;
	const join = colors.style === 'archival-nib' ? 'round' : 'miter';
	const core = renderPointerGroup(state, colors, sw, join)
		?? renderTargetAndMoveGroup(state, colors, sw, join)
		?? renderUtilityGroup(state, colors, sw, join);
	return `${core}${packInteriorAccent(state, colors)}${dragTargetBracketOverlay(state, colors)}`;
}
