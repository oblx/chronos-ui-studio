import {
	applyAccessibilityPrefs, applySafeCorridorCssVars, computeSafeCorridorFromRects, DEFAULT_VIEWPORT,
	HUD_METRICS, measureActivePerimeterRects, setActiveMotionConfig, STAGE_LIMITS,
	type CornerKind, type LayoutDensity, type MotionConfig, type ToastItem, type UiWireBroker
} from '@chronos-ui/svelte';
import type { StudioState } from './studio.types';

function clamp(val: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, val));
}

function drawerKey(side: 'LEFT' | 'RIGHT'): 'leftDrawer' | 'rightDrawer' {
	return side === 'LEFT' ? 'leftDrawer' : 'rightDrawer';
}

function registerDrawerHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register<{ side: 'LEFT' | 'RIGHT'; open?: boolean }>('UI_SET_DRAWER_OPEN', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => {
			const k = drawerKey(env.payload.side);
			return { ...s, [k]: { ...s[k], open: env.payload.open ?? !s[k].open } };
		}
	});
	broker.register<{ side: 'LEFT' | 'RIGHT'; tabId: string }>('UI_SET_DRAWER_TAB', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => {
			const k = drawerKey(env.payload.side);
			return { ...s, [k]: { ...s[k], activeTab: env.payload.tabId } };
		}
	});
	broker.register<{ side: 'LEFT' | 'RIGHT' }>('UI_TOGGLE_DRAWER_FLOAT', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => {
			const k = drawerKey(env.payload.side);
			return { ...s, [k]: { ...s[k], floating: !s[k].floating, open: true } };
		}
	});
	broker.register<{ side: 'LEFT' | 'RIGHT'; dy: number }>('UI_MOVE_EDGE_RAIL', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => {
			const k = drawerKey(env.payload.side);
			const lim = STAGE_LIMITS.railOffsetPx;
			return { ...s, [k]: { ...s[k], railOffsetY: clamp(s[k].railOffsetY + env.payload.dy, -lim, lim) } };
		}
	});
}

function registerStageHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register<{ side: 'LEFT' | 'RIGHT'; dx: number; dy: number }>('UI_MOVE_FLOATING_DRAWER', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => {
			const k = drawerKey(env.payload.side);
			const maxW = typeof window !== 'undefined' ? window.innerWidth - STAGE_LIMITS.floatPadRightPx : STAGE_LIMITS.defaultMaxWidthPx;
			const maxH = typeof window !== 'undefined' ? window.innerHeight - STAGE_LIMITS.floatPadBottomPx : STAGE_LIMITS.defaultMaxHeightPx;
			return { ...s, [k]: { ...s[k], floatX: clamp(s[k].floatX + env.payload.dx, STAGE_LIMITS.floatMarginLeftPx, maxW), floatY: clamp(s[k].floatY + env.payload.dy, STAGE_LIMITS.floatMarginTopPx, maxH) } };
		}
	});
	broker.register<{ dx?: number; dy?: number; dz?: number; reset?: boolean }>('UI_STAGE_PAN_ZOOM', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => env.payload.reset
			? { ...s, panX: 0, panY: 0, zoom: 1 }
			: { ...s, panX: clamp(s.panX + (env.payload.dx ?? 0), -STAGE_LIMITS.panMaxX, STAGE_LIMITS.panMaxX), panY: clamp(s.panY + (env.payload.dy ?? 0), -STAGE_LIMITS.panMaxY, STAGE_LIMITS.panMaxY), zoom: Number(clamp(s.zoom + (env.payload.dz ?? 0), STAGE_LIMITS.zoomMin, STAGE_LIMITS.zoomMax).toFixed(2)) }
	});
}

function registerToastHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register<{ topic: string }>('HELP_CONTEXT_SHIFTED', { tier: 'TIER_0_LOCAL_UI', reduce: (s, env) => ({ ...s, helpTopic: env.payload.topic, helpGlitterCount: s.helpGlitterCount + 1 }) });
	broker.register<Omit<ToastItem, 'id'>>('UI_PUSH_TOAST', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => ({ ...s, toasts: [...s.toasts.slice(-(HUD_METRICS.maxToasts - 1)), { id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, ...env.payload }] }),
		effect: (s) => {
			const latest = s.toasts[s.toasts.length - 1];
			if (!latest || typeof setTimeout === 'undefined') return;
			setTimeout(() => { broker.dispatch('UI_DISMISS_TOAST', { id: latest.id }); }, HUD_METRICS.toastAutoDismissMs);
		}
	});
	broker.register<{ id: string }>('UI_DISMISS_TOAST', { tier: 'TIER_0_LOCAL_UI', reduce: (s, env) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== env.payload.id) }) });
}

function applyDensityState(s: StudioState, density: LayoutDensity): StudioState {
	if (density === 'CALM') return { ...s, layoutDensity: 'CALM', studioChromeVisible: false, toolPaletteOpen: false, selectedNodeId: null, leftDrawer: { ...s.leftDrawer, open: false }, rightDrawer: { ...s.rightDrawer, open: false }, assistantDock: { ...s.assistantDock, mode: 'DOCKED', expanded: false } };
	if (density === 'BALANCED') return { ...s, layoutDensity: 'BALANCED', studioChromeVisible: true, toolPaletteOpen: true, leftDrawer: { ...s.leftDrawer, open: false }, rightDrawer: { ...s.rightDrawer, open: false } };
	return { ...s, layoutDensity: 'TACTICAL', studioChromeVisible: true, toolPaletteOpen: false, leftDrawer: { ...s.leftDrawer, open: true }, rightDrawer: { ...s.rightDrawer, open: true } };
}

function registerV004VisualAndDensityHandlers(broker: UiWireBroker<StudioState>): void {
	broker.register<{ density: LayoutDensity }>('UI_SET_LAYOUT_DENSITY', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => applyDensityState(s, env.payload.density),
		effect: (s) => {
			const w = typeof window !== 'undefined' ? window.innerWidth : DEFAULT_VIEWPORT.width;
			const h = typeof window !== 'undefined' ? window.innerHeight : DEFAULT_VIEWPORT.height;
			applySafeCorridorCssVars(computeSafeCorridorFromRects(w, h, s.studioChromeVisible, measureActivePerimeterRects()));
		},
		summarize: (env) => `Density -> ${env.payload.density}`
	});
	broker.register<Partial<MotionConfig>>('UI_SET_MOTION_CONFIG', { tier: 'TIER_0_LOCAL_UI', reduce: (s, env) => ({ ...s, motionConfig: setActiveMotionConfig(env.payload) }), summarize: (env) => `Motion -> ${env.payload.preset ?? env.payload.speed ?? 'updated'}` });
	broker.register<{ cornerMode: CornerKind }>('UI_SET_CORNER_STYLE', {
		tier: 'TIER_0_LOCAL_UI',
		reduce: (s, env) => ({ ...s, accessibility: { ...s.accessibility, cornerMode: env.payload.cornerMode }, projects: s.projects.map((p) => (p.id === s.activeProjectId ? { ...p, cornerMode: env.payload.cornerMode } : p)) }),
		effect: (s) => applyAccessibilityPrefs(s.accessibility),
		summarize: (env) => `Corners -> ${env.payload.cornerMode}`
	});
}

export function registerDrawerAndStageHandlers(broker: UiWireBroker<StudioState>): void {
	registerDrawerHandlers(broker);
	registerStageHandlers(broker);
	registerToastHandlers(broker);
	registerV004VisualAndDensityHandlers(broker);
}
