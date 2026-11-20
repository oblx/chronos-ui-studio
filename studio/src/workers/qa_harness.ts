import { ALL_HARNESS_SCENARIOS, SCENARIO_SCRIPTS, type HarnessScenarioId } from './qa_harness_scenarios';
import { formatClockBanner } from './qa_timer';

export interface HarnessOptions {
	readonly scenarios: readonly HarnessScenarioId[];
	readonly viewports: readonly { readonly width: number; readonly height: number }[];
	readonly url: string;
	readonly failFast: boolean;
	readonly json: boolean;
	readonly debugCapture: boolean;
}

export interface HarnessScenarioResult {
	readonly scenario: HarnessScenarioId;
	readonly viewport: string;
	readonly pass: boolean;
	readonly durationMs: number;
	readonly detail: string;
}

export interface HarnessReport {
	readonly ok: boolean;
	readonly url: string;
	readonly screenshotsTaken: number;
	readonly consoleErrors: number;
	readonly results: readonly HarnessScenarioResult[];
	readonly totalDurationMs: number;
}

export function parseHarnessArgs(argv: readonly string[]): HarnessOptions {
	const getFlag = (prefix: string): string | undefined => argv.find((a) => a.startsWith(prefix))?.slice(prefix.length);
	const rawScenarios = getFlag('--scenario=') ?? 'all';
	const scenarios: HarnessScenarioId[] = rawScenarios === 'all'
		? [...ALL_HARNESS_SCENARIOS]
		: (rawScenarios.split(',').filter((s): s is HarnessScenarioId => ALL_HARNESS_SCENARIOS.includes(s as HarnessScenarioId)));
	const rawVps = (getFlag('--viewports=') ?? '1440x900,390x844').split(',');
	const viewports = rawVps.map((vp) => {
		const [w, h] = vp.split('x').map((n) => Number(n));
		return { width: Number.isFinite(w) && w >= 320 ? w : 1440, height: Number.isFinite(h) && h >= 480 ? h : 900 };
	});
	return {
		scenarios: scenarios.length > 0 ? scenarios : [...ALL_HARNESS_SCENARIOS],
		viewports,
		url: getFlag('--url=') ?? 'http://localhost:3000',
		failFast: argv.includes('--fail-fast'),
		json: argv.includes('--json'),
		debugCapture: argv.includes('--debug-capture')
	};
}

function runPlaywrightCli(args: readonly string[]): { readonly ok: boolean; readonly output: string } {
	const proc = Bun.spawnSync(['playwright-cli', ...args], { stdout: 'pipe', stderr: 'pipe' });
	const output = `${new TextDecoder().decode(proc.stdout)}\n${new TextDecoder().decode(proc.stderr)}`.trim();
	return { ok: proc.exitCode === 0 && !output.includes('### Error'), output };
}

function countConsoleErrors(raw: string): number {
	return raw.split('\n').filter((line) => /\[error\]|Uncaught|PageError/i.test(line) && !/WebSocket|hmr/i.test(line)).length;
}

export function runQaHarness(opts: HarnessOptions): HarnessReport {
	const t0 = performance.now();
	const results: HarnessScenarioResult[] = [];
	let screenshotsTaken = 0;
	let consoleErrors = 0;
	if (!opts.json) console.log(formatClockBanner('qa:harness'));
	try {
		const open = runPlaywrightCli(['open', '--browser=chromium', opts.url]);
		if (!open.ok) {
			return {
				ok: false, url: opts.url, screenshotsTaken: 0, consoleErrors: 1,
				results: [{ scenario: opts.scenarios[0], viewport: 'init', pass: false, durationMs: Math.round(performance.now() - t0), detail: open.output.slice(0, 260) }],
				totalDurationMs: Math.round(performance.now() - t0)
			};
		}
		for (const vp of opts.viewports) {
			const vpLabel = `${vp.width}x${vp.height}`;
			runPlaywrightCli(['resize', String(vp.width), String(vp.height)]);
			const targets = vp.width < 640 ? opts.scenarios.filter((s) => s === 'responsive') : opts.scenarios;
			for (const scenario of targets) {
				const st = performance.now();
				const res = runPlaywrightCli(['run-code', SCENARIO_SCRIPTS[scenario]]);
				results.push({ scenario, viewport: vpLabel, pass: res.ok, durationMs: Math.round(performance.now() - st), detail: res.ok ? 'PASS' : res.output.slice(0, 260) });
				if (!res.ok && opts.debugCapture) {
					runPlaywrightCli(['screenshot', `--filename=.playwright-cli/debug-${scenario}-${vpLabel}.png`]);
					screenshotsTaken += 1;
				}
				if (!res.ok && opts.failFast) break;
			}
		}
		const cons = runPlaywrightCli(['console']);
		consoleErrors = countConsoleErrors(cons.output);
	} finally {
		runPlaywrightCli(['close']);
	}
	const ok = results.length > 0 && results.every((r) => r.pass) && consoleErrors === 0;
	return { ok, url: opts.url, screenshotsTaken, consoleErrors, results, totalDurationMs: Math.round(performance.now() - t0) };
}

if (import.meta.main) {
	const opts = parseHarnessArgs(process.argv.slice(2));
	const report = runQaHarness(opts);
	if (opts.json) console.log(JSON.stringify(report, null, 2));
	else {
		for (const r of report.results) console.log(`[qa:harness] ${r.pass ? 'PASS' : 'FAIL'} ${r.scenario} @ ${r.viewport} (${r.durationMs}ms)${r.pass ? '' : ` -> ${r.detail}`}`);
		console.log(`[qa:harness] summary: ${report.results.filter((r) => r.pass).length}/${report.results.length} passed | consoleErrors=${report.consoleErrors} | screenshots=${report.screenshotsTaken} | ${report.totalDurationMs}ms`);
	}
	process.exit(report.ok ? 0 : 1);
}
