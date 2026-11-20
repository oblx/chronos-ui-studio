import { CAPABILITY_BITS } from '../../config';

const IDEM = { readOnlyHint: false, idempotentHint: true, destructiveHint: false } as const;
const RO = { readOnlyHint: true, idempotentHint: true, destructiveHint: false } as const;

export const STATION_TOOL_DESCRIPTORS = [
	{
		name: 'ui_set_corner_radius',
		description: 'Set global or per-node/per-zone chamfer cut or circular corner radius in rem (0.25..1.5).',
		humanTitle: 'Set Corner Radius',
		plainDescription: 'Tune global chamfer depth or circular border radius smoothly.',
		category: 'CUSTOMIZE',
		icon: 'sliders',
		intentKind: 'UI_SET_CORNER_RADIUS',
		requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, cornerRadiusRem: { type: 'number' }, cornerMode: { type: 'string' }, cornerAnimation: { type: 'string' } }, required: ['cornerRadiusRem'] },
		outputSchema: { type: 'object', properties: { cornerRadiusRem: { type: 'number' }, project: { type: 'object' } } },
		annotations: IDEM
	},
	{
		name: 'ui_configure_station_layer',
		description: 'Configure Station Builder architectural layers (substrate grid, reticle, perimeter band sizing, bilateral mirror).',
		humanTitle: 'Configure Station Layer',
		plainDescription: 'Tune canvas substrate, perimeter proportions, and bilateral symmetry.',
		category: 'CUSTOMIZE',
		icon: 'layers',
		intentKind: 'UI_CONFIGURE_STATION_LAYER',
		requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { showGrid: { type: 'boolean' }, showReticle: { type: 'boolean' }, topBandRem: { type: 'number' }, bottomDockRem: { type: 'number' }, edgeRailRem: { type: 'number' }, bilateralMirror: { type: 'boolean' }, cornerMorphEnabled: { type: 'boolean' } } },
		outputSchema: { type: 'object', properties: { stationLayer: { type: 'object' } } },
		annotations: IDEM
	},
	{
		name: 'ui_edit_zone_disposition',
		description: 'Edit an 11-zone perimeter disposition, visibility, density, 4-corner tuple, radius, shape, or embellishment with optional bilateral X=50vw mirroring.',
		humanTitle: 'Edit Zone Disposition',
		plainDescription: 'Customize any perimeter HUD zone corners, shape, density, and bilateral symmetry.',
		category: 'BLUEPRINTS',
		icon: 'grid',
		intentKind: 'UI_EDIT_ZONE_DISPOSITION',
		requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { blueprintId: { type: 'string' }, zoneId: { type: 'string' }, visible: { type: 'boolean' }, disposition: { type: 'string' }, density: { type: 'string' }, corners: { type: 'array' }, cornerRadiusRem: { type: 'number' }, shape: { type: 'string' }, cornerEmbellishment: { type: 'string' }, cornerAnimation: { type: 'string' }, mirrorOpposite: { type: 'boolean' } }, required: ['zoneId'] },
		outputSchema: { type: 'object', properties: { blueprint: { type: 'object' }, mirroredZoneId: { type: 'string' } } },
		annotations: IDEM
	},
	{
		name: 'ui_move_entity_to_zone',
		description: 'Relocate a live mounted entity to a target HUD zone or reorder it within the canvas tree.',
		humanTitle: 'Move Entity to Zone',
		plainDescription: 'Re-parent any mounted component to another perimeter or stage zone.',
		category: 'BUILD',
		icon: 'dock',
		intentKind: 'UI_MOVE_ENTITY_TO_ZONE',
		requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, nodeId: { type: 'string' }, targetZone: { type: 'string' } }, required: ['nodeId', 'targetZone'] },
		outputSchema: { type: 'object', properties: { project: { type: 'object' } } },
		annotations: IDEM
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
	}
] as const;
