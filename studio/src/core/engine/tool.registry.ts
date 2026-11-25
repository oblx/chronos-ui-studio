import type { IntentKind, UiIconName } from '@chronos-ui/svelte';
import { CAPABILITY_BITS } from '@studio/config';
import { WORKSPACE_CURSOR_TOOL_DESCRIPTORS } from './cursor.synthesizer';
import { ENTITY_TOOL_DESCRIPTORS, STATION_TOOL_DESCRIPTORS, V011_TOOL_DESCRIPTORS } from './tools';

export type StudioToolCategory = 'BUILD' | 'CUSTOMIZE' | 'BLUEPRINTS' | 'EXPORT';

export interface StudioToolDescriptor {
	readonly name: string;
	readonly description: string;
	readonly humanTitle: string;
	readonly plainDescription: string;
	readonly category: StudioToolCategory;
	readonly icon: UiIconName;
	readonly intentKind: IntentKind;
	readonly requiredCapabilityBit: number;
	readonly inputSchema: Readonly<Record<string, unknown>>;
	readonly outputSchema: Readonly<Record<string, unknown>>;
	readonly annotations: { readonly readOnlyHint: boolean; readonly idempotentHint: boolean; readonly destructiveHint: boolean };
}

const RO = { readOnlyHint: true, idempotentHint: true, destructiveHint: false } as const;
const IDEM = { readOnlyHint: false, idempotentHint: true, destructiveHint: false } as const;
const MUT = { readOnlyHint: false, idempotentHint: false, destructiveHint: false } as const;
const DEL = { readOnlyHint: false, idempotentHint: true, destructiveHint: true } as const;

export const STUDIO_TOOL_REGISTRY: readonly StudioToolDescriptor[] = [
	{
		name: 'ui_list_primitives', description: 'List @chronos-ui/svelte primitives, shapes, motion presets, connectors, and adapters.',
		humanTitle: 'Inspect Components', plainDescription: 'View every ready-made visual block available in this workspace.',
		category: 'BUILD', icon: 'layers', intentKind: 'UI_TOGGLE_STUDIO_CHROME', requiredCapabilityBit: CAPABILITY_BITS.READ_BLUEPRINTS,
		inputSchema: { type: 'object', properties: {} }, outputSchema: { type: 'object', properties: { componentCatalog: { type: 'array' } } }, annotations: RO
	},
	{
		name: 'ui_probe_environment', description: 'Probe Google AI Studio, Harbor window.ai, and runtime capabilities without exposing secrets.',
		humanTitle: 'Probe AI Environment', plainDescription: 'Inspect auto-detected AI Studio, Harbor, and hardware capabilities.',
		category: 'CUSTOMIZE', icon: 'wire', intentKind: 'UI_TOGGLE_STUDIO_CHROME', requiredCapabilityBit: CAPABILITY_BITS.READ_BLUEPRINTS,
		inputSchema: { type: 'object', properties: {} }, outputSchema: { type: 'object', properties: { aiStudioGeminiAvailable: { type: 'boolean' } } }, annotations: RO
	},
	{
		name: 'ui_get_viewport_occupancy', description: 'Return safe-corridor bounds and slot collision diagnostics for a viewport.',
		humanTitle: 'Audit Layout Corridors', plainDescription: 'Verify zero panel collisions across active viewport slots.',
		category: 'CUSTOMIZE', icon: 'layers', intentKind: 'UI_SET_LAYOUT_DENSITY', requiredCapabilityBit: CAPABILITY_BITS.READ_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { viewportW: { type: 'number' }, viewportH: { type: 'number' }, chromeVisible: { type: 'boolean' }, density: { type: 'string' } } },
		outputSchema: { type: 'object', properties: { collisionCount: { type: 'number' } } }, annotations: RO
	},
	{
		name: 'ui_load_sample', description: 'Load a choreographed starter sample UI workspace.',
		humanTitle: 'Load Starter Sample', plainDescription: 'Populate your canvas with an animated, ready-to-edit interface.',
		category: 'BUILD', icon: 'star', intentKind: 'UI_LOAD_SAMPLE', requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { sampleId: { type: 'string' }, projectId: { type: 'string' } }, required: ['sampleId'] },
		outputSchema: { type: 'object', properties: { project: { type: 'object' } } }, annotations: IDEM
	},
	{
		name: 'ui_spawn_node', description: 'Stage a dynamic Svelte 5 component node with optional UML shape and corner style.',
		humanTitle: 'Add Component', plainDescription: 'Place a live card, UML frame, navbar, or widget directly on stage.',
		category: 'BUILD', icon: 'plus', intentKind: 'UI_SPAWN_NODE', requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, type: { type: 'string' }, zone: { type: 'string' }, label: { type: 'string' }, shape: { type: 'string' }, corners: { type: 'array' }, cornerEmbellishment: { type: 'string' }, cornerAnimation: { type: 'string' }, props: { type: 'object' } }, required: ['type', 'zone'] },
		outputSchema: { type: 'object', properties: { node: { type: 'object' } } }, annotations: MUT
	},
	{
		name: 'ui_configure_node', description: 'Patch runtime props, UML shape, corners, zone, label, or intent binding on a node.',
		humanTitle: 'Edit Selected Block', plainDescription: 'Change shape, corners, text, zone position, or click behavior on a block.',
		category: 'CUSTOMIZE', icon: 'settings', intentKind: 'UI_PATCH_NODE', requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, nodeId: { type: 'string' }, label: { type: 'string' }, zone: { type: 'string' }, shape: { type: 'string' }, corners: { type: 'array' }, cornerEmbellishment: { type: 'string' }, cornerAnimation: { type: 'string' }, props: { type: 'object' } }, required: ['nodeId'] },
		outputSchema: { type: 'object', properties: { project: { type: 'object' } } }, annotations: IDEM
	},
	{
		name: 'ui_commit_node', description: 'Validate and commit STAGING node(s) into live painted Svelte 5 components.',
		humanTitle: 'Confirm Drafts', plainDescription: 'Lock all previewed draft components into your live canvas.',
		category: 'BUILD', icon: 'check', intentKind: 'UI_COMMIT_NODE', requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, nodeId: { type: 'string' } } },
		outputSchema: { type: 'object', properties: { project: { type: 'object' } } }, annotations: IDEM
	},
	{
		name: 'ui_remove_node', description: 'Remove a node from the active project node tree.',
		humanTitle: 'Remove Block', plainDescription: 'Delete a component from your canvas (undoable at any time).',
		category: 'CUSTOMIZE', icon: 'trash', intentKind: 'UI_REMOVE_NODE', requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, nodeId: { type: 'string' } }, required: ['nodeId'] },
		outputSchema: { type: 'object', properties: { project: { type: 'object' } } }, annotations: DEL
	},
	{
		name: 'ui_derive_blueprint', description: 'Promote any live node into a reusable inherited UiComponentPrototype.',
		humanTitle: 'Promote to Blueprint', plainDescription: 'Save a customized block as a reusable template you can spawn anywhere.',
		category: 'BLUEPRINTS', icon: 'copy', intentKind: 'UI_DERIVE_BLUEPRINT', requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, nodeId: { type: 'string' }, name: { type: 'string' } }, required: ['nodeId', 'name'] },
		outputSchema: { type: 'object', properties: { prototype: { type: 'object' } } }, annotations: MUT
	},
	{
		name: 'ui_patch_document', description: 'Apply an RFC 6902 JSON Patch sequence to the normalized project graph.',
		humanTitle: 'Apply Precision Patch', plainDescription: 'Run an atomic undoable multi-step edit across your project layout.',
		category: 'CUSTOMIZE', icon: 'code', intentKind: 'UI_PATCH_DOCUMENT', requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, patches: { type: 'array' } }, required: ['patches'] },
		outputSchema: { type: 'object', properties: { inverseCount: { type: 'number' } } }, annotations: MUT
	},
	{
		name: 'ui_apply_theme', description: 'Apply a WCAG AA+ semantic theme pack to a project.',
		humanTitle: 'Switch Color Theme', plainDescription: 'Change the entire color palette with verified accessible contrast.',
		category: 'CUSTOMIZE', icon: 'palette', intentKind: 'UI_SET_THEME', requiredCapabilityBit: CAPABILITY_BITS.WRITE_THEMES,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, themeId: { type: 'string' } }, required: ['themeId'] },
		outputSchema: { type: 'object', properties: { project: { type: 'object' } } }, annotations: IDEM
	},
	{
		name: 'ui_create_project', description: 'Create a calm empty-stage multi-project UI workspace.',
		humanTitle: 'New Empty Canvas', plainDescription: 'Start a fresh workspace without losing your current project.',
		category: 'BLUEPRINTS', icon: 'plus', intentKind: 'UI_SWITCH_PROJECT', requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { name: { type: 'string' }, themeId: { type: 'string' } }, required: ['name'] },
		outputSchema: { type: 'object', properties: { project: { type: 'object' } } }, annotations: MUT
	},
	{
		name: 'ui_switch_project', description: 'Switch active Studio project by ID or slug.',
		humanTitle: 'Switch Workspace', plainDescription: 'Jump between any of your saved Studio projects.',
		category: 'BLUEPRINTS', icon: 'layers', intentKind: 'UI_SWITCH_PROJECT', requiredCapabilityBit: CAPABILITY_BITS.READ_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] },
		outputSchema: { type: 'object', properties: { project: { type: 'object' } } }, annotations: RO
	},
	{
		name: 'ui_export_static', description: 'Compile a production-optimized Vite static client bundle with runtime schema.',
		humanTitle: 'Export Standalone App', plainDescription: 'Download a ready-to-host HTML/JS/CSS build of your canvas.',
		category: 'EXPORT', icon: 'export', intentKind: 'UI_TOGGLE_STUDIO_CHROME', requiredCapabilityBit: CAPABILITY_BITS.READ_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, outDir: { type: 'string' } } },
		outputSchema: { type: 'object', properties: { build: { type: 'object' } } }, annotations: RO
	},
	{
		name: 'ui_compose_blueprint', description: 'Validate and persist an 11-zone perimeter UI blueprint.',
		humanTitle: 'Save HUD Blueprint', plainDescription: 'Archive your current perimeter zone layout as a shareable preset.',
		category: 'BLUEPRINTS', icon: 'check', intentKind: 'UI_SET_ACTIVE_TAB', requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
		outputSchema: { type: 'object', properties: { blueprint: { type: 'object' } } }, annotations: IDEM
	},
	{
		name: 'ui_validate_theme_wcag', description: 'Evaluate WCAG AA/AAA relative luminance contrast for semantic tokens.',
		humanTitle: 'Check Color Contrast', plainDescription: 'Verify text readability against WCAG AA and AAA contrast ratios.',
		category: 'CUSTOMIZE', icon: 'lock', intentKind: 'UI_SET_THEME', requiredCapabilityBit: CAPABILITY_BITS.READ_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { theme: { type: 'object' } } },
		outputSchema: { type: 'object', properties: { checks: { type: 'array' } } }, annotations: RO },
	{
		name: 'ui_export_package_scaffold', description: 'Generate standalone Svelte 5 or CSS token scaffold from a blueprint.',
		humanTitle: 'Export Code Scaffold', plainDescription: 'Generate clean Svelte 5 or semantic CSS source files.',
		category: 'EXPORT', icon: 'export', intentKind: 'UI_TOGGLE_STUDIO_CHROME', requiredCapabilityBit: CAPABILITY_BITS.READ_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { blueprintId: { type: 'string' }, format: { type: 'string' } } },
		outputSchema: { type: 'object', properties: { filename: { type: 'string' }, content: { type: 'string' } } }, annotations: RO },
	...ENTITY_TOOL_DESCRIPTORS, ...WORKSPACE_CURSOR_TOOL_DESCRIPTORS, ...STATION_TOOL_DESCRIPTORS, ...V011_TOOL_DESCRIPTORS
];

export const listMcpToolDescriptors = () => STUDIO_TOOL_REGISTRY.map(({ name, description, inputSchema, outputSchema, annotations }) => ({ name, description, inputSchema, outputSchema, annotations }));
