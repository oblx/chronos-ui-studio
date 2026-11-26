import {
	buildCursorPackCssSheet, buildDerivedThemeVars, buildMotionCssVars, buildStudioDefaultCssVars,
	clampControlConfig, clampCornerRadiusRem, clampStudioDefaults, CSS_CURSOR_STATES,
	DEFAULT_CONTROL_CONFIG, DEFAULT_MOTION_SENSORY, DEFAULT_STUDIO_DEFAULTS, findBuiltinCursorPack,
	type UiProjectDefinition
} from '@chronos-ui/svelte';
import { generateCssTokenSheet } from '@studio/core';
import { registerOutputAdapter } from '../registry';
import type { ProjectTextArtifact } from './svelte.adapter';

export function emitProjectCssTokens(project: UiProjectDefinition): ProjectTextArtifact {
	const pack = project.activeCursorPackId ? findBuiltinCursorPack(project.activeCursorPackId) : undefined;
	const cornerCutRem = clampCornerRadiusRem(project.cornerRadiusRem);
	const defs = clampStudioDefaults(project.studioDefaults, { ...DEFAULT_STUDIO_DEFAULTS, baseCornerCutRem: cornerCutRem });
	const ctrl = clampControlConfig(defs.controlConfig, DEFAULT_CONTROL_CONFIG);
	const mergedVars = {
		...buildStudioDefaultCssVars(defs),
		...buildDerivedThemeVars(),
		...buildMotionCssVars({ ...DEFAULT_MOTION_SENSORY, hudZoneStaggerMs: defs.hudZoneStaggerMs })
	};
	const rootCss = [
		'\n:root {',
		...Object.entries(mergedVars).map(([k, v]) => `\t${k}: ${v};`),
		`\t/* Control Config: btn=${ctrl.buttonConfig.variant}/${ctrl.buttonConfig.density}/${ctrl.buttonConfig.hoverEffect} form=${ctrl.formConfig.surfaceStyle}/${ctrl.formConfig.density}/${ctrl.formConfig.sliderTrackStyle} */`,
		'}'
	].join('\n');
	const cursorCss = pack ? `\n\n/* Active ${CSS_CURSOR_STATES.length}-State Cursor Pack: ${pack.name} */\n${buildCursorPackCssSheet(pack)}` : '';
	return {
		adapterId: 'css-tokens',
		filename: `${project.slug}.tokens.css`,
		mimeType: 'text/css; charset=utf-8',
		content: `${generateCssTokenSheet(project.themeId)}${rootCss}${cursorCss}`
	};
}

registerOutputAdapter<UiProjectDefinition, ProjectTextArtifact>({
	id: 'css-tokens',
	label: 'WCAG-Verified Semantic CSS Token Sheet',
	mimeType: 'text/css; charset=utf-8',
	emit: emitProjectCssTokens
});
