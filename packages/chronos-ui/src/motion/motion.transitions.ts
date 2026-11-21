import { backOut, cubicOut, expoOut, quintOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';
import type { CornerTuple, UiFrameShape } from '../tokens';
import { getActiveMotionConfig, resolveDurationMs } from './motion.machine.svelte';
import { MOTION_SPEED_MS, type MotionConfig, type MotionPreset } from './motion.types';

export interface UiTransitionParams {
	readonly preset?: MotionPreset;
	readonly config?: MotionConfig;
	readonly axis?: 'x' | 'y';
	readonly offsetPx?: number;
	readonly prefersReducedMotion?: boolean;
	readonly shape?: UiFrameShape;
	readonly corners?: CornerTuple;
	readonly cutPx?: number;
}

export function detectPrefersReducedMotion(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function resolveEffectiveDuration(
	config: MotionConfig,
	prefersReducedMotion = detectPrefersReducedMotion()
): number {
	if (config.preset === 'NONE' || config.speed === 'INSTANT') return 0;
	if (config.reducedMotionOverride === 'FORCE_OFF') return 0;
	if (config.reducedMotionOverride === 'AUTO' && prefersReducedMotion) return 0;
	const profileBase = resolveDurationMs('base', prefersReducedMotion);
	if (profileBase === 0 && config.reducedMotionOverride === 'AUTO') return 0;
	return config.speed === 'DELIBERATE' ? Math.max(MOTION_SPEED_MS.DELIBERATE, profileBase) : MOTION_SPEED_MS[config.speed];
}

function buildShapeClip(preset: MotionPreset, t: number, u: number, shape: UiFrameShape): string {
	const op = t.toFixed(3);
	if (preset === 'IRIS_EXPAND') {
		const isCurved = shape === 'CAPSULE' || shape === 'UML_DATABASE';
		if (isCurved) {
			const rx = (22 + t * 56).toFixed(1);
			const ry = (18 + t * 62).toFixed(1);
			return `opacity: ${op}; clip-path: ellipse(${rx}% ${ry}% at 50% 50%);`;
		}
		const inset = Math.round(u * 38);
		return `opacity: ${op}; clip-path: inset(${inset}% ${inset}%);`;
	}
	const lead = Math.min(100, Math.round(t * 112));
	const trail = Math.min(100, Math.round(t * 100));
	return `opacity: ${op}; clip-path: polygon(0 0, ${lead}% 0, ${trail}% 100%, 0 100%);`;
}

function buildPresetCss(
	preset: MotionPreset,
	t: number,
	u: number,
	axis: 'x' | 'y',
	offsetPx: number,
	shape: UiFrameShape
): string {
	if (preset === 'FADE') return `opacity: ${t.toFixed(3)};`;
	if (preset === 'SLIDE') {
		const shift = axis === 'x' ? `translateX(${(u * offsetPx).toFixed(1)}px)` : `translateY(${(u * offsetPx).toFixed(1)}px)`;
		return `opacity: ${t.toFixed(3)}; transform: ${shift};`;
	}
	if (preset === 'SCALE_SPRING') return `opacity: ${t.toFixed(3)}; transform: scale(${(0.9 + 0.1 * t).toFixed(3)});`;
	if (preset === 'GLITCH_SNAP') {
		const jitter = u > 0.12 ? Math.sin(u * 28) * 3 * u : 0;
		return `opacity: ${Math.min(1, t * 1.4).toFixed(3)}; transform: translateX(${jitter.toFixed(1)}px); clip-path: inset(0 ${Math.round(u * 26)}% 0 0);`;
	}
	if (preset === 'IRIS_EXPAND' || preset === 'SCAN_WIPE') return buildShapeClip(preset, t, u, shape);
	return `opacity: ${t.toFixed(3)}; transform: translateY(${(u * 8).toFixed(1)}px); clip-path: inset(0 0 ${Math.round(u * 35)}% 0);`;
}

function resolveEasing(preset: MotionPreset): (t: number) => number {
	if (preset === 'SCALE_SPRING') return backOut;
	if (preset === 'CYBER_UNFOLD' || preset === 'IRIS_EXPAND') return expoOut;
	if (preset === 'GLITCH_SNAP' || preset === 'SCAN_WIPE') return quintOut;
	return cubicOut;
}

export function uiTransition(_node: Element, params: UiTransitionParams = {}): TransitionConfig {
	const baseConfig = params.config ?? getActiveMotionConfig();
	const activeConfig: MotionConfig = params.preset ? { ...baseConfig, preset: params.preset } : baseConfig;
	const duration = resolveEffectiveDuration(activeConfig, params.prefersReducedMotion);
	if (duration <= 0) return { duration: 0, css: () => '' };
	const axis = params.axis ?? 'y';
	const offsetPx = params.offsetPx ?? 12;
	const shape = params.shape ?? 'BOX';
	return {
		duration,
		easing: resolveEasing(activeConfig.preset),
		css: (t, u) => buildPresetCss(activeConfig.preset, t, u, axis, offsetPx, shape)
	};
}
