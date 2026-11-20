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
			alias: {
				'@chronos-ui/svelte': path.resolve(import.meta.dirname, 'packages/chronos-ui/src/index.ts'),
				'@studio': path.resolve(import.meta.dirname, 'studio/src'),
				'@': path.resolve(import.meta.dirname, '.')
			}
		},
		server: {
			hmr: false,
			watch: process.env.DISABLE_HMR === 'true' ? null : {}
		}
	};
});

