import type { IntentKind } from '@chronos-ui/svelte';
import type { StudioModalId, StudioState } from './studio.types';

export interface CommandContext {
	readonly getState: () => StudioState;
	readonly dispatch: <P>(kind: IntentKind, payload: P) => boolean;
	readonly openModal: (id: StudioModalId) => void;
	readonly startSpotlight: () => void;
	readonly pushToast: (title: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
}

type CommandHandler = (ctx: CommandContext) => void;

const COMMAND_REGISTRY = new Map<string, CommandHandler>([
	['polarity', (ctx) => { ctx.dispatch('UI_TOGGLE_POLARITY', {}); }],
	['corners', (ctx) => {
		const next = ctx.getState().accessibility.cornerMode === 'CHAMFER' ? 'STRAIGHT' : 'CHAMFER';
		ctx.dispatch('UI_SET_ACCESSIBILITY', { cornerMode: next });
	}],
	['tour', (ctx) => { ctx.startSpotlight(); }],
	['wire', (ctx) => { ctx.openModal('wire'); }],
	['tome', (ctx) => {
		ctx.dispatch('HELP_CONTEXT_SHIFTED', { topic: ctx.getState().helpTopic });
		ctx.openModal('tome');
	}],
	['help', (ctx) => {
		ctx.dispatch('HELP_CONTEXT_SHIFTED', { topic: ctx.getState().helpTopic });
		ctx.openModal('tome');
	}],
	['export', (ctx) => { ctx.openModal('export'); }],
	['reset', (ctx) => { ctx.dispatch('UI_STAGE_PAN_ZOOM', { reset: true }); }],
	['chrome', (ctx) => { ctx.dispatch('UI_TOGGLE_STUDIO_CHROME', {}); }],
	['undo', (ctx) => { ctx.dispatch('UI_UNDO_REVISION', {}); }],
	['redo', (ctx) => { ctx.dispatch('UI_REDO_REVISION', {}); }],
	['dock', (ctx) => { ctx.dispatch('UI_ASSISTANT_DOCK', {}); }]
]);

export function listStudioCommands(): readonly string[] {
	return [...COMMAND_REGISTRY.keys()];
}

export function executeStudioCommand(raw: string, ctx: CommandContext): string {
	const normalized = raw.trim().toLowerCase().replace(/^\/+/, '');
	const token = normalized.split(/\s+/)[0] ?? '';
	const exact = COMMAND_REGISTRY.get(token);
	if (exact) {
		exact(ctx);
		return `Ran /${token}`;
	}
	for (const [key, handler] of COMMAND_REGISTRY) {
		if (normalized.includes(key)) {
			handler(ctx);
			return `Ran /${key}`;
		}
	}
	ctx.pushToast(`Executed command: ${raw}`, 'info');
	return `Ran: ${raw}`;
}
