import type { MotionConfig, UiProjectDefinition } from '@chronos-ui/svelte';
import { cpSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { registerOutputAdapter } from '../registry';
import { packZipFiles, type ZipEntry } from '../zip.codec';
import {
	buildVendoredEnvAndDrizzle, buildVendoredPackageJson,
	buildVendoredServerFiles, buildVendoredSqlMigration
} from './fullstack.templates';
import { compileStaticClientBuild } from './static.build.adapter';

export interface FullstackBundleOptions {
	readonly project: UiProjectDefinition;
	readonly workDir: string;
	readonly motionConfig?: MotionConfig;
	readonly emitZip?: boolean;
}

export interface FullstackBundleResult {
	readonly adapterId: 'fullstack-bundle';
	readonly outDir: string;
	readonly clientDir: string;
	readonly serverDir: string;
	readonly files: readonly string[];
	readonly checksum: string;
	readonly zipBytes?: Uint8Array;
}

function listAllFiles(dir: string, root = dir): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) out.push(...listAllFiles(full, root));
		else out.push(full.slice(root.length + 1));
	}
	return out.sort();
}

function writeTextFile(baseDir: string, rel: string, content: string): void {
	const full = join(baseDir, rel);
	mkdirSync(dirname(full), { recursive: true });
	writeFileSync(full, content, 'utf8');
}

export async function compileFullstackBundle(opts: FullstackBundleOptions): Promise<FullstackBundleResult> {
	const outDir = join(opts.workDir, `${opts.project.slug}-fullstack`);
	const clientDir = join(outDir, 'client');
	const serverDir = join(outDir, 'server');
	mkdirSync(outDir, { recursive: true });
	const staticBuild = await compileStaticClientBuild({ project: opts.project, workDir: join(opts.workDir, 'static-stage'), motionConfig: opts.motionConfig });
	cpSync(staticBuild.outDir, clientDir, { recursive: true });
	writeTextFile(outDir, 'package.json', buildVendoredPackageJson(opts.project));
	const { envExample, drizzleConfig, readme } = buildVendoredEnvAndDrizzle(opts.project);
	writeTextFile(outDir, '.env.example', envExample);
	writeTextFile(outDir, 'drizzle.config.ts', drizzleConfig);
	writeTextFile(outDir, 'README.md', readme);
	const { sql, journal } = buildVendoredSqlMigration(opts.project);
	writeTextFile(outDir, 'drizzle/0000_init.sql', sql);
	writeTextFile(outDir, 'drizzle/meta/_journal.json', journal);
	for (const [rel, code] of Object.entries(buildVendoredServerFiles(opts.project))) writeTextFile(outDir, rel, code);
	const files = listAllFiles(outDir);
	const hasher = new Bun.CryptoHasher('sha256');
	const zipEntries: ZipEntry[] = [];
	for (const rel of files) {
		const buf = readFileSync(join(outDir, rel));
		hasher.update(buf);
		if (opts.emitZip) zipEntries.push({ path: rel, content: new Uint8Array(buf) });
	}
	return {
		adapterId: 'fullstack-bundle', outDir, clientDir, serverDir, files,
		checksum: hasher.digest('hex'),
		...(opts.emitZip ? { zipBytes: packZipFiles(zipEntries) } : {})
	};
}

registerOutputAdapter<FullstackBundleOptions, Promise<FullstackBundleResult>>({
	id: 'fullstack-bundle',
	label: 'Standalone Full-Stack Bundle (Client + Vendored Bun/Drizzle Backend)',
	mimeType: 'application/zip',
	emit: compileFullstackBundle
});
