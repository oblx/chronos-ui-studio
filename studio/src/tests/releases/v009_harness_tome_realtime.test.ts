import { describe, expect, test } from 'bun:test';
import { createHeadlessWireBroker, STUDIO_DEFAULTS_VERSION, VERSION } from '@chronos-ui/svelte';
import { findStarterSample, STUDIO_UI_COPY, TOME_SSG_CHAPTERS } from '@studio/config';
import { createInitialStudioState, registerStudioIntentHandlers } from '@studio/client/state';
import { migrateLegacyStudioDefaults } from '@studio/lib';
import { cleanProjectWorkspace } from '@studio/server/routes/routes.lifecycle';
import { createStudioProject } from '@studio/server/routes/routes.projects';
import { broadcastCollabEvent, handleCollabHttp } from '@studio/server/ws.collab';
import { parseInlineTokens, parseMarkdownChapter } from '@studio/workers/compile_tome_ssg';
import { parseHarnessArgs } from '@studio/workers/qa_harness';
import { classifySprintTimeBand, formatClockBanner, SPRINT_TIME_BANDS } from '@studio/workers/qa_timer';

describe('v0.0.9 25m clock guard & zero-screenshot qa:harness CLI', () => {
	test('enforces 25m soft / 32m freeze / 38m hard stop and parses harness CLI flags cleanly', () => {
		expect(VERSION).toBe('0.1.1');
		expect(SPRINT_TIME_BANDS.SOFT_TARGET_MIN).toBe(25);
		expect(SPRINT_TIME_BANDS.FREEZE_SCOPE_MIN).toBe(32);
		expect(SPRINT_TIME_BANDS.HARD_STOP_MIN).toBe(38);
		expect(classifySprintTimeBand(12 * 60_000)).toBe('GREEN');
		expect(classifySprintTimeBand(27 * 60_000)).toBe('AMBER');
		expect(classifySprintTimeBand(34 * 60_000)).toBe('FREEZE_SCOPE');
		expect(classifySprintTimeBand(40 * 60_000)).toBe('HARD_STOP');
		expect(formatClockBanner('qa:harness')).toContain('[qa:harness]');
		const opts = parseHarnessArgs(['--scenario=calm-density,field-tome', '--viewports=1440x900,390x844', '--json', '--fail-fast']);
		expect(opts.scenarios).toEqual(['calm-density', 'field-tome']);
		expect(opts.viewports.length).toBe(2);
		expect(opts.debugCapture).toBe(false);
		expect(opts.json).toBe(true);
	});
});

describe('v0.0.9 reactive density cycling, click-to-dock grip, build->send & realtime collab sync', () => {
	test('UI_SET_LAYOUT_DENSITY mutates chrome/palette/drawers and UI_ASSISTANT_TOGGLE_FLOAT toggles DOCKED<->FLOATING', () => {
		const broker = createHeadlessWireBroker(createInitialStudioState());
		registerStudioIntentHandlers(broker);
		expect(broker.state.layoutDensity).toBe('CALM');
		expect(broker.state.studioChromeVisible).toBe(false);
		broker.dispatch('UI_SET_LAYOUT_DENSITY', { density: 'BALANCED' });
		expect(broker.state.studioChromeVisible).toBe(true);
		expect(broker.state.toolPaletteOpen).toBe(false);
		expect(broker.state.leftDrawer.open).toBe(false);
		broker.dispatch('UI_SET_LAYOUT_DENSITY', { density: 'TACTICAL' });
		expect(broker.state.studioChromeVisible).toBe(true);
		expect(broker.state.leftDrawer.open).toBe(true);
		expect(broker.state.rightDrawer.open).toBe(true);
		broker.dispatch('UI_SET_LAYOUT_DENSITY', { density: 'CALM' });
		expect(broker.state.studioChromeVisible).toBe(false);
		expect(broker.state.leftDrawer.open).toBe(false);
		broker.dispatch('UI_ASSISTANT_TOGGLE_FLOAT', { rect: { left: 320, top: 760, width: 640, height: 64 } });
		expect(broker.state.assistantDock.mode).toBe('FLOATING');
		broker.dispatch('UI_ASSISTANT_TOGGLE_FLOAT', {});
		expect(broker.state.assistantDock.mode).toBe('DOCKED');
		broker.dispatch('UI_ASSISTANT_SUBMIT', { projectId: broker.state.activeProjectId });
		expect(broker.state.projects[0]?.hasBuiltOnce).toBe(true);
		broker.destroy();
	});

	test('broadcasts realtime events to remote sessions and resets hasBuiltOnce on workspace clean', async () => {
		await handleCollabHttp(
			new Request('http://localhost:3000/api/ws/collab', {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId: 'peer-agent-1', label: 'Remote Peer', activePointer: true })
			}),
			'/api/ws/collab'
		);
		const sent = broadcastCollabEvent('UI_SET_LAYOUT_DENSITY', { density: 'TACTICAL' }, 'peer-local-1');
		expect(sent).toBeGreaterThanOrEqual(1);
		const pollRes = await handleCollabHttp(new Request('http://localhost:3000/api/ws/collab?sessionId=peer-agent-1'), '/api/ws/collab');
		const pollJson = (await pollRes!.json()) as { commands: Array<{ kind: string }> };
		expect(pollJson.commands.some((c) => c.kind === 'UI_SET_LAYOUT_DENSITY')).toBe(true);
		const created = await createStudioProject({ name: 'Build Once Check' });
		expect(created.hasBuiltOnce).toBe(false);
		const cleaned = await cleanProjectWorkspace(created.id);
		expect(cleaned.project.hasBuiltOnce).toBe(false);
	});
});

describe('v0.0.9 AST Field Tome compiler, legacy 0.75rem auto-migration & Bio-Lab MathML', () => {
	test('compiles markdown into typed AST blocks without raw backticks or duplicated intro paragraphs', () => {
		expect(TOME_SSG_CHAPTERS.length).toBe(6);
		const tokens = parseInlineTokens('Use `createUiWireBroker` with **strict** $C \\ge 4.5$ contrast.');
		expect(tokens.some((t) => t.kind === 'code' && t.text === 'createUiWireBroker')).toBe(true);
		expect(tokens.some((t) => t.kind === 'strong' && t.text === 'strict')).toBe(true);
		expect(tokens.some((t) => t.kind === 'math' && t.text.includes('4.5'))).toBe(true);
		const parsed = parseMarkdownChapter('01_architecture', '# Chapter 1: Test\n\nIntro summary line.\n\n## Matrix\n\n- **A:** `code`\n\n| Col1 | Col2 |\n|---|---|\n| `x` | **y** |', 1);
		expect(parsed.summary).toBe('Intro summary line.');
		expect(parsed.pages.length).toBeGreaterThanOrEqual(1);
		const pageText = JSON.stringify(parsed.pages);
		expect(pageText).not.toContain('Intro summary line.');
		expect(pageText).not.toContain('`code`');
		expect(pageText).toContain('"kind":"table"');
	});

	test('auto-migrates legacy 0.75rem defaults to 0.5rem (defaultsVersion=2) and verifies Bio-Lab MathML & UI copy', () => {
		const migrated = migrateLegacyStudioDefaults(undefined, 0.75);
		expect(migrated.baseCornerCutRem).toBe(0.5);
		expect(migrated.stationCornerCutRem).toBe(0.75);
		expect(migrated.controlCornerCutRem).toBe(0.3125);
		expect(migrated.defaultsVersion).toBe(STUDIO_DEFAULTS_VERSION);
		const explicitUser = migrateLegacyStudioDefaults({ defaultsVersion: 2, baseCornerCutRem: 0.75 }, 0.75);
		expect(explicitUser.baseCornerCutRem).toBe(0.75);
		const bioLab = findStarterSample('sample-bio-lab');
		const mathNode = bioLab?.nodes.find((n) => n.type === 'UiMathFormula');
		expect(mathNode?.props.rhs).toBe('N_0 e^{rt}');
		expect(STUDIO_UI_COPY.quickActions.length).toBe(4);
	});
});
