import { compileTomeSsg } from './compile_tome_ssg';
import { runStaticAudit } from './qa_audit';
import { formatClockBanner, formatDurationCompact, getSprintTimerStatus, lapSprintTimer } from './qa_timer';

export type QaTier = 'fast' | 'delta' | 'release';

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

export async function runVerificationSuite(tier: QaTier = 'release'): Promise<boolean> {
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
		const ok = runStep('TypeScript Check', ['bunx', 'tsc', '--noEmit'])
			&& runStep('v0.0.9 Core Spec', ['bun', 'test', 'studio/src/tests/releases/v009_harness_tome_realtime.test.ts']);
		emitEdgeTiming(tier, Math.round(performance.now() - totalStart));
		return ok;
	}

	if (tier === 'delta') {
		const ok = runStep('v0.0.9 Core Spec', ['bun', 'test', 'studio/src/tests/releases/v009_harness_tome_realtime.test.ts'])
			&& runStep('Svelte Check', ['bunx', 'svelte-check', '--tsconfig', './tsconfig.json'])
			&& runStep('Vite Client Build', ['bun', 'run', '--bun', 'vite', 'build']);
		emitEdgeTiming(tier, Math.round(performance.now() - totalStart));
		return ok;
	}

	if (!runStep('Full Test Suite', ['bun', 'test'])) {
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
	const arg = process.argv.find((a) => a === '--fast' || a === '--delta' || a === '--release');
	const tier: QaTier = arg === '--fast' ? 'fast' : arg === '--delta' ? 'delta' : 'release';
	void runVerificationSuite(tier).then((ok) => {
		process.exit(ok ? 0 : 1);
	});
}
