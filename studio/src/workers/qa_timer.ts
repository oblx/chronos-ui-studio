import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface SprintLap {
	readonly step: string;
	readonly atMs: number;
	readonly deltaMs: number;
	readonly elapsedMs: number;
}

export interface SprintTimerState {
	readonly startedAtMs: number;
	readonly budgetMin: number;
	readonly laps: readonly SprintLap[];
}

export interface SprintTimerSummary {
	readonly active: boolean;
	readonly budgetMin: number;
	readonly elapsedMs: number;
	readonly remainingMs: number;
	readonly withinBudget: boolean;
	readonly lastDeltaMs: number;
	readonly laps: readonly SprintLap[];
}

const DEFAULT_BUDGET_MIN = 45;
const MIN_ALLOWED_MIN = 1;
const MAX_ALLOWED_MIN = 120;
const TIMER_REL = 'studio/data/.sprint-timer.json';

const timerPath = (rootDir = process.cwd()): string => join(rootDir, TIMER_REL);

function readState(rootDir = process.cwd()): SprintTimerState | null {
	const file = timerPath(rootDir);
	if (!existsSync(file)) return null;
	try {
		return JSON.parse(readFileSync(file, 'utf8')) as SprintTimerState;
	} catch {
		return null;
	}
}

function writeState(state: SprintTimerState, rootDir = process.cwd()): void {
	mkdirSync(join(rootDir, 'studio/data'), { recursive: true });
	writeFileSync(timerPath(rootDir), JSON.stringify(state, null, '\t'), 'utf8');
}

export function startSprintTimer(budgetMin = DEFAULT_BUDGET_MIN, rootDir = process.cwd()): SprintTimerState {
	const clamped = Math.max(MIN_ALLOWED_MIN, Math.min(MAX_ALLOWED_MIN, Math.round(budgetMin)));
	const state: SprintTimerState = { startedAtMs: Date.now(), budgetMin: clamped, laps: [] };
	writeState(state, rootDir);
	return state;
}

export function lapSprintTimer(step: string, rootDir = process.cwd()): SprintTimerSummary {
	const state = readState(rootDir) ?? startSprintTimer(DEFAULT_BUDGET_MIN, rootDir);
	const now = Date.now();
	const prevAt = state.laps.length > 0 ? state.laps[state.laps.length - 1].atMs : state.startedAtMs;
	const lap: SprintLap = {
		step: step.trim() || `step-${state.laps.length + 1}`,
		atMs: now,
		deltaMs: Math.max(0, now - prevAt),
		elapsedMs: Math.max(0, now - state.startedAtMs)
	};
	const next: SprintTimerState = { ...state, laps: [...state.laps, lap] };
	writeState(next, rootDir);
	return getSprintTimerStatus(rootDir);
}

export function getSprintTimerStatus(rootDir = process.cwd()): SprintTimerSummary {
	const state = readState(rootDir);
	if (!state) {
		return { active: false, budgetMin: DEFAULT_BUDGET_MIN, elapsedMs: 0, remainingMs: DEFAULT_BUDGET_MIN * 60000, withinBudget: true, lastDeltaMs: 0, laps: [] };
	}
	const now = Date.now();
	const elapsedMs = Math.max(0, now - state.startedAtMs);
	const budgetMs = state.budgetMin * 60000;
	const lastDeltaMs = state.laps.length > 0 ? state.laps[state.laps.length - 1].deltaMs : elapsedMs;
	return {
		active: true,
		budgetMin: state.budgetMin,
		elapsedMs,
		remainingMs: budgetMs - elapsedMs,
		withinBudget: elapsedMs <= budgetMs,
		lastDeltaMs,
		laps: state.laps
	};
}

export function resetSprintTimer(rootDir = process.cwd()): void {
	const file = timerPath(rootDir);
	if (existsSync(file)) unlinkSync(file);
}

export function formatDurationCompact(ms: number): string {
	const sign = ms < 0 ? '-' : '';
	const sec = Math.floor(Math.abs(ms) / 1000);
	const m = Math.floor(sec / 60);
	const s = sec % 60;
	return `${sign}${m}m${String(s).padStart(2, '0')}s`;
}

if (import.meta.main) {
	const [, , cmd = 'status', arg = ''] = process.argv;
	if (cmd === 'start') {
		const budget = Number(arg) || DEFAULT_BUDGET_MIN;
		startSprintTimer(budget);
		console.log(`[timer] Started ${budget}m sprint budget clock.`);
	} else if (cmd === 'lap') {
		const s = lapSprintTimer(arg || 'edge-lap');
		console.log(`[timer] Lap "${s.laps[s.laps.length - 1]?.step}" +${formatDurationCompact(s.lastDeltaMs)} | elapsed ${formatDurationCompact(s.elapsedMs)} / ${s.budgetMin}m | remaining ${formatDurationCompact(s.remainingMs)}`);
		process.exit(s.withinBudget ? 0 : 1);
	} else if (cmd === 'reset') {
		resetSprintTimer();
		console.log('[timer] Sprint timer cleared.');
	} else {
		const s = getSprintTimerStatus();
		console.log(JSON.stringify({ ...s, elapsed: formatDurationCompact(s.elapsedMs), remaining: formatDurationCompact(s.remainingMs) }, null, '\t'));
		process.exit(s.withinBudget ? 0 : 1);
	}
}
