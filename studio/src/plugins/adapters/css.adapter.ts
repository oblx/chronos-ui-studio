import {
	buildCursorPackCssSheet, buildMotionCssVars, clampControlConfig, clampCornerRadiusRem, clampStudioDefaults,
	CSS_CURSOR_STATES, DEFAULT_CONTROL_CONFIG, DEFAULT_MOTION_SENSORY, DEFAULT_STUDIO_DEFAULTS,
	findBuiltinCursorPack, type UiProjectDefinition
} from '@chronos-ui/svelte';
import { generateCssTokenSheet } from '@studio/core';
import { registerOutputAdapter } from '../registry';
import type { ProjectTextArtifact } from './svelte.adapter';

export function emitProjectCssTokens(project: UiProjectDefinition): ProjectTextArtifact {
	const pack = project.activeCursorPackId ? findBuiltinCursorPack(project.activeCursorPackId) : undefined;
	const cornerCutRem = clampCornerRadiusRem(project.cornerRadiusRem);
	const defs = clampStudioDefaults(project.studioDefaults, { ...DEFAULT_STUDIO_DEFAULTS, baseCornerCutRem: cornerCutRem });
	const ctrl = clampControlConfig(defs.controlConfig, DEFAULT_CONTROL_CONFIG);
	const motionVars = buildMotionCssVars({ ...DEFAULT_MOTION_SENSORY, hudZoneStaggerMs: defs.hudZoneStaggerMs });
	const motionLines = Object.entries(motionVars).map(([k, v]) => `\t${k}: ${v};`);
	const rootCss = [
		'\n:root {',
		`\t--ui-corner-cut: ${defs.baseCornerCutRem}rem;`,
		`\t--ui-station-cut: ${defs.stationCornerCutRem}rem;`,
		`\t--ui-control-cut: ${defs.controlCornerCutRem}rem;`,
		`\t--ui-stroke-w: ${defs.borderStrokePx}px;`,
		`\t--ui-orn-offset: ${defs.ornamentOffsetRem}rem;`,
		`\t--ui-orn-amp: ${defs.ornamentDriftAmpRem}rem;`,
		`\t--ui-orn-period: ${defs.ornamentPeriodMs}ms;`,
		`\t--ui-perimeter-gutter: ${defs.perimeterGutterRem}rem;`,
		'\t--ui-scroll-size: 0.375rem;',
		'\t--ui-scroll-track: color-mix(in srgb, var(--ui-base-100) 76%, transparent);',
		'\t--ui-scroll-thumb: var(--ui-border-subtle);',
		'\t--ui-scroll-thumb-hover: var(--ui-accent-vivid, var(--ui-accent));',
		'\t--ui-state-idle-bg: var(--ui-base-300);',
		'\t--ui-state-hover-bg: color-mix(in srgb, var(--ui-primary) 14%, var(--ui-base-300));',
		'\t--ui-state-active-bg: color-mix(in srgb, var(--ui-accent-vivid, var(--ui-primary)) 24%, var(--ui-base-300));',
		`\t/* Control Config: btn=${ctrl.buttonConfig.variant}/${ctrl.buttonConfig.density}/${ctrl.buttonConfig.hoverEffect} form=${ctrl.formConfig.surfaceStyle}/${ctrl.formConfig.density}/${ctrl.formConfig.sliderTrackStyle} */`,
		...motionLines,
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
