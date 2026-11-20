import type { UiIconName } from '../tokens';

export interface DrawerTabDef {
	readonly id: string;
	readonly label: string;
	readonly icon: UiIconName;
}

export interface RadarActionItem {
	readonly id: string;
	readonly label: string;
	readonly icon: UiIconName;
	readonly active?: boolean;
	readonly onClick: () => void;
}

export interface VirtualCursorPeer {
	readonly sessionId: string;
	readonly label: string;
	readonly x: number;
	readonly y: number;
	readonly scope: 'WORKSPACE' | 'FULL_APP';
	readonly lastSeenAt?: number;
}

export interface ToastItem {
	readonly id: string;
	readonly title: string;
	readonly tone: 'info' | 'success' | 'warning' | 'error';
}
