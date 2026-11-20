import { clampCornerRadiusRem, CORNER_RADIUS_LIMITS, type MotionConfig, type UiProjectDefinition } from '@chronos-ui/svelte';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { build as viteBuild } from 'vite';
import { registerOutputAdapter } from '../registry';
import { emitProjectCssTokens } from './css.adapter';
import { buildRuntimeConfigSchema } from './json.adapter';
import { emitProjectSvelteScaffold } from './svelte.adapter';

export interface StaticBuildOptions {
	readonly project: UiProjectDefinition;
	readonly workDir: string;
	readonly motionConfig?: MotionConfig;
}

export interface StaticBuildResult {
	readonly adapterId: 'static-site-build';
	readonly outDir: string;
	readonly files: readonly string[];
	readonly checksum: string;
	readonly runtimeSchemaPath: string;
	readonly envExamplePath: string;
	readonly cacheHit?: boolean;
}

export const MAX_CONCURRENT_BUILDS = 1;
const BUILD_ARTIFACT_CACHE = new Map<string, StaticBuildResult>();
let buildQueueTail: Promise<void> = Promise.resolve();

function enqueueSingleFlight<T>(task: () => Promise<T>): Promise<T> {
	const run = buildQueueTail.then(task, task);
	buildQueueTail = run.then(() => undefined, () => undefined);
	return run;
}

function computeInputCacheKey(opts: StaticBuildOptions): string {
	const hasher = new Bun.CryptoHasher('sha256');
	hasher.update(JSON.stringify({
		id: opts.project.id, themeId: opts.project.themeId, cornerMode: opts.project.cornerMode,
		cornerRadiusRem: clampCornerRadiusRem(opts.project.cornerRadiusRem ?? CORNER_RADIUS_LIMITS.defaultRem), activeCursorPackId: opts.project.activeCursorPackId ?? null,
		nodes: opts.project.nodes, buildConfig: opts.project.buildConfig, motionConfig: opts.motionConfig ?? null
	}));
	return hasher.digest('hex');
}

function resolveLibraryAliases(): Record<string, string> {
	const pkg = resolve(process.cwd(), 'packages/chronos-ui/src');
	const out: Record<string, string> = {
		'@chronos-ui/svelte/styles.css': join(pkg, 'styles.css'),
		'@chronos-ui/svelte/manifest': join(pkg, 'manifest.ts'),
		'@chronos-ui/svelte': join(pkg, 'index.ts')
	};
	for (const sub of ['tokens', 'wire', 'input', 'motion', 'cursor', 'machines', 'atoms', 'forms', 'molecules', 'organisms', 'modals', 'canvas', 'assistant']) {
		out[`@chronos-ui/svelte/${sub}`] = join(pkg, sub, 'index.ts');
	}
	return out;
}

function listFilesRecursive(dir: string, root = dir): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) out.push(...listFilesRecursive(full, root));
		else out.push(full.slice(root.length + 1));
	}
	return out.sort();
}

function writeScaffoldWorkspace(project: UiProjectDefinition, srcDir: string, motionConfig?: MotionConfig): void {
	mkdirSync(join(srcDir, 'src'), { recursive: true });
	const nmLink = join(srcDir, 'node_modules');
	if (!existsSync(nmLink)) symlinkSync(resolve(process.cwd(), 'node_modules'), nmLink, 'dir');
	writeFileSync(join(srcDir, 'src/App.svelte'), emitProjectSvelteScaffold(project, motionConfig).content, 'utf8');
	writeFileSync(join(srcDir, 'src/tokens.css'), emitProjectCssTokens(project).content, 'utf8');
	const pkgSrc = resolve(process.cwd(), 'packages/chronos-ui/src');
	writeFileSync(join(srcDir, 'src/app.css'), `@import "tailwindcss";\n@source ${JSON.stringify(pkgSrc)};\n@import "@chronos-ui/svelte/styles.css";\n@import "./tokens.css";\n`, 'utf8');
	writeFileSync(join(srcDir, 'src/main.ts'), `import './app.css';\nimport { mount } from 'svelte';\nimport App from './App.svelte';\nmount(App, { target: document.getElementById('app')! });\n`, 'utf8');
	writeFileSync(join(srcDir, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${project.name}</title></head><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>\n`, 'utf8');
}

async function runSingleBuild(opts: StaticBuildOptions): Promise<StaticBuildResult> {
	const cacheKey = computeInputCacheKey(opts);
	const outDir = join(opts.workDir, 'dist');
	const cached = BUILD_ARTIFACT_CACHE.get(cacheKey);
	if (cached && existsSync(cached.outDir)) {
		if (cached.outDir !== outDir) cpSync(cached.outDir, outDir, { recursive: true });
		return { ...cached, outDir, runtimeSchemaPath: join(outDir, 'runtime.config.schema.json'), envExamplePath: join(outDir, '.env.example'), cacheHit: true };
	}
	const srcDir = join(opts.workDir, 'src-workspace');
	writeScaffoldWorkspace(opts.project, srcDir, opts.motionConfig);
	try {
		await viteBuild({
			root: srcDir, base: opts.project.buildConfig.basePath || './', logLevel: 'silent',
			plugins: [tailwindcss(), svelte({ configFile: false })],
			resolve: { alias: resolveLibraryAliases() },
			build: { outDir, emptyOutDir: true, minify: true }
		});
	} finally {
		rmSync(srcDir, { recursive: true, force: true });
	}
	const { schema, envExample } = buildRuntimeConfigSchema(opts.project);
	const runtimeSchemaPath = join(outDir, 'runtime.config.schema.json');
	const envExamplePath = join(outDir, '.env.example');
	writeFileSync(runtimeSchemaPath, schema, 'utf8');
	writeFileSync(envExamplePath, envExample, 'utf8');
	const files = listFilesRecursive(outDir);
	const hasher = new Bun.CryptoHasher('sha256');
	for (const rel of files) hasher.update(readFileSync(join(outDir, rel)));
	const result: StaticBuildResult = { adapterId: 'static-site-build', outDir, files, checksum: hasher.digest('hex'), runtimeSchemaPath, envExamplePath, cacheHit: false };
	BUILD_ARTIFACT_CACHE.set(cacheKey, result);
	return result;
}

export function compileStaticClientBuild(opts: StaticBuildOptions): Promise<StaticBuildResult> {
	return enqueueSingleFlight(() => runSingleBuild(opts));
}

registerOutputAdapter<StaticBuildOptions, Promise<StaticBuildResult>>({
	id: 'static-site-build',
	label: 'Production Optimized Vite Static Client Build',
	mimeType: 'application/x-chronos-static-dist',
	emit: compileStaticClientBuild
});
