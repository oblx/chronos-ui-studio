import type { CssCursorState } from './cursor.types';

export type CursorPackStyleId = 'cyber-reticle' | 'archival-nib' | 'tactical-brass' | 'minimal-precision';

export interface CursorSilhouetteColors {
	readonly fill: string;
	readonly stroke: string;
	readonly accent: string;
	readonly danger: string;
	readonly style?: CursorPackStyleId;
}

export const CURSOR_CALIBRATED_HOTSPOTS: Readonly<Record<CssCursorState, readonly [number, number]>> = {
	default: [4, 3], pointer: [10, 3], grab: [16, 16], grabbing: [16, 16], text: [16, 16],
	move: [16, 16], 'not-allowed': [16, 16], wait: [16, 16], progress: [4, 3], crosshair: [16, 16],
	help: [12, 12], 'zoom-in': [13, 13], 'zoom-out': [13, 13], 'col-resize': [16, 16],
	'row-resize': [16, 16], 'nesw-resize': [16, 16], 'nwse-resize': [16, 16],
	copy: [4, 3], alias: [4, 3], cell: [16, 16], 'context-menu': [4, 3]
} as const;

type SilhouetteFn = (c: CursorSilhouetteColors, sw: number, join: string) => string;

function packAccentOverlay(state: CssCursorState, c: CursorSilhouetteColors): string {
	const st = c.style ?? 'cyber-reticle';
	if (st === 'archival-nib') {
		if (state === 'default' || state === 'progress') return `<path d="M8.5 10.5l3.2 5.4" stroke="${c.accent}" stroke-width="1.35" stroke-linecap="round"/><circle cx="11.8" cy="16" r="1.2" fill="${c.accent}"/>`;
		if (state === 'text') return `<circle cx="16" cy="4.5" r="1.4" fill="${c.accent}"/><circle cx="16" cy="27.5" r="1.4" fill="${c.accent}"/>`;
		return `<circle cx="16" cy="16" r="1.5" fill="${c.accent}" opacity="0.88"/>`;
	}
	if (st === 'tactical-brass') {
		if (state === 'default') return `<path d="M7.5 11.5h4.2M9.5 14.5h3.2" stroke="${c.accent}" stroke-width="1.5"/>`;
		return `<path d="M3 7V3h4M29 25v4h-4" fill="none" stroke="${c.accent}" stroke-width="1.4" opacity="0.85"/>`;
	}
	if (st === 'minimal-precision') {
		if (state === 'default') return `<path d="M6.8 9.2l4.2 3.1" stroke="${c.accent}" stroke-width="1.2"/>`;
		return `<rect x="15" y="15" width="2" height="2" fill="${c.accent}"/>`;
	}
	if (state === 'default') return `<path d="M7 11l2.8 4.4-2.8 1.3z" fill="${c.accent}"/><path d="M23 4h5v5" fill="none" stroke="${c.accent}" stroke-width="1.3"/>`;
	return `<path d="M25 3h4v4M3 25v4h4" fill="none" stroke="${c.accent}" stroke-width="1.25" opacity="0.78"/>`;
}

function renderPointerGroup(state: CssCursorState, c: CursorSilhouetteColors, sw: number, join: string): string | null {
	if (state === 'default') {
		const path = c.style === 'archival-nib'
			? 'M4 3l15.5 10.5-5.8 2.2 3.4 7.2-2.6 1.3-3.5-7.1-4.8 4.4C5 15.5 4.4 9.2 4 3z'
			: c.style === 'minimal-precision'
				? 'M4 3l14.8 10.4-5.7 1.4 3.1 6.8-2.3 1.1-3.1-6.7L6 20.4V3z'
				: 'M4 3l16.5 11-6.5 1.8 3.6 7.4-3.1 1.4-3.6-7.3L6 21.5V3z';
		return `<path d="${path}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}"/>`;
	}
	if (state === 'pointer') {
		return `<path d="M10 3h3.2v10.2h2.2V9.8h3v3.4h2.2v-2.4h3V18c0 5.2-3 9.2-7.8 9.2h-2.8c-3.8 0-6.6-2.8-7.4-6.4L4 14.5l2.5-1.7 3.5 3.4V3z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}"/><path d="M10.4 5.5h2.4v4.5h-2.4z" fill="${c.accent}"/>`;
	}
	if (state === 'grab') {
		return `<path d="M9 13V7.5h2.5V12h1.4V5.5h2.5V12h1.4V6.2h2.5V12h1.4V8.5h2.5v9.8c0 4.6-2.9 8.2-7.4 8.2h-2.6c-4 0-6.8-3-7.2-7.2L5.5 14l2.2-1.2L9 14.8z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}"/><path d="M11 21h9" stroke="${c.accent}" stroke-width="1.6"/>`;
	}
	if (state === 'grabbing') {
		return `<path d="M8.5 12h3v3h1.2v-3.5h3v3.5h1.2v-3.5h3v3.5h1.1v-2.5h2.5v7.2c0 4.6-2.8 7.8-7.3 7.8h-2.6c-4.2 0-6.8-3.1-6.8-7.5v-5.2l1.7-2.8z" fill="${c.stroke}" stroke="${c.fill}" stroke-width="1.4" stroke-linejoin="${join}"/><path d="M11 19.5h10M11 22.5h8" stroke="${c.accent}" stroke-width="1.8"/>`;
	}
	if (state === 'text') {
		const cap = c.style === 'archival-nib' ? 'round' : 'square';
		return `<path d="M10 4h12M16 4v24M10 28h12" fill="none" stroke="${c.fill}" stroke-width="${sw + 2.4}" stroke-linecap="${cap}"/><path d="M10.5 4.5h11M16 4.5v23M10.5 27.5h11" fill="none" stroke="${c.stroke}" stroke-width="${sw}" stroke-linecap="${cap}"/><path d="M13 16h6" stroke="${c.accent}" stroke-width="2"/>`;
	}
	return null;
}

function renderTargetAndMoveGroup(state: CssCursorState, c: CursorSilhouetteColors, sw: number, join: string): string | null {
	if (state === 'crosshair') {
		const ring = c.style === 'tactical-brass' ? `<polygon points="16,9 23,16 16,23 9,16" fill="none" stroke="${c.accent}" stroke-width="1.6"/>` : `<circle cx="16" cy="16" r="6" fill="none" stroke="${c.accent}" stroke-width="1.5" stroke-dasharray="6 3.5"/>`;
		return `<path d="M16 2v8M16 22v8M2 16h8M22 16h8" stroke="${c.fill}" stroke-width="${sw + 2}"/><path d="M16 3v7M16 22v7M3 16h7M22 16h7" stroke="${c.stroke}" stroke-width="${sw}"/>${ring}`;
	}
	if (state === 'cell') {
		return `<path d="M13 4h6v9h9v6h-9v9h-6v-9H4v-6h9V4z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}"/><path d="M16 8v16M8 16h16" stroke="${c.accent}" stroke-width="1.4"/>`;
	}
	if (state === 'move') {
		return `<path d="M16 2l4.5 5H18v7h7v-2.5L30 16l-5 4.5V18h-7v7h2.5L16 30l-4.5-5H14v-7H7v2.5L2 16l5-4.5V14h7V7h-2.5L16 2z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}"/><polygon points="16,13 19,16 16,19 13,16" fill="${c.accent}"/>`;
	}
	if (state === 'col-resize') {
		return `<path d="M16 5v22" stroke="${c.fill}" stroke-width="${sw + 2}"/><path d="M16 6v20" stroke="${c.accent}" stroke-width="2"/><path d="M3 16l6-5.5V14h14v-3.5L29 16l-6 5.5V18H9v3.5L3 16z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}"/>`;
	}
	if (state === 'row-resize') {
		return `<path d="M5 16h22" stroke="${c.fill}" stroke-width="${sw + 2}"/><path d="M6 16h20" stroke="${c.accent}" stroke-width="2"/><path d="M16 3l5.5 6H18v14h3.5L16 29l-5.5-6H14V9h-3.5L16 3z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}"/>`;
	}
	if (state === 'nesw-resize') {
		return `<path d="M9 9l14 14" stroke="${c.accent}" stroke-width="1.8"/><path d="M26 6l-9 1 2.7 2.7-10 10L7 17l-1 9 9-1-2.7-2.7 10-10L25 15l1-9z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}"/>`;
	}
	if (state === 'nwse-resize') {
		return `<path d="M23 9L9 23" stroke="${c.accent}" stroke-width="1.8"/><path d="M6 6l9 1-2.7 2.7 10 10L25 17l1 9-9-1 2.7-2.7-10-10L7 15 6 6z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}"/>`;
	}
	return null;
}

function renderUtilityGroup(state: CssCursorState, c: CursorSilhouetteColors, sw: number, join: string): string {
	const lensShape = c.style === 'archival-nib' || c.style === 'minimal-precision'
		? `<circle cx="13" cy="13" r="9" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}"/>`
		: `<polygon points="9,4 17,4 22,9 22,17 17,22 9,22 4,17 4,9" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}"/>`;
	const map: Readonly<Record<string, SilhouetteFn>> = {
		'zoom-in': () => `${lensShape}<path d="M20 20l8.5 8.5" stroke="${c.stroke}" stroke-width="3.2" stroke-linecap="square"/><path d="M13 8.5v9M8.5 13h9" stroke="${c.accent}" stroke-width="2.2"/>`,
		'zoom-out': () => `${lensShape}<path d="M20 20l8.5 8.5" stroke="${c.stroke}" stroke-width="3.2" stroke-linecap="square"/><path d="M8.5 13h9" stroke="${c.accent}" stroke-width="2.2"/>`,
		wait: () => `<circle cx="16" cy="16" r="12" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-dasharray="14 4"/><path d="M11 8h10l-4 8 4 8H11l4-8-4-8z" fill="none" stroke="${c.accent}" stroke-width="1.8" stroke-linejoin="${join}"/>`,
		progress: () => `<path d="M4 3l11 8-4.5 1.3 2.5 5.2-2.2 1-2.5-5.2-4.3 3.2V3z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"/><circle cx="22" cy="22" r="6.5" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5" stroke-dasharray="11 4"/><circle cx="22" cy="22" r="2.2" fill="${c.accent}"/>`,
		'not-allowed': () => `<polygon points="11,4 21,4 28,11 28,21 21,28 11,28 4,21 4,11" fill="${c.fill}" stroke="${c.danger}" stroke-width="2.4" stroke-linejoin="${join}"/><path d="M9.5 22.5l13-13" stroke="${c.danger}" stroke-width="2.6"/>`,
		help: () => `<polygon points="16,2 30,16 16,30 2,16" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}"/><path d="M12.8 12.2c0-2.1 6.4-2.1 6.4 0 0 1.9-3.2 2.3-3.2 4.6M16 21.8h.01" fill="none" stroke="${c.accent}" stroke-width="2.2" stroke-linecap="round"/>`,
		'context-menu': () => `<polygon points="4,4 24,4 28,8 28,26 8,26 4,22" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}"/><path d="M9 11h14M9 15.5h14M9 20h10" stroke="${c.accent}" stroke-width="2"/>`,
		copy: () => `<rect x="5" y="5" width="13" height="15" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.6"/><polygon points="12,10 25,10 28,13 28,27 12,27" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}"/><path d="M20 14.5v8M16 18.5h8" stroke="${c.accent}" stroke-width="2.2"/>`,
		alias: () => `<polygon points="4,4 24,4 28,8 28,28 8,28 4,24" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="${join}"/><path d="M10 22c0-6 4-9 11-9m-4-4l5 4-5 4" fill="none" stroke="${c.accent}" stroke-width="2.2" stroke-linejoin="${join}"/>`
	};
	return (map[state] ?? map.help)(c, sw, join);
}

export function buildBespokeCursorBody(state: CssCursorState, colors: CursorSilhouetteColors): string {
	const sw = colors.style === 'minimal-precision' ? 1.4 : colors.style === 'tactical-brass' ? 2.1 : 1.75;
	const join = colors.style === 'archival-nib' ? 'round' : 'miter';
	const core = renderPointerGroup(state, colors, sw, join)
		?? renderTargetAndMoveGroup(state, colors, sw, join)
		?? renderUtilityGroup(state, colors, sw, join);
	return `${core}${packAccentOverlay(state, colors)}`;
}
