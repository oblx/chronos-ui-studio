import { COMPONENT_CATALOG } from './canvas';
import { BUILTIN_CURSOR_PACKS, CSS_CURSOR_STATES } from './cursor';
import { LAYOUT_DENSITIES } from './machines';
import { DEFAULT_MOTION_CONFIG, MOTION_PRESETS, MOTION_SPEEDS } from './motion';
import {
	CORNER_ANIMATIONS,
	CORNER_EMBELLISHMENTS,
	CORNER_MODES,
	HUD_ZONES,
	THEME_PACKS,
	UI_FRAME_SHAPES,
	VERSION
} from './tokens';

export const UI_FRAMEWORK_MANIFEST = {
	package: '@chronos-ui/svelte',
	version: VERSION,
	author: 'Oblx <code@oblx.dev>',
	zones: HUD_ZONES,
	themes: THEME_PACKS.map((t) => ({ id: t.id, name: t.name, polarity: t.polarity })),
	cornerModes: CORNER_MODES,
	frameShapes: UI_FRAME_SHAPES,
	cornerEmbellishments: CORNER_EMBELLISHMENTS,
	cornerAnimations: CORNER_ANIMATIONS,
	layoutDensities: LAYOUT_DENSITIES,
	motionConfig: DEFAULT_MOTION_CONFIG,
	motionPresets: MOTION_PRESETS,
	motionSpeeds: MOTION_SPEEDS,
	cursorStates: CSS_CURSOR_STATES,
	cursorPacks: BUILTIN_CURSOR_PACKS.map((p) => ({ uuid: p.uuid, slug: p.slug, name: p.name })),
	atoms: [
		'UiIcon', 'UiVectorBorder', 'UiChamferFrame', 'UiChamferButton', 'UiUtilityIconButton',
		'UiBadge', 'UiMathFormula', 'UiProgressGauge'
	],
	forms: ['UiInput', 'UiSelect', 'UiSlider', 'UiPopover'],
	molecules: [
		'UiAnimatedResizeBody', 'UiSubTabBar', 'UiHorizontalDeck', 'UiAccordionSection',
		'UiCyberTooltip', 'UiContextMenu', 'UiProjectionSubToolbar'
	],
	organisms: [
		'UiPerimeterHud', 'UiEdgeDrawer', 'UiSpotlightVeil', 'UiBentoRadar',
		'UiVirtualCursors', 'UiToastStack', 'UiWireInspector', 'UiInteractiveCanvasStage',
		'UiAssistantDock', 'UiRobotEmblem'
	],
	modals: ['UiModalShell', 'UiModalHeader', 'UiModalFooter'],
	componentCatalog: COMPONENT_CATALOG
} as const;
