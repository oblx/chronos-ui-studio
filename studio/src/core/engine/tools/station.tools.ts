import { CAPABILITY_BITS } from '@studio/config';

const IDEM = { readOnlyHint: false, idempotentHint: true, destructiveHint: false } as const;
const RO = { readOnlyHint: true, idempotentHint: true, destructiveHint: false } as const;

export const STATION_TOOL_DESCRIPTORS = [
	{
		name: 'ui_set_corner_radius', description: 'Set global or per-node/per-zone chamfer cut or circular corner radius in rem (0.25..1.5).',
		humanTitle: 'Set Corner Radius', plainDescription: 'Tune global chamfer depth or circular border radius smoothly.',
		category: 'CUSTOMIZE', icon: 'sliders', intentKind: 'UI_SET_CORNER_RADIUS', requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, cornerRadiusRem: { type: 'number' }, cornerMode: { type: 'string' }, cornerAnimation: { type: 'string' } }, required: ['cornerRadiusRem'] },
		outputSchema: { type: 'object', properties: { cornerRadiusRem: { type: 'number' }, project: { type: 'object' } } }, annotations: IDEM
	},
	{
		name: 'ui_configure_station_layer', description: 'Configure Station Builder architectural layers (substrate grid, reticle, perimeter band sizing, bilateral mirror).',
		humanTitle: 'Configure Station Layer', plainDescription: 'Tune canvas substrate, perimeter proportions, and bilateral symmetry.',
		category: 'CUSTOMIZE', icon: 'layers', intentKind: 'UI_CONFIGURE_STATION_LAYER', requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { showGrid: { type: 'boolean' }, showReticle: { type: 'boolean' }, topBandRem: { type: 'number' }, bottomDockRem: { type: 'number' }, edgeRailRem: { type: 'number' }, bilateralMirror: { type: 'boolean' }, cornerMorphEnabled: { type: 'boolean' } } },
		outputSchema: { type: 'object', properties: { stationLayer: { type: 'object' } } }, annotations: IDEM
	},
	{
		name: 'ui_edit_zone_disposition', description: 'Edit an 11-zone perimeter disposition, visibility, density, 4-corner tuple, radius, shape, or embellishment with optional bilateral X=50vw mirroring.',
		humanTitle: 'Edit Zone Disposition', plainDescription: 'Customize any perimeter HUD zone corners, shape, density, and bilateral symmetry.',
		category: 'BLUEPRINTS', icon: 'grid', intentKind: 'UI_EDIT_ZONE_DISPOSITION', requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { blueprintId: { type: 'string' }, zoneId: { type: 'string' }, visible: { type: 'boolean' }, disposition: { type: 'string' }, density: { type: 'string' }, corners: { type: 'array' }, cornerRadiusRem: { type: 'number' }, shape: { type: 'string' }, cornerEmbellishment: { type: 'string' }, cornerAnimation: { type: 'string' }, mirrorOpposite: { type: 'boolean' } }, required: ['zoneId'] },
		outputSchema: { type: 'object', properties: { blueprint: { type: 'object' }, mirroredZoneId: { type: 'string' } } }, annotations: IDEM
	},
	{
		name: 'ui_move_entity_to_zone', description: 'Relocate a live mounted entity to a target HUD zone or reorder it within the canvas tree.',
		humanTitle: 'Move Entity to Zone', plainDescription: 'Re-parent any mounted component to another perimeter or stage zone.',
		category: 'BUILD', icon: 'dock', intentKind: 'UI_MOVE_ENTITY_TO_ZONE', requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, nodeId: { type: 'string' }, targetZone: { type: 'string' } }, required: ['nodeId', 'targetZone'] },
		outputSchema: { type: 'object', properties: { project: { type: 'object' } } }, annotations: IDEM
	},
	{
		name: 'ui_open_station_builder',
		description: 'Open the swipe-ready Station Builder architectural workbench modal.',
		humanTitle: 'Open Station Builder',
		plainDescription: 'Launch the 4-layer Station Builder modal.',
		category: 'BLUEPRINTS',
		icon: 'layers',
		intentKind: 'UI_OPEN_MODAL',
		requiredCapabilityBit: CAPABILITY_BITS.READ_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { layer: { type: 'string' } } },
		outputSchema: { type: 'object', properties: { modal: { type: 'string' } } },
		annotations: RO
	},
	{
		name: 'ui_open_zone_edition',
		description: 'Open the interactive 11-zone Perimeter Zone Edition workbench modal.',
		humanTitle: 'Open Zone Edition',
		plainDescription: 'Launch the Zone Edition workbench to inspect and tune HUD zones.',
		category: 'BLUEPRINTS',
		icon: 'grid',
		intentKind: 'UI_OPEN_MODAL',
		requiredCapabilityBit: CAPABILITY_BITS.READ_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { zoneId: { type: 'string' } } },
		outputSchema: { type: 'object', properties: { modal: { type: 'string' }, zoneId: { type: 'string' } } },
		annotations: RO
	},
	{
		name: 'ui_configure_studio_defaults',
		description: 'Configure persistent Studio geometry, 3-tier corner cuts, stroke weight, ornament offset/drift/period, perimeter gutter, and auto-save defaults.',
		humanTitle: 'Configure Studio Defaults',
		plainDescription: 'Tune base, station, and control corner cuts plus ornament timing and stroke weight.',
		category: 'CUSTOMIZE',
		icon: 'sliders',
		intentKind: 'UI_SET_STUDIO_DEFAULT',
		requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, baseCornerCutRem: { type: 'number' }, stationCornerCutRem: { type: 'number' }, controlCornerCutRem: { type: 'number' }, borderStrokePx: { type: 'number' }, ornamentOffsetRem: { type: 'number' }, ornamentDriftAmpRem: { type: 'number' }, ornamentPeriodMs: { type: 'number' }, perimeterGutterRem: { type: 'number' }, autoSaveMode: { type: 'string' }, cornerMode: { type: 'string' }, cornerEmbellishment: { type: 'string' }, cornerAnimation: { type: 'string' } } },
		outputSchema: { type: 'object', properties: { studioDefaults: { type: 'object' }, project: { type: 'object' } } },
		annotations: IDEM
	},
	{
		name: 'ui_reset_studio_defaults',
		description: 'Reset all Studio geometry, ornament, gutter, and auto-save defaults back to canonical v0.0.10 baseline.',
		humanTitle: 'Reset Studio Defaults',
		plainDescription: 'Restore default 0.5rem base, 0.75rem station, and 0.3125rem control corner cuts.',
		category: 'CUSTOMIZE', icon: 'reset', intentKind: 'UI_RESET_STUDIO_DEFAULTS',
		requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' } } },
		outputSchema: { type: 'object', properties: { studioDefaults: { type: 'object' }, project: { type: 'object' } } },
		annotations: IDEM
	},
	{
		name: 'ui_open_wireframe_skeleton',
		description: 'Open the Photoshop CS6-inspired interactive Wireframe Skeleton Workbench modal.',
		humanTitle: 'Open Wireframe Skeleton',
		plainDescription: 'Inspect all 11 zones, entity contours, DAG arcs, layers, properties, and history.',
		category: 'BLUEPRINTS', icon: 'layers', intentKind: 'UI_OPEN_MODAL',
		requiredCapabilityBit: CAPABILITY_BITS.READ_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { tool: { type: 'string' } } },
		outputSchema: { type: 'object', properties: { modal: { type: 'string' } } }, annotations: RO
	},
	{
		name: 'ui_toggle_entity_lock',
		description: 'Toggle or set the Governance Gate lock state on a mounted entity to prevent edits or deletion.',
		humanTitle: 'Toggle Entity Lock',
		plainDescription: 'Lock or unlock a layer to prevent accidental modifications.',
		category: 'CUSTOMIZE', icon: 'lock', intentKind: 'UI_TOGGLE_ENTITY_LOCK',
		requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, nodeId: { type: 'string' }, locked: { type: 'boolean' } }, required: ['nodeId'] },
		outputSchema: { type: 'object', properties: { nodeId: { type: 'string' }, locked: { type: 'boolean' }, project: { type: 'object' } } }, annotations: IDEM
	},
	{
		name: 'ui_toggle_entity_visibility',
		description: 'Toggle or set visibility (Eye state) on a mounted entity in the Layers tree and canvas.',
		humanTitle: 'Toggle Entity Visibility',
		plainDescription: 'Show or hide a component layer without deleting it.',
		category: 'CUSTOMIZE', icon: 'radar', intentKind: 'UI_TOGGLE_ENTITY_VISIBILITY',
		requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, nodeId: { type: 'string' }, visible: { type: 'boolean' } }, required: ['nodeId'] },
		outputSchema: { type: 'object', properties: { nodeId: { type: 'string' }, visible: { type: 'boolean' }, project: { type: 'object' } } }, annotations: IDEM
	},
	{
		name: 'ui_export_fullstack_bundle',
		description: 'Compile a standalone static client paired with a minimal vendored Bun + Drizzle SQLite backend.',
		humanTitle: 'Export Full-Stack Bundle',
		plainDescription: 'Generate a ready-to-serve full-stack app with migrations, API routes, and static client.',
		category: 'EXPORT', icon: 'export', intentKind: 'UI_OPEN_MODAL',
		requiredCapabilityBit: CAPABILITY_BITS.READ_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, outDir: { type: 'string' }, emitZip: { type: 'boolean' } } },
		outputSchema: { type: 'object', properties: { bundle: { type: 'object' } } }, annotations: RO
	},
	{
		name: 'ui_set_motion_profile', description: 'Set the global ADHD-friendly sensory motion profile (CALM_SLOW, BALANCED, SNAPPY, REDUCED_ZERO) and ambient/signal/morph toggles.',
		humanTitle: 'Set Motion Profile', plainDescription: 'Switch transition pacing and ambient signal cadence.',
		category: 'CUSTOMIZE', icon: 'sliders', intentKind: 'UI_SET_MOTION_PROFILE', requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { profile: { type: 'string' }, ambientPulsesEnabled: { type: 'boolean' }, signalFlowSpeed: { type: 'number' }, modalMorphEnabled: { type: 'boolean' }, microDetentsEnabled: { type: 'boolean' } } },
		outputSchema: { type: 'object', properties: { sensory: { type: 'object' } } }, annotations: IDEM
	},
	{
		name: 'ui_modal_toggle_expand', description: 'Grow or shrink the active modal dialog between its natural bounds and FULL_STAGE viewport mode while preserving pre-expand geometry.',
		humanTitle: 'Grow / Shrink Modal', plainDescription: 'Expand or restore the active dialog without losing internal state.',
		category: 'CUSTOMIZE', icon: 'expand', intentKind: 'UI_MODAL_TOGGLE_EXPAND', requiredCapabilityBit: CAPABILITY_BITS.READ_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { expanded: { type: 'boolean' } } },
		outputSchema: { type: 'object', properties: { expanded: { type: 'boolean' } } }, annotations: IDEM
	}
] as const;
