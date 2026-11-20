import { buildCursorPackCssSheet, clampCornerRadiusRem, clampStudioDefaults, CSS_CURSOR_STATES, DEFAULT_STUDIO_DEFAULTS, findBuiltinCursorPack, type UiProjectDefinition } from '@chronos-ui/svelte';
import { generateCssTokenSheet } from '@studio/core';
import { registerOutputAdapter } from '../registry';
import type { ProjectTextArtifact } from './svelte.adapter';

export function emitProjectCssTokens(project: UiProjectDefinition): ProjectTextArtifact {
	const pack = project.activeCursorPackId ? findBuiltinCursorPack(project.activeCursorPackId) : undefined;
	const cornerCutRem = clampCornerRadiusRem(project.cornerRadiusRem);
	const defs = clampStudioDefaults(project.studioDefaults, { ...DEFAULT_STUDIO_DEFAULTS, baseCornerCutRem: cornerCutRem });
	const cornerCss = [
		'\n:root {',
		`\t--ui-corner-cut: ${defs.baseCornerCutRem}rem;`,
		`\t--ui-station-cut: ${defs.stationCornerCutRem}rem;`,
		`\t--ui-control-cut: ${defs.controlCornerCutRem}rem;`,
		`\t--ui-stroke-w: ${defs.borderStrokePx}px;`,
		`\t--ui-orn-offset: ${defs.ornamentOffsetRem}rem;`,
		`\t--ui-orn-amp: ${defs.ornamentDriftAmpRem}rem;`,
		`\t--ui-orn-period: ${defs.ornamentPeriodMs}ms;`,
		`\t--ui-perimeter-gutter: ${defs.perimeterGutterRem}rem;`,
		'}'
	].join('\n');
	const cursorCss = pack ? `\n\n/* Active ${CSS_CURSOR_STATES.length}-State Cursor Pack: ${pack.name} */\n${buildCursorPackCssSheet(pack)}` : '';
	return {
		adapterId: 'css-tokens',
		filename: `${project.slug}.tokens.css`,
		mimeType: 'text/css; charset=utf-8',
		content: `${generateCssTokenSheet(project.themeId)}${cornerCss}${cursorCss}`
	};
}

registerOutputAdapter<UiProjectDefinition, ProjectTextArtifact>({
	id: 'css-tokens',
	label: 'WCAG-Verified Semantic CSS Token Sheet',
	mimeType: 'text/css; charset=utf-8',
	emit: emitProjectCssTokens
});
