import type { ThemePack } from './semantic.tokens';

export const DARK_THEMES: readonly ThemePack[] = [
	{
		id: 'obsidian-brass',
		name: 'Obsidian Brass',
		polarity: 'dark',
		tokens: {
			'--ui-primary': '#D4A853', '--ui-primary-content': '#0E1116', '--ui-secondary': '#60A5FA',
			'--ui-secondary-content': '#09101C', '--ui-accent': '#E5B965',
			'--ui-accent-vivid': '#22D3EE', '--ui-accent-vivid-content': '#04131A',
			'--ui-base-100': '#0B0F14', '--ui-base-200': '#121821', '--ui-base-300': '#1B2330',
			'--ui-base-content': '#EDF2F7', '--ui-muted-content': '#A3B8D0',
			'--ui-border-subtle': '#2B3749', '--ui-info': '#60A5FA',
			'--ui-success': '#34D399', '--ui-warning': '#FBBF24', '--ui-error': '#F87171'
		}
	},
	{
		id: 'phosphor-crt',
		name: 'Phosphor CRT',
		polarity: 'dark',
		tokens: {
			'--ui-primary': '#34D399', '--ui-primary-content': '#05150F', '--ui-secondary': '#38BDF8',
			'--ui-secondary-content': '#06131B', '--ui-accent': '#6EE7B7',
			'--ui-accent-vivid': '#34D399', '--ui-accent-vivid-content': '#031A11',
			'--ui-base-100': '#070D0B', '--ui-base-200': '#0E1815', '--ui-base-300': '#162520',
			'--ui-base-content': '#E6F7F0', '--ui-muted-content': '#A3B8D0',
			'--ui-border-subtle': '#233B33', '--ui-info': '#38BDF8',
			'--ui-success': '#4ADE80', '--ui-warning': '#FACC15', '--ui-error': '#FB7185'
		}
	},
	{
		id: 'tokyo-phosphor',
		name: 'Tokyo Phosphor',
		polarity: 'dark',
		tokens: {
			'--ui-primary': '#7AA2F7', '--ui-primary-content': '#0B1020', '--ui-secondary': '#2AC3DE',
			'--ui-secondary-content': '#07161B', '--ui-accent': '#BB9AF7',
			'--ui-accent-vivid': '#F43F5E', '--ui-accent-vivid-content': '#09030A',
			'--ui-base-100': '#0D101B', '--ui-base-200': '#141929', '--ui-base-300': '#1E253A',
			'--ui-base-content': '#E6ECFA', '--ui-muted-content': '#A3B8D0',
			'--ui-border-subtle': '#2D3756', '--ui-info': '#7DCFFF',
			'--ui-success': '#73DACA', '--ui-warning': '#E0AF68', '--ui-error': '#F7768E'
		}
	}
] as const;

export const LIGHT_THEMES: readonly ThemePack[] = [
	{
		id: 'alabaster-lab',
		name: 'Alabaster Lab',
		polarity: 'light',
		tokens: {
			'--ui-primary': '#0F52BA', '--ui-primary-content': '#FFFFFF', '--ui-secondary': '#0D7A6F',
			'--ui-secondary-content': '#FFFFFF', '--ui-accent': '#1D4ED8',
			'--ui-accent-vivid': '#0369A1', '--ui-accent-vivid-content': '#FFFFFF',
			'--ui-base-100': '#F7F8FA', '--ui-base-200': '#FFFFFF', '--ui-base-300': '#EBEEF4',
			'--ui-base-content': '#0F172A', '--ui-muted-content': '#334155',
			'--ui-border-subtle': '#CBD5E1', '--ui-info': '#0284C7',
			'--ui-success': '#15803D', '--ui-warning': '#B45309', '--ui-error': '#B91C1C'
		}
	},
	{
		id: 'archival-vellum',
		name: 'Archival Vellum',
		polarity: 'light',
		tokens: {
			'--ui-primary': '#7C4D12', '--ui-primary-content': '#FFFFFF', '--ui-secondary': '#2F5D62',
			'--ui-secondary-content': '#FFFFFF', '--ui-accent': '#9A5B13',
			'--ui-accent-vivid': '#C2410C', '--ui-accent-vivid-content': '#FFFFFF',
			'--ui-base-100': '#F7F4ED', '--ui-base-200': '#FFFDF8', '--ui-base-300': '#EAE3D5',
			'--ui-base-content': '#1C1917', '--ui-muted-content': '#334155',
			'--ui-border-subtle': '#D0C6B4', '--ui-info': '#0369A1',
			'--ui-success': '#15803D', '--ui-warning': '#A16207', '--ui-error': '#B91C1C'
		}
	},
	{
		id: 'daylight-blueprint',
		name: 'Daylight Blueprint',
		polarity: 'light',
		tokens: {
			'--ui-primary': '#1E40AF', '--ui-primary-content': '#FFFFFF', '--ui-secondary': '#0F766E',
			'--ui-secondary-content': '#FFFFFF', '--ui-accent': '#2563EB',
			'--ui-accent-vivid': '#4F46E5', '--ui-accent-vivid-content': '#FFFFFF',
			'--ui-base-100': '#F1F5FA', '--ui-base-200': '#FFFFFF', '--ui-base-300': '#E1E8F2',
			'--ui-base-content': '#0B1324', '--ui-muted-content': '#334155',
			'--ui-border-subtle': '#BDC9DC', '--ui-info': '#0369A1',
			'--ui-success': '#166534', '--ui-warning': '#B45309', '--ui-error': '#B91C1C'
		}
	}
] as const;
