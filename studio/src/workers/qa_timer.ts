import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type SprintTimeBand = 'GREEN' | 'AMBER' | 'FREEZE_SCOPE' | 'HARD_STOP';

export interface SprintLap { readonly step: string; readonly atMs: number; readonly deltaMs: number; readonly elapsedMs: number; readonly band: SprintTimeBand; }
export interface SprintTimerState { readonly startedAtMs: number; readonly budgetMin: number; readonly laps: readonly SprintLap[]; }
export interface SprintTimerSummary {
	readonly active: boolean; readonly budgetMin: number; readonly freezeMin: number; readonly hardCapMin: number;
	readonly elapsedMs: number; readonly remainingMs: number; readonly remainingFreezeMs: number; readonly remainingHardMs: number;
	readonly band: SprintTimeBand; readonly withinBudget: boolean; readonly withinHardCap: boolean;
	readonly lastDeltaMs: number; readonly laps: readonly SprintLap[];
}

export const SPRINT_TIME_BANDS = { SOFT_TARGET_MIN: 25, FREEZE_SCOPE_MIN: 32, HARD_STOP_MIN: 38, HARD_CEILING_MIN: 38 } as const;

const MIN_ALLOWED_MIN = 1;
const MAX_ALLOWED_MIN = 120;
const MS_PER_MIN = 60000;
const TIMER_REL = 'studio/data/.sprint-timer.json';
const timerPath = (rootDir = process.cwd()): string => join(rootDir, TIMER_REL);

export function classifySprintTimeBand(elapsedMs: number): SprintTimeBand {
	const mins = elapsedMs / MS_PER_MIN;
	if (mins >= SPRINT_TIME_BANDS.HARD_STOP_MIN) return 'HARD_STOP';
	if (mins >= SPRINT_TIME_BANDS.FREEZE_SCOPE_MIN) return 'FREEZE_SCOPE';
	if (mins >= SPRINT_TIME_BANDS.SOFT_TARGET_MIN) return 'AMBER';
	return 'GREEN';
}

function readState(rootDir = process.cwd()): SprintTimerState | null {
	const file = timerPath(rootDir);
	if (!existsSync(file)) return null;
	try { return JSON.parse(readFileSync(file, 'utf8')) as SprintTimerState; } catch { return null; }
}

function writeState(state: SprintTimerState, rootDir = process.cwd()): void {
	mkdirSync(join(rootDir, 'studio/data'), { recursive: true });
	writeFileSync(timerPath(rootDir), JSON.stringify(state, null, '\t'), 'utf8');
}

export function startSprintTimer(budgetMin: number = SPRINT_TIME_BANDS.SOFT_TARGET_MIN, rootDir = process.cwd()): SprintTimerState {
	const clamped = Math.max(MIN_ALLOWED_MIN, Math.min(MAX_ALLOWED_MIN, Math.round(budgetMin)));
	const state: SprintTimerState = { startedAtMs: Date.now(), budgetMin: clamped, laps: [] };
	writeState(state, rootDir);
	return state;
}

export function lapSprintTimer(step: string, rootDir = process.cwd()): SprintTimerSummary {
	const state = readState(rootDir) ?? startSprintTimer(SPRINT_TIME_BANDS.SOFT_TARGET_MIN, rootDir);
	const now = Date.now();
	const prevAt = state.laps.length > 0 ? state.laps[state.laps.length - 1].atMs : state.startedAtMs;
	const elapsedMs = Math.max(0, now - state.startedAtMs);
	const lap: SprintLap = { step: step.trim() || `step-${state.laps.length + 1}`, atMs: now, deltaMs: Math.max(0, now - prevAt), elapsedMs, band: classifySprintTimeBand(elapsedMs) };
	writeState({ ...state, laps: [...state.laps, lap] }, rootDir);
	return getSprintTimerStatus(rootDir);
}

export function getSprintTimerStatus(rootDir = process.cwd()): SprintTimerSummary {
	const state = readState(rootDir);
	const softMs = SPRINT_TIME_BANDS.SOFT_TARGET_MIN * MS_PER_MIN;
	const freezeMs = SPRINT_TIME_BANDS.FREEZE_SCOPE_MIN * MS_PER_MIN;
	const hardMs = SPRINT_TIME_BANDS.HARD_STOP_MIN * MS_PER_MIN;
	if (!state) {
		return { active: false, budgetMin: SPRINT_TIME_BANDS.SOFT_TARGET_MIN, freezeMin: SPRINT_TIME_BANDS.FREEZE_SCOPE_MIN, hardCapMin: SPRINT_TIME_BANDS.HARD_STOP_MIN, elapsedMs: 0, remainingMs: softMs, remainingFreezeMs: freezeMs, remainingHardMs: hardMs, band: 'GREEN', withinBudget: true, withinHardCap: true, lastDeltaMs: 0, laps: [] };
	}
	const elapsedMs = Math.max(0, Date.now() - state.startedAtMs);
	const budgetMs = state.budgetMin * MS_PER_MIN;
	const lastDeltaMs = state.laps.length > 0 ? state.laps[state.laps.length - 1].deltaMs : elapsedMs;
	return { active: true, budgetMin: state.budgetMin, freezeMin: SPRINT_TIME_BANDS.FREEZE_SCOPE_MIN, hardCapMin: SPRINT_TIME_BANDS.HARD_STOP_MIN, elapsedMs, remainingMs: budgetMs - elapsedMs, remainingFreezeMs: freezeMs - elapsedMs, remainingHardMs: hardMs - elapsedMs, band: classifySprintTimeBand(elapsedMs), withinBudget: elapsedMs <= budgetMs, withinHardCap: elapsedMs < hardMs, lastDeltaMs, laps: state.laps };
}

export function resetSprintTimer(rootDir = process.cwd()): void {
	const file = timerPath(rootDir);
	if (existsSync(file)) unlinkSync(file);
}

export function formatDurationCompact(ms: number): string {
	const sign = ms < 0 ? '-' : '';
	const sec = Math.floor(Math.abs(ms) / 1000);
	return `${sign}${Math.floor(sec / 60)}m${String(sec % 60).padStart(2, '0')}s`;
}

export function formatClockBanner(prefix = 'clock', rootDir = process.cwd()): string {
	const s = getSprintTimerStatus(rootDir);
	if (!s.active) return `[${prefix}][IDLE] timer inactive (target ${s.budgetMin}m / freeze ${s.freezeMin}m / stop ${s.hardCapMin}m)`;
	const warn = s.band === 'FREEZE_SCOPE' || s.band === 'HARD_STOP' ? ' | ACTION: FREEZE NEW EDITS & VERIFY' : '';
	return `[${prefix}][${s.band}] elapsed ${formatDurationCompact(s.elapsedMs)}/${s.budgetMin}m | freeze-rem ${formatDurationCompact(s.remainingFreezeMs)} | hard-rem ${formatDurationCompact(s.remainingHardMs)}${warn}`;
}

function parsePhaseArg(argv: readonly string[]): string {
	const eq = argv.find((a) => a.startsWith('--phase='));
	if (eq) return eq.slice('--phase='.length);
	const idx = argv.indexOf('--phase');
	if (idx >= 0 && argv[idx + 1]) return argv[idx + 1];
	return argv[3] && !argv[3].startsWith('-') ? argv[3] : 'phase-check';
}

if (import.meta.main) {
	const cmd = process.argv[2] ?? 'status';
	if (cmd === 'start') {
		const budget = Number(process.argv[3]) || SPRINT_TIME_BANDS.SOFT_TARGET_MIN;
		startSprintTimer(budget);
		console.log(`[timer] Started ${budget}m soft / ${SPRINT_TIME_BANDS.FREEZE_SCOPE_MIN}m freeze / ${SPRINT_TIME_BANDS.HARD_STOP_MIN}m hard clock.`);
	} else if (cmd === 'check' || cmd === 'lap') {
		const s = lapSprintTimer(parsePhaseArg(process.argv));
		console.log(`${formatClockBanner(`timer:${s.laps[s.laps.length - 1]?.step ?? 'phase'}`)} (+${formatDurationCompact(s.lastDeltaMs)})`);
		process.exit(s.withinHardCap ? 0 : 1);
	} else if (cmd === 'reset') {
		resetSprintTimer();
		console.log('[timer] Sprint timer cleared.');
	} else {
		const s = getSprintTimerStatus();
		console.log(JSON.stringify({ ...s, banner: formatClockBanner('timer'), elapsed: formatDurationCompact(s.elapsedMs), remaining: formatDurationCompact(s.remainingMs), remainingFreeze: formatDurationCompact(s.remainingFreezeMs), remainingHard: formatDurationCompact(s.remainingHardMs) }, null, '\t'));
		process.exit(s.withinHardCap ? 0 : 1);
	}
}
