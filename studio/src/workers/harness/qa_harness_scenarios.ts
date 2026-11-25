import { LATEST_SCENARIO_SCRIPT } from './qa_scenario_latest';

export type HarnessScenarioId = 'latest' | 'calm-density' | 'wireframe-cs6' | 'spotlight-tour' | 'assistant-dock' | 'station-preview' | 'field-tome' | 'persistence' | 'responsive';

export const ALL_HARNESS_SCENARIOS: readonly HarnessScenarioId[] = ['calm-density', 'wireframe-cs6', 'spotlight-tour', 'assistant-dock', 'station-preview', 'field-tome', 'persistence', 'responsive'] as const;

export const SCENARIO_SCRIPTS: Readonly<Record<HarnessScenarioId, string>> = {
	'latest': LATEST_SCENARIO_SCRIPT,
	'calm-density': `async (page) => {
		const root = page.locator('[data-layout-density]').first(); await root.waitFor({ state: 'visible', timeout: 6000 });
		if ((await root.getAttribute('data-studio-chrome')) !== 'false') throw new Error('Expected Minimal Calm launch on boot');
		const calmRightBtns = await page.locator('[data-testid="calm-top-right"] button').count();
		if (calmRightBtns > 5) throw new Error('Calm top-right controls exceeded 5: ' + calmRightBtns);
		const centerDrift = await page.evaluate(() => { const b = document.querySelector('[data-testid="studio-hud-toggle-btn"]')?.getBoundingClientRect(), tl = document.querySelector('[data-testid="calm-top-left"]')?.getBoundingClientRect(), sv = document.querySelector('[data-testid="workspace-save-btn"]')?.getBoundingClientRect(), rs = document.querySelector('[data-testid="workspace-reset-btn"]')?.getBoundingClientRect(); if (!b || !tl || !sv || !rs) return { drift: 999, clip: 999 }; return { drift: Math.abs(b.left + b.width / 2 - window.innerWidth / 2), clip: Math.max(0, sv.bottom - tl.bottom, rs.bottom - tl.bottom) }; });
		if (centerDrift.drift > 14 || centerDrift.clip > 2) throw new Error('CalmTopStrip alignment/clip failure: ' + JSON.stringify(centerDrift));
		const railCheck = await page.evaluate(() => ['left', 'right'].every((s) => { const r = document.querySelector('[data-testid="edge-rail-' + s + '"]'), hr = r?.querySelector('[data-testid="edge-rail-divider-' + s + '"]'), g = r?.querySelector('[data-testid="edge-grip-' + s + '"]'); return Boolean(r && hr && g && hr.nextElementSibling === g && !g.nextElementSibling); }));
		if (!railCheck || (await page.locator('[data-testid="staging-build-layer"]').count()) !== 0) throw new Error('Edge-rail grouping or fresh-boot staging check failed');
		await page.locator('[data-testid="edge-rail-toggle-right"]').first().hover({ force: true }); await page.locator('[data-testid="ui-cyber-tooltip"]').first().waitFor({ state: 'visible', timeout: 2500 });
		const tipGap = await page.evaluate(() => { const tip = document.querySelector('[data-testid="ui-cyber-tooltip"]')?.getBoundingClientRect(), rl = document.querySelector('[data-testid="edge-rail-right"]')?.getBoundingClientRect(); return tip && rl ? Math.round(rl.left - tip.right) : 999; });
		if (tipGap < 0 || tipGap > 36) throw new Error('Right-rail tooltip displaced: gap=' + tipGap);
		const baseStageW = await page.evaluate(() => Math.round(document.querySelector('[data-ui-stage-viewport]')?.getBoundingClientRect().width || 0));
		await page.locator('[data-testid="edge-rail-tab-left-build"]').first().click({ force: true }); await page.locator('[data-testid="edge-drawer-left"] [data-testid="studio-tool-palette"]').first().waitFor({ state: 'visible', timeout: 3000 });
		const leftOpenStageW = await page.evaluate(() => Math.round(document.querySelector('[data-ui-stage-viewport]')?.getBoundingClientRect().width || 0));
		if (Math.abs(leftOpenStageW - baseStageW) > 1 || (await root.getAttribute('data-studio-chrome')) !== 'false') throw new Error('LEFT_EDGE overlay invariance broken');
		await page.locator('[data-testid="edge-rail-tab-right-themes"]').first().click({ force: true }); await page.locator('[data-testid="edge-drawer-right"]').first().waitFor({ state: 'visible', timeout: 3000 });
		const rightOverlay = await page.evaluate(() => { const stW = Math.round(document.querySelector('[data-ui-stage-viewport]')?.getBoundingClientRect().width || 0), dr = document.querySelector('[data-testid="edge-drawer-right"]')?.getBoundingClientRect(), rl = document.querySelector('[data-testid="edge-rail-right"]')?.getBoundingClientRect(); return { stW, railGap: dr && rl ? Math.round(Math.abs(rl.left - dr.right)) : 999 }; });
		if (Math.abs(rightOverlay.stW - baseStageW) > 1 || rightOverlay.railGap > 16) throw new Error('RIGHT_EDGE overlay invariance broken: ' + JSON.stringify({ baseStageW, rightOverlay }));
		const wcagClip = await page.evaluate(() => { const b = document.querySelector('[data-testid="edge-drawer-body-right"]'); if (!b) return 999; b.scrollTop = b.scrollHeight; const rows = b.querySelectorAll('[data-testid="wcag-audit-row"]'); const last = rows[rows.length - 1]; return last ? Math.max(0, last.getBoundingClientRect().bottom - b.getBoundingClientRect().bottom) : 999; });
		if (wcagClip > 2) throw new Error('RIGHT_EDGE WCAG audit row clipped by ' + wcagClip + 'px');
		await page.locator('[data-testid="edge-rail-toggle-left"]').first().click({ force: true }); await page.locator('[data-testid="edge-rail-toggle-right"]').first().click({ force: true });
		const marginPan = await page.evaluate(() => { const s = document.querySelector('[data-ui-stage-viewport]'); const before = s?.getAttribute('data-camera-x') || '0'; const el = document.elementFromPoint(12, window.innerHeight - 10); return { before, insideStage: Boolean(el?.closest('[data-ui-stage-viewport]')) }; });
		await page.mouse.move(12, 890); await page.mouse.down(); await page.mouse.move(160, 890, { steps: 4 }); await page.mouse.up();
		if (marginPan.insideStage || (await page.locator('[data-ui-stage-viewport]').first().getAttribute('data-camera-x')) !== marginPan.before) throw new Error('Outer margin leaked stage pan');
		const cursorBefore = await page.evaluate(async () => { const cur = getComputedStyle(document.body).cursor; const m = cur.match(/url\\("?(data:image\\/svg\\+xml,[^"\\)]+)"?\\)/); if (!m || m[1].includes('var(--')) throw new Error('Invalid cursor SVG: ' + cur); const img = new Image(); img.src = m[1]; await img.decode(); return { w: img.naturalWidth, h: img.naturalHeight, uri: m[1] }; });
		if (cursorBefore.w !== 32 || cursorBefore.h !== 32) throw new Error('Cursor SVG wrong size');
		await page.locator('[data-testid="calm-toggle-polarity"]').first().click({ force: true }); await page.waitForFunction((u) => !getComputedStyle(document.body).cursor.includes(u), cursorBefore.uri, { timeout: 2500 });
		await page.locator('[data-testid="calm-toggle-polarity"]').first().click({ force: true });
		await page.locator('[data-testid="starter-sample-chips"] button').first().click({ force: true }); await page.locator('[data-testid="client-document-root"] [data-testid^="live-node-"]').first().waitFor({ state: 'visible', timeout: 4000 });
		const calmStage = await page.evaluate(() => { const s = document.querySelector('[data-ui-stage-viewport]')?.getBoundingClientRect(), d = document.querySelector('[data-testid="client-document-root"]')?.getBoundingClientRect(), t = document.querySelector('[data-testid="studio-hud-toggle-btn"]')?.getBoundingClientRect(); if (!s || !d || !t) return null; return { cx: d.left + d.width / 2, cy: d.top + d.height / 2, topClip: Math.max(0, s.top - d.top), rightClip: Math.max(0, d.right - s.right), tl: t.left, tt: t.top }; });
		await page.locator('[data-testid="studio-hud-toggle-btn"]').first().click({ force: true }); await page.locator('[data-testid="calm-view-toggle-btn"]').first().waitFor({ state: 'visible', timeout: 4000 }); await page.waitForTimeout(160);
		const hudStage = await page.evaluate(() => { const s = document.querySelector('[data-ui-stage-viewport]')?.getBoundingClientRect(), d = document.querySelector('[data-testid="client-document-root"]')?.getBoundingClientRect(), t = document.querySelector('[data-testid="calm-view-toggle-btn"]')?.getBoundingClientRect(), r = document.querySelector('[data-testid="top-left-pod"] [data-testid="workspace-reset-btn"]'); if (!s || !d || !t) return null; return { cx: d.left + d.width / 2, cy: d.top + d.height / 2, topClip: Math.max(0, s.top - d.top), rightClip: Math.max(0, d.right - s.right), tl: t.left, tt: t.top, resetText: (r?.textContent || '').trim() }; });
		const dx = calmStage && hudStage ? Math.abs(calmStage.cx - hudStage.cx) : 999, dy = calmStage && hudStage ? Math.abs(calmStage.cy - hudStage.cy) : 999, tdx = calmStage && hudStage ? Math.abs(calmStage.tl - hudStage.tl) : 999, tdy = calmStage && hudStage ? Math.abs(calmStage.tt - hudStage.tt) : 999;
		if (!calmStage || !hudStage || calmStage.topClip > 4 || hudStage.topClip > 4 || hudStage.rightClip > 4 || dx > 12 || dy > 16 || tdx > 16 || tdy > 8 || hudStage.resetText !== 'Reset') throw new Error('Stage/Toggle/Lifecycle violation: ' + JSON.stringify({ dx, dy, tdx, tdy, resetText: hudStage?.resetText }));
		const twinClip = await page.evaluate(() => { const bar = document.querySelector('[data-testid="zone-top-center"]'); const btn = bar ? [...bar.querySelectorAll('button')].find((b) => (b.textContent || '').includes('Twin MCP')) : null; if (!btn || !bar) return 999; const br = btn.getBoundingClientRect(), pr = btn.parentElement?.getBoundingClientRect(); return Math.max(btn.scrollWidth - btn.clientWidth, pr ? Math.ceil(br.right - pr.right) : 0); });
		if (twinClip > 1) throw new Error('Twin MCP truncated by ' + twinClip + 'px');
		await page.locator('[data-testid="client-document-root"] [data-testid^="live-node-"]').first().click({ position: { x: 8, y: 8 }, force: true }); await page.locator('[data-testid="edge-drawer-right"] [data-testid="node-inspector-panel"]').first().waitFor({ state: 'visible', timeout: 3000 });
		await page.locator('[data-testid="edge-rail-toggle-right"]').first().click({ force: true });
		return { calmRightBtns, tipGap, tdx: Math.round(tdx), tdy: Math.round(tdy), dx: Math.round(dx), dy: Math.round(dy), twinClip };
	}`,
	'wireframe-cs6': `async (page) => {
		if ((await page.locator('[data-layout-density]').first().getAttribute('data-studio-chrome')) !== 'true') { await page.locator('[data-testid="studio-hud-toggle-btn"]').first().click({ force: true }); await page.locator('[data-testid="zone-bottom-right"]').first().waitFor({ state: 'visible', timeout: 4000 }); }
		await page.locator('[data-testid="zone-bottom-right"] [data-testid="radar-open-skeleton"]').first().click({ force: true }); await page.locator('[data-testid="wireframe-skeleton-modal"]').first().waitFor({ state: 'visible', timeout: 5000 });
		const panels = await Promise.all(['wf-toolbox', 'wf-artboard', 'wf-right-stack', 'wf-status-strip'].map((id) => page.locator('[data-testid="' + id + '"]').count()));
		if (panels.some((c) => c < 1)) throw new Error('Missing CS6 panel(s)');
		const beforeBox = await page.locator('[data-testid="modal-shell-box"]').first().boundingBox();
		await page.locator('[data-testid="modal-expand-btn"]').first().click({ force: true }); await page.waitForFunction(() => document.querySelector('[role="dialog"]')?.getAttribute('data-modal-expanded') === 'true', null, { timeout: 3000 }); await page.waitForTimeout(620);
		const expandedBox = await page.locator('[data-testid="modal-shell-box"]').first().boundingBox();
		await page.locator('[data-testid="modal-expand-btn"]').first().click({ force: true }); await page.waitForFunction(() => document.querySelector('[role="dialog"]')?.getAttribute('data-modal-expanded') !== 'true', null, { timeout: 3000 }); await page.waitForTimeout(620);
		const restoredBox = await page.locator('[data-testid="modal-shell-box"]').first().boundingBox();
		if (!beforeBox || !expandedBox || !restoredBox || expandedBox.width <= beforeBox.width || Math.abs(beforeBox.width - restoredBox.width) > 4) throw new Error('Modal Grow/Shrink mismatch');
		const labelOverlaps = await page.evaluate(() => { let hits = 0; document.querySelectorAll('[data-testid^="wf-node-"]').forEach((g) => { const ts = [...g.querySelectorAll('text')].map((t) => t.getBoundingClientRect()); for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) if (ts[i].left < ts[j].right && ts[i].right > ts[j].left && ts[i].top < ts[j].bottom && ts[i].bottom > ts[j].top) hits++; }); return hits; });
		if (labelOverlaps > 0) throw new Error('Wireframe label overlap=' + labelOverlaps);
		await page.locator('[data-testid="modal-close-btn"]').first().click({ force: true }); await page.locator('[data-testid="wireframe-skeleton-modal"]').first().waitFor({ state: 'detached', timeout: 4000 });
		await page.locator('[data-testid="hud-open-wire"]').first().click({ force: true }); await page.locator('[data-testid="wire-dag-graph"]').first().waitFor({ state: 'visible', timeout: 5000 });
		const dagNodes = await page.locator('[data-dag-node]').count(), filterW = await page.locator('[data-testid="wire-filter-input"]').first().boundingBox();
		if (dagNodes < 15 || !filterW || filterW.width < 220) throw new Error('Wire DAG check failed');
		await page.locator('[data-testid="modal-close-btn"]').first().click({ force: true }); await page.locator('[data-testid="wire-dag-graph"]').first().waitFor({ state: 'detached', timeout: 4000 });
		return { panels, labelOverlaps, dagNodes };
	}`,
	'spotlight-tour': `async (page) => {
		if ((await page.locator('[data-layout-density]').first().getAttribute('data-studio-chrome')) !== 'true') { await page.locator('[data-testid="studio-hud-toggle-btn"]').first().click({ force: true }); await page.locator('[data-testid="hud-tour-btn"]').first().waitFor({ state: 'visible', timeout: 4000 }); }
		await page.locator('[data-testid="hud-tour-btn"]').first().click({ force: true });
		const veil = page.locator('[data-testid="spotlight-veil"]').first(); await veil.waitFor({ state: 'visible', timeout: 4000 });
		let step4Drill = false;
		for (let i = 0; i < 7; i++) {
			const txt = (await veil.textContent()) || ''; if (!txt.includes('Step ' + (i + 1) + ' of 7')) throw new Error('Expected Step ' + (i + 1));
			if (i === 3) step4Drill = (await veil.locator('[data-testid="tour-drill-btn"]').count()) > 0;
			if ((await veil.locator('rect, polygon, path').count()) < 2) throw new Error('Spotlight cutout missing');
			await veil.locator('button').last().click({ force: true });
		}
		if (!step4Drill) throw new Error('Tour Step 4 missing drill CTA');
		return { stepsVerified: 7, step4Drill };
	}`,
	'assistant-dock': `async (page) => {
		const submitBtn = page.locator('[data-testid="assistant-submit-btn"]').first(), input = page.locator('[data-testid="assistant-prompt-input"]').first(); await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
		const borderOverlap = await page.evaluate(() => { const dk = document.querySelector('[data-testid="ui-assistant-dock"]')?.getBoundingClientRect(), bd = document.querySelector('[data-testid="world-canvas-border"]')?.getBoundingClientRect(); return dk && bd ? Math.max(0, bd.bottom - dk.top) : 0; });
		if (borderOverlap > 4) throw new Error('Dock overlapped border by ' + borderOverlap + 'px');
		const grip = page.locator('[data-testid="assistant-drag-grip"]').first();
		await grip.click({ force: true }); await page.locator('[data-dock-mode="FLOATING"]').first().waitFor({ state: 'visible', timeout: 2500 });
		await grip.click({ force: true }); await page.locator('[data-dock-mode="DOCKED"]').first().waitFor({ state: 'visible', timeout: 2500 });
		await input.fill('Add a telemetry card'); await input.press('Enter');
		await page.waitForFunction(() => (document.querySelector('[data-testid="assistant-submit-btn"]')?.textContent || '').trim() === 'Send', null, { timeout: 5000 });
		await page.locator('[data-testid="staging-build-layer"]').first().waitFor({ state: 'visible', timeout: 5000 });
		await page.locator('[data-testid="staging-reject-all-btn"]').first().click({ force: true }); await page.locator('[data-testid="staging-build-layer"]').first().waitFor({ state: 'detached', timeout: 3000 });
		return { borderOverlap: Math.round(borderOverlap), rejectedAll: true };
	}`,
	'station-preview': `async (page) => {
		await page.locator('[data-testid="open-station-btn"]').first().click({ force: true });
		const preview = page.locator('[data-testid="station-live-preview"]').first(); await preview.waitFor({ state: 'visible', timeout: 5000 });
		const presetCount = await page.locator('[data-testid="station-motion-preset"]').count(); if (presetCount < 8) throw new Error('Expected 8 motion presets');
		await page.locator('[data-testid="station-corner-ROUND"]').first().click({ force: true });
		await page.waitForFunction(() => document.querySelector('[data-testid="station-live-preview"]')?.getAttribute('data-preview-corner') === 'ROUND', null, { timeout: 2500 });
		await page.keyboard.press('Escape'); await preview.waitFor({ state: 'detached', timeout: 3000 }).catch(() => {});
		return { presetCount, cornerAttr: 'ROUND' };
	}`,
	'field-tome': `async (page) => {
		await page.locator('[data-testid="open-tome-btn"]').first().click({ force: true });
		const book = page.locator('[data-testid="tome-dual-book"]').first(); await book.waitFor({ state: 'visible', timeout: 5000 });
		const text = (await book.textContent()) || ''; if (text.includes('Test 3s Zero-CLS Lock') || text.includes('\`')) throw new Error('Invalid Field Tome');
		const mathCount = await book.locator('math').count(); if (mathCount < 1) throw new Error('Expected MathML');
		await page.keyboard.press('ArrowRight'); await page.keyboard.press('Escape'); return { mathCount };
	}`,
	'persistence': `async (page) => {
		const root = page.locator('[data-layout-density]').first(), beforeBuilt = (await page.locator('[data-testid="assistant-submit-btn"]').first().textContent() || '').trim();
		await page.reload({ waitUntil: 'domcontentloaded' }); await root.waitFor({ state: 'visible', timeout: 8000 });
		await page.waitForFunction((exp) => (document.querySelector('[data-testid="assistant-submit-btn"]')?.textContent || '').trim() === exp, beforeBuilt, { timeout: 4000 });
		if ((await root.getAttribute('data-studio-chrome')) !== 'false') throw new Error('Cold reload did not boot Calm');
		return { afterChrome: 'false', afterBuilt: beforeBuilt };
	}`,
	'responsive': `async (page) => { const m = await page.evaluate(() => ({ innerW: window.innerWidth, scrollW: document.documentElement.scrollWidth, overflowPx: document.documentElement.scrollWidth - window.innerWidth })); if (m.overflowPx > 4) throw new Error('Overflow: ' + JSON.stringify(m)); return m; }`
};
