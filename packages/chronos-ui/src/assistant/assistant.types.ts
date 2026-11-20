export type AssistantOcularState = 'IDLE' | 'THINKING' | 'LISTENING' | 'BUILDING_UI' | 'MCP_DRIVEN' | 'ERROR';

export type AssistantDockMode = 'DOCKED' | 'FLOATING';

export interface AssistantDockState {
	readonly mode: AssistantDockMode;
	readonly expanded: boolean;
	readonly xRem: number;
	readonly yRem: number;
}

export interface AssistantToolChip {
	readonly tool: string;
	readonly summary: string;
	readonly ok: boolean;
}

export interface AssistantMessage {
	readonly id: string;
	readonly role: 'user' | 'assistant' | 'tool';
	readonly content: string;
	readonly toolCalls?: readonly AssistantToolChip[];
	readonly revisionId?: string;
	readonly createdAt: number;
}

export interface AssistantQuickAction {
	readonly id: string;
	readonly label: string;
	readonly prompt: string;
}
