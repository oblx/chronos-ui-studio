export interface RgbColor {
	readonly r: number;
	readonly g: number;
	readonly b: number;
}

export type WcagGrade = 'AAA' | 'AA' | 'AA_LARGE' | 'FAIL';

export interface ContrastCheckResult {
	readonly pair: string;
	readonly ratio: number;
	readonly grade: WcagGrade;
	readonly passAa: boolean;
}

export function parseHexRgb(hex: string): RgbColor | null {
	const cleaned = hex.trim().replace(/^#/, '');
	if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
		return null;
	}
	return {
		r: Number.parseInt(cleaned.slice(0, 2), 16),
		g: Number.parseInt(cleaned.slice(2, 4), 16),
		b: Number.parseInt(cleaned.slice(4, 6), 16)
	};
}

function linearizeChannel(channel: number): number {
	const s = channel / 255;
	return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(rgb: RgbColor): number {
	const r = linearizeChannel(rgb.r);
	const g = linearizeChannel(rgb.g);
	const b = linearizeChannel(rgb.b);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fgHex: string, bgHex: string): number {
	const fg = parseHexRgb(fgHex);
	const bg = parseHexRgb(bgHex);
	if (!fg || !bg) {
		return 1;
	}
	const l1 = relativeLuminance(fg);
	const l2 = relativeLuminance(bg);
	const bright = Math.max(l1, l2);
	const dark = Math.min(l1, l2);
	return Number(((bright + 0.05) / (dark + 0.05)).toFixed(2));
}

export function evaluateWcagGrade(ratio: number): WcagGrade {
	if (ratio >= 7) {
		return 'AAA';
	}
	if (ratio >= 4.5) {
		return 'AA';
	}
	if (ratio >= 3) {
		return 'AA_LARGE';
	}
	return 'FAIL';
}

export function checkContrastPair(
	pair: string,
	fgHex: string,
	bgHex: string
): ContrastCheckResult {
	const ratio = contrastRatio(fgHex, bgHex);
	return {
		pair,
		ratio,
		grade: evaluateWcagGrade(ratio),
		passAa: ratio >= 4.5
	};
}
