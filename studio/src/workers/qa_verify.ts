import { existsSync } from 'node:fs';
import { VERSION } from '@chronos-ui/svelte';
import { compileTomeSsg } from './compile_tome_ssg';
import { runStaticAudit } from './qa_audit';
import { formatClockBanner, formatDurationCompact, getSprintTimerStatus, lapSprintTimer } from './qa_timer';

export type QaTier = 'fast' | 'delta' | 'release';
export const LATEST_DELTA_TEST = 'studio/src/tests/releases/v0101_motion_cursors_history.test.ts';
const TSC_BUILD_INFO = 'studio/data/.tsbuildinfo';
const TSC_BIN = existsSync('node_modules/typescript/bin/tsc') ? ['bun', '--bun', 'node_modules/typescript/bin/tsc'] : ['bunx', 'tsc'];

export function resolveQaTier(argv: readonly string[]): QaTier {
	if (argv.includes('--full-battery') || argv.includes('--release') || argv.includes('--full') || argv.includes('--all')) return 'release';
	if (argv.includes('--delta')) return 'delta';
	return 'fast';
}

export function resolveScopedTestFile(argv: readonly string[]): string {
	const flag = argv.find((a) => a.startsWith('--test='))?.slice('--test='.length).trim();
	return flag || LATEST_DELTA_TEST;
}

function runStep(label: string, cmd: string[]): boolean {
	const t0 = performance.now();
	const proc = Bun.spawnSync(cmd, { stdout: 'inherit', stderr: 'inherit' });
	const ms = Math.round(performance.now() - t0);
	console.log(`[verify] ${label}: ${proc.exitCode === 0 ? 'PASS' : 'FAIL'} (${ms}ms)`);
	return proc.exitCode === 0;
}

function emitEdgeTiming(tier: QaTier, totalMs: number): void {
	const status = getSprintTimerStatus();
	if (status.active) {
		const next = lapSprintTimer(`qa:${tier}`);
		console.log(`[verify] qa:${tier} finished in ${totalMs}ms (lap +${formatDurationCompact(next.lastDeltaMs)})`);
	} else {
		console.log(`[verify] qa:${tier} finished in ${totalMs}ms.`);
	}
	console.log(formatClockBanner(`qa:${tier}`));
}

export async function runVerificationSuite(tier: QaTier = 'fast', scopedTest = LATEST_DELTA_TEST): Promise<boolean> {
	const totalStart = performance.now();
	console.log(formatClockBanner(`qa:${tier}:start`));
	const auditStart = performance.now();
	const violations = runStaticAudit(process.cwd(), { full: tier !== 'fast' });
	const auditMs = Math.round(performance.now() - auditStart);
	if (violations.length > 0) {
		console.error(`[verify] Stage 1 Static Audit FAILED (${auditMs}ms):`, violations);
		emitEdgeTiming(tier, Math.round(performance.now() - totalStart));
		return false;
	}
	console.log(`[verify] Stage 1 Static Audit (${tier === 'fast' ? 'cached' : 'full'}) PASSED (0 violations, ${auditMs}ms).`);

	if (tier === 'fast') {
		const ok = runStep('TypeScript Check', [...TSC_BIN, '--noEmit', '--skipLibCheck', '--incremental', '--tsBuildInfoFile', TSC_BUILD_INFO])
			&& runStep(`v${VERSION} Scoped Delta`, ['bun', 'test', scopedTest]);
		emitEdgeTiming(tier, Math.round(performance.now() - totalStart));
		return ok;
	}
	if (tier === 'delta') {
		const ok = runStep(`v${VERSION} Scoped Delta`, ['bun', 'test', scopedTest])
			&& runStep('Svelte Check', ['bunx', 'svelte-check', '--tsconfig', './tsconfig.json'])
			&& runStep('Vite Client Build', ['bun', 'run', '--bun', 'vite', 'build']);
		emitEdgeTiming(tier, Math.round(performance.now() - totalStart));
		return ok;
	}
	if (!runStep('Package .d.ts Emit Check', [...TSC_BIN, '-p', 'packages/chronos-ui/tsconfig.build.json'])
		|| !runStep('Full Test Battery', ['bun', 'test'])) {
		emitEdgeTiming(tier, Math.round(performance.now() - totalStart));
		return false;
	}
	const ssgStart = performance.now();
	compileTomeSsg();
	console.log(`[verify] SSG Tome Compiled (${Math.round(performance.now() - ssgStart)}ms).`);
	const ok = runStep('Production Vite Build', ['bun', 'run', '--bun', 'vite', 'build']);
	emitEdgeTiming(tier, Math.round(performance.now() - totalStart));
	return ok;
}

if (import.meta.main) {
	const argv = process.argv.slice(2);
	void runVerificationSuite(resolveQaTier(argv), resolveScopedTestFile(argv)).then((ok) => {
		process.exit(ok ? 0 : 1);
	});
}
