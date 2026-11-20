import { buildCursorPackCssSheet, clampCornerRadiusRem, CSS_CURSOR_STATES, findBuiltinCursorPack, type UiProjectDefinition } from '@chronos-ui/svelte';
import { generateCssTokenSheet } from '../../core';
import { registerOutputAdapter } from '../registry';
import type { ProjectTextArtifact } from './svelte.adapter';

export function emitProjectCssTokens(project: UiProjectDefinition): ProjectTextArtifact {
	const pack = project.activeCursorPackId ? findBuiltinCursorPack(project.activeCursorPackId) : undefined;
	const cornerCutRem = clampCornerRadiusRem(project.cornerRadiusRem);
	const cornerCss = `\n:root {\n\t--ui-corner-cut: ${cornerCutRem}rem;\n}`;
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
