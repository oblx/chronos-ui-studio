import { CAPABILITY_BITS } from '@studio/config';
import type { StudioToolDescriptor } from '../tool.registry';

const IDEM = { readOnlyHint: false, idempotentHint: true, destructiveHint: false } as const;
const MUT = { readOnlyHint: false, idempotentHint: false, destructiveHint: false } as const;

export const V011_TOOL_DESCRIPTORS: readonly StudioToolDescriptor[] = [
	{
		name: 'ui_configure_controls',
		description: 'Configure global or per-surface button and form control visual tokens.',
		humanTitle: 'Configure Controls',
		plainDescription: 'Customize button density, variant, hover feedback, and form styling.',
		category: 'CUSTOMIZE',
		icon: 'settings',
		intentKind: 'UI_SET_CONTROL_CONFIG',
		requiredCapabilityBit: CAPABILITY_BITS.WRITE_THEMES,
		inputSchema: {
			type: 'object',
			properties: {
				projectId: { type: 'string' },
				buttonConfig: { type: 'object' },
				formConfig: { type: 'object' }
			}
		},
		outputSchema: { type: 'object', properties: { controlConfig: { type: 'object' }, project: { type: 'object' } } },
		annotations: IDEM
	},
	{
		name: 'ui_set_history_limit',
		description: 'Configure IndexedDB-backed Undo/Redo ring depth (default 5, bounded 1..128).',
		humanTitle: 'Set History Limit',
		plainDescription: 'Set how many undoable workspace revisions remain in browser IndexedDB.',
		category: 'CUSTOMIZE',
		icon: 'reset',
		intentKind: 'UI_SET_HISTORY_LIMIT',
		requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: {
			type: 'object',
			properties: { projectId: { type: 'string' }, limit: { type: 'number', minimum: 1, maximum: 128 } },
			required: ['limit']
		},
		outputSchema: { type: 'object', properties: { historyLimit: { type: 'number' }, project: { type: 'object' } } },
		annotations: IDEM
	},
	{
		name: 'ui_undo',
		description: 'Step backward one revision in the workspace undo ring.',
		humanTitle: 'Undo Change',
		plainDescription: 'Revert the latest canvas edit cleanly without losing redo history.',
		category: 'BUILD',
		icon: 'reset',
		intentKind: 'UI_UNDO_REVISION',
		requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' } } },
		outputSchema: { type: 'object', properties: { dispatched: { type: 'boolean' } } },
		annotations: MUT
	},
	{
		name: 'ui_redo',
		description: 'Step forward one revision in the workspace redo ring.',
		humanTitle: 'Redo Change',
		plainDescription: 'Re-apply the most recently undone canvas edit.',
		category: 'BUILD',
		icon: 'reset',
		intentKind: 'UI_REDO_REVISION',
		requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { projectId: { type: 'string' } } },
		outputSchema: { type: 'object', properties: { dispatched: { type: 'boolean' } } },
		annotations: MUT
	},
	{
		name: 'ui_replay_hud_sequence',
		description: 'Replay the sequential 250ms ASC Studio HUD perimeter reveal choreography.',
		humanTitle: 'Replay HUD Sequence',
		plainDescription: 'Re-run the staged perimeter reveal sequence across all HUD zones.',
		category: 'CUSTOMIZE',
		icon: 'star',
		intentKind: 'UI_REPLAY_HUD_SEQUENCE',
		requiredCapabilityBit: CAPABILITY_BITS.READ_BLUEPRINTS,
		inputSchema: { type: 'object', properties: { intervalMs: { type: 'number', minimum: 0, maximum: 1000 } } },
		outputSchema: { type: 'object', properties: { replayed: { type: 'boolean' }, intervalMs: { type: 'number' } } },
		annotations: IDEM
	},
	{
		name: 'ui_set_tooltip_info_level',
		description: 'Set global tooltip detail priority filter threshold (0 Silent .. 100 Verbose).',
		humanTitle: 'Set Tooltip Detail',
		plainDescription: 'Control how much contextual guidance tooltips show across controls.',
		category: 'CUSTOMIZE',
		icon: 'help',
		intentKind: 'UI_SET_TOOLTIP_INFO_LEVEL',
		requiredCapabilityBit: CAPABILITY_BITS.WRITE_THEMES,
		inputSchema: {
			type: 'object',
			properties: { projectId: { type: 'string' }, infoLevel: { type: 'number', minimum: 0, maximum: 100 } },
			required: ['infoLevel']
		},
		outputSchema: { type: 'object', properties: { tooltipInfoLevel: { type: 'number' }, tier: { type: 'string' } } },
		annotations: IDEM
	}
];
