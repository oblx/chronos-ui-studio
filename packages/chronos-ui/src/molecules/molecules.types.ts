import type { UiIconName } from '../tokens';

export interface SubTabItem {
	readonly id: string;
	readonly label: string;
	readonly icon?: UiIconName;
	readonly tip?: string;
}

export interface ContextMenuItem {
	readonly id: string;
	readonly label: string;
	readonly icon?: UiIconName;
	readonly danger?: boolean;
	readonly onSelect: () => void;
}
