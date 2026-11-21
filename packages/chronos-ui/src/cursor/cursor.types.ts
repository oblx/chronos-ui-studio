export const CSS_CURSOR_STATES = [
	'default',
	'pointer',
	'grab',
	'grabbing',
	'text',
	'move',
	'not-allowed',
	'wait',
	'progress',
	'crosshair',
	'help',
	'zoom-in',
	'zoom-out',
	'col-resize',
	'row-resize',
	'nesw-resize',
	'nwse-resize',
	'copy',
	'alias',
	'cell',
	'context-menu'
] as const;

export type CssCursorState = (typeof CSS_CURSOR_STATES)[number];

export type CursorGeneratorOrigin = 'PRESET' | 'AI_DERIVED' | 'PROCEDURAL_SVG' | 'USER_UPLOAD';

export interface CursorStateAsset {
	readonly uuid?: string;
	readonly cssState: CssCursorState;
	readonly assetDataUrl: string;
	readonly hotspotX: number;
	readonly hotspotY: number;
	readonly generatorOrigin: CursorGeneratorOrigin;
}

export interface CursorPackDefinition {
	readonly uuid: string;
	readonly slug: string;
	readonly name: string;
	readonly description: string;
	readonly isBuiltin: boolean;
	readonly derivedFromUuid?: string | null;
	readonly sourcePngDataUrl?: string | null;
	readonly baseHotspotX: number;
	readonly baseHotspotY: number;
	readonly states: Readonly<Record<CssCursorState, CursorStateAsset>>;
}

export interface ResolvedCursorPalette {
	readonly primaryHex: string;
	readonly accentHex: string;
	readonly strokeHex: string;
	readonly fillHex: string;
}
