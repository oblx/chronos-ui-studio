import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
	return {
		plugins: [
			svelte(),
			tailwindcss()
		],
		resolve: {
			alias: [
				{ find: '@chronos-ui/svelte/graph', replacement: path.resolve(import.meta.dirname, 'packages/chronos-ui/src/organisms/graph/index.ts') },
				{ find: /^@chronos-ui\/svelte\/(.+)$/, replacement: `${path.resolve(import.meta.dirname, 'packages/chronos-ui/src')}/$1` },
				{ find: '@chronos-ui/svelte', replacement: path.resolve(import.meta.dirname, 'packages/chronos-ui/src/index.ts') },
				{ find: '@ui', replacement: path.resolve(import.meta.dirname, 'packages/chronos-ui/src') },
				{ find: '@studio', replacement: path.resolve(import.meta.dirname, 'studio/src') },
				{ find: '@', replacement: path.resolve(import.meta.dirname, '.') }
			]
		},
		build: {
			rollupOptions: {
				output: {
					manualChunks: (id: string) => {
						if (id.includes('node_modules/svelte')) return 'vendor-svelte';
						if (id.includes('/packages/chronos-ui/src/')) return 'chronos-ui';
						return undefined;
					}
				}
			}
		},
		server: {
			ws: false,
			hmr: false,
			watch: process.env.DISABLE_HMR === 'true'
				? null
				: { ignored: ['**/*.sqlite*', '**/.playwright-cli/**', '**/data/**', '**/dist/**'] }
		}
	};
});

