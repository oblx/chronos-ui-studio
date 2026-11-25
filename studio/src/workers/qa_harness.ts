import { ALL_HARNESS_SCENARIOS, SCENARIO_SCRIPTS, type HarnessScenarioId } from './qa_harness_scenarios';
import { formatClockBanner } from './qa_timer';

export const DEFAULT_LATEST_SCENARIO: HarnessScenarioId = 'latest';

export interface HarnessOptions {
	readonly scenarios: readonly HarnessScenarioId[];
	readonly viewports: readonly { readonly width: number; readonly height: number }[];
	readonly url: string;
	readonly failFast: boolean;
	readonly json: boolean;
	readonly debugCapture: boolean;
	readonly fullBattery: boolean;
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
	readonly cleanTeardown: boolean;
	readonly results: readonly HarnessScenarioResult[];
	readonly totalDurationMs: number;
}

const VALID_SCENARIOS: readonly HarnessScenarioId[] = ['latest', ...ALL_HARNESS_SCENARIOS];

export function parseHarnessArgs(argv: readonly string[]): HarnessOptions {
	const getFlag = (prefix: string): string | undefined => argv.find((a) => a.startsWith(prefix))?.slice(prefix.length);
	const fullBattery = argv.includes('--full-battery') || argv.includes('--all') || getFlag('--scenario=') === 'all';
	const rawScenarios = getFlag('--scenario=') ?? (fullBattery ? 'all' : DEFAULT_LATEST_SCENARIO);
	const scenarios: HarnessScenarioId[] = rawScenarios === 'all'
		? [...ALL_HARNESS_SCENARIOS]
		: rawScenarios.split(',').filter((s): s is HarnessScenarioId => VALID_SCENARIOS.includes(s as HarnessScenarioId));
	const defaultVp = fullBattery ? '1440x900,390x844' : '1440x900';
	const viewports = (getFlag('--viewports=') ?? defaultVp).split(',').map((vp) => {
		const [w, h] = vp.split('x').map((n) => Number(n));
		return { width: Number.isFinite(w) && w >= 320 ? w : 1440, height: Number.isFinite(h) && h >= 480 ? h : 900 };
	});
	return {
		scenarios: scenarios.length > 0 ? scenarios : [DEFAULT_LATEST_SCENARIO],
		viewports,
		url: getFlag('--url=') ?? 'http://localhost:3000',
		failFast: argv.includes('--fail-fast'),
		json: argv.includes('--json'),
		debugCapture: argv.includes('--debug-capture'),
		fullBattery
	};
}

function runPlaywrightCli(args: readonly string[]): { readonly ok: boolean; readonly output: string } {
	const proc = Bun.spawnSync(['playwright-cli', ...args], { stdout: 'pipe', stderr: 'pipe' });
	const output = `${new TextDecoder().decode(proc.stdout)}\n${new TextDecoder().decode(proc.stderr)}`.trim();
	return { ok: proc.exitCode === 0 && !output.includes('### Error'), output };
}

function buildBatchRunnerScript(opts: HarnessOptions): string {
	const plan = opts.viewports.map((vp) => ({
		width: vp.width, height: vp.height, label: `${vp.width}x${vp.height}`,
		targets: vp.width < 640 ? opts.scenarios.filter((s) => s === 'responsive') : [...opts.scenarios]
	})).filter((p) => p.targets.length > 0);
	const scriptEntries = [...new Set(plan.flatMap((p) => p.targets))]
		.map((id) => `${JSON.stringify(id)}: (${SCENARIO_SCRIPTS[id]})`).join(',\n');
	return `async (page) => {
		const scripts = {\n${scriptEntries}\n};
		const plan = ${JSON.stringify(plan)}, failFast = ${opts.failFast}, consoleErrs = [];
		const onCon = (m) => { const txt = m.text(); if (m.type() === 'error' && !/WebSocket|hmr/i.test(txt)) consoleErrs.push(txt.slice(0, 160)); };
		const onErr = (e) => { const txt = String(e?.message || e); if (!/WebSocket|hmr/i.test(txt)) consoleErrs.push(txt.slice(0, 160)); };
		page.on('console', onCon); page.on('pageerror', onErr);
		const cleanGenesis = async (reload) => {
			await page.evaluate(async () => { await fetch('/api/projects/proj-genesis/clean', { method: 'POST' }); try { localStorage.clear(); sessionStorage.clear(); } catch {} });
			if (reload) { await page.reload({ waitUntil: 'domcontentloaded' }); await page.locator('[data-layout-density]').first().waitFor({ state: 'visible', timeout: 8000 }); }
			return page.evaluate(async () => { const d = await (await fetch('/api/projects')).json(); const p = Array.isArray(d.projects) ? d.projects.find((x) => x.id === 'proj-genesis') : null; return Array.isArray(p?.nodes) ? p.nodes.length : -1; });
		};
		const results = [];
		await cleanGenesis(true);
		for (const vp of plan) {
			await page.setViewportSize({ width: vp.width, height: vp.height });
			for (const sc of vp.targets) {
				const t0 = Date.now();
				try { const out = await scripts[sc](page); results.push({ scenario: sc, viewport: vp.label, pass: true, durationMs: Date.now() - t0, detail: JSON.stringify(out ?? 'PASS') }); }
				catch (err) { results.push({ scenario: sc, viewport: vp.label, pass: false, durationMs: Date.now() - t0, detail: String(err?.message || err).slice(0, 260) }); if (failFast) break; }
			}
		}
		const remaining = await cleanGenesis(false);
		page.off('console', onCon); page.off('pageerror', onErr);
		return { results, cleanTeardown: remaining === 0, remaining, consoleErrors: consoleErrs.length };
	}`;
}

function parseBatchPayload(raw: string): { results: HarnessScenarioResult[]; cleanTeardown: boolean; consoleErrors: number } | null {
	const m = raw.match(/### Result\s*\n([\s\S]*?)(?:\n### |\s*$)/);
	if (!m) return null;
	try { return JSON.parse(m[1].trim()) as { results: HarnessScenarioResult[]; cleanTeardown: boolean; consoleErrors: number }; } catch { return null; }
}

export function runQaHarness(opts: HarnessOptions): HarnessReport {
	const t0 = performance.now();
	let consoleErrors = 0, results: HarnessScenarioResult[] = [], cleanTeardown = false;
	if (!opts.json) console.log(formatClockBanner('qa:harness'));
	try {
		const open = runPlaywrightCli(['open', '--browser=chromium', opts.url]);
		if (!open.ok) {
			return { ok: false, url: opts.url, screenshotsTaken: 0, consoleErrors: 1, cleanTeardown: false, results: [{ scenario: opts.scenarios[0], viewport: 'init', pass: false, durationMs: Math.round(performance.now() - t0), detail: open.output.slice(0, 260) }], totalDurationMs: Math.round(performance.now() - t0) };
		}
		const batch = runPlaywrightCli(['run-code', buildBatchRunnerScript(opts)]);
		const parsed = parseBatchPayload(batch.output);
		if (parsed) { results = parsed.results; cleanTeardown = parsed.cleanTeardown; consoleErrors = parsed.consoleErrors ?? 0; }
		else results = [{ scenario: opts.scenarios[0], viewport: 'batch', pass: false, durationMs: Math.round(performance.now() - t0), detail: batch.output.slice(0, 260) }];
	} finally {
		runPlaywrightCli(['close']);
	}
	const ok = results.length > 0 && results.every((r) => r.pass) && consoleErrors === 0 && cleanTeardown;
	return { ok, url: opts.url, screenshotsTaken: 0, consoleErrors, cleanTeardown, results, totalDurationMs: Math.round(performance.now() - t0) };
}

if (import.meta.main) {
	const opts = parseHarnessArgs(process.argv.slice(2));
	const report = runQaHarness(opts);
	if (opts.json) console.log(JSON.stringify(report, null, 2));
	else {
		for (const r of report.results) console.log(`[qa:harness] ${r.pass ? 'PASS' : 'FAIL'} ${r.scenario} @ ${r.viewport} (${r.durationMs}ms)${r.pass ? '' : ` -> ${r.detail}`}`);
		console.log(`[qa:harness] summary: ${report.results.filter((r) => r.pass).length}/${report.results.length} passed | cleanTeardown=${report.cleanTeardown} | consoleErrors=${report.consoleErrors} | screenshots=${report.screenshotsTaken} | ${report.totalDurationMs}ms`);
	}
	process.exit(report.ok ? 0 : 1);
}
