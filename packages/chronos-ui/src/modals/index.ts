import type { ModalGeometrySnapshot, ModalLifecyclePhase } from '../machines';

export type UiModalSizeTier = 'COMPACT' | 'STANDARD' | 'WIDE' | 'FULL_STAGE';
export const MODAL_EXPANSION_CTX_KEY = Symbol.for('chronos-modal-expansion');
export interface ModalExpansionBridge {
	readonly isExpanded: boolean;
	readonly restoreSnapshot: ModalGeometrySnapshot | null;
	readonly phase?: ModalLifecyclePhase;
	setExpanded(next: boolean, snapshot?: ModalGeometrySnapshot | null): void;
	markOpened?: () => void;
	markClosed?: () => void;
}
export { default as UiModalHeader } from './UiModalHeader.svelte';
export { default as UiModalFooter } from './UiModalFooter.svelte';
export { default as UiModalShell } from './UiModalShell.svelte';
