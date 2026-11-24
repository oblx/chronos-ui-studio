export type HarnessScenarioId = 'calm-density' | 'wireframe-cs6' | 'spotlight-tour' | 'assistant-dock' | 'station-preview' | 'field-tome' | 'persistence' | 'responsive';

export const ALL_HARNESS_SCENARIOS: readonly HarnessScenarioId[] = [
	'calm-density', 'wireframe-cs6', 'spotlight-tour', 'assistant-dock', 'station-preview', 'field-tome', 'persistence', 'responsive'
] as const;

export const SCENARIO_SCRIPTS: Readonly<Record<HarnessScenarioId, string>> = {
	'calm-density': `async (page) => {
		const root = page.locator('[data-layout-density]').first();
		await root.waitFor({ state: 'visible', timeout: 8000 });
		if ((await root.getAttribute('data-studio-chrome')) !== 'false') throw new Error('Expected Minimal Calm launch on boot');
		const calmRightBtns = await page.locator('[data-testid="calm-top-right"] button').count();
		if (calmRightBtns > 5) throw new Error('Calm top-right controls exceeded 5: ' + calmRightBtns);
		const centerDrift = await page.evaluate(() => { const b = document.querySelector('[data-testid="studio-hud-toggle-btn"]')?.getBoundingClientRect(), tl = document.querySelector('[data-testid="calm-top-left"]')?.getBoundingClientRect(), sv = document.querySelector('[data-testid="workspace-save-btn"]')?.getBoundingClientRect(), rs = document.querySelector('[data-testid="workspace-reset-btn"]')?.getBoundingClientRect(); if (!b || !tl || !sv || !rs) return { drift: 999, clip: 999 }; return { drift: Math.abs(b.left + b.width / 2 - window.innerWidth / 2), clip: Math.max(0, sv.bottom - tl.bottom, rs.bottom - tl.bottom) }; });
		if (centerDrift.drift > 14 || centerDrift.clip > 2) throw new Error('CalmTopStrip alignment/clip failure: ' + JSON.stringify(centerDrift));
		const railCheck = await page.evaluate(() => ['left', 'right'].every((s) => { const r = document.querySelector('[data-testid="edge-rail-' + s + '"]'), hr = r?.querySelector('[data-testid="edge-rail-divider-' + s + '"]'), g = r?.querySelector('[data-testid="edge-grip-' + s + '"]'); return Boolean(r && hr && g && hr.nextElementSibling === g && !g.nextElementSibling); }));
		if (!railCheck || (await page.locator('[data-testid="staging-build-layer"]').count()) !== 0) throw new Error('Edge-rail grouping or fresh-boot staging check failed');
		await page.locator('[data-testid="edge-rail-toggle-right"]').first().hover({ force: true }); await page.waitForTimeout(120);
		const tipGap = await page.evaluate(() => { const tip = document.querySelector('[data-testid="ui-cyber-tooltip"]')?.getBoundingClientRect(), rl = document.querySelector('[data-testid="edge-rail-right"]')?.getBoundingClientRect(); return tip && rl ? Math.round(rl.left - tip.right) : 999; });
		if (tipGap < 0 || tipGap > 36) throw new Error('Right-rail tooltip displaced from rail: gap=' + tipGap);
		const baseStageW = await page.evaluate(() => Math.round(document.querySelector('[data-ui-stage-viewport]')?.getBoundingClientRect().width || 0));
		await page.locator('[data-testid="edge-rail-tab-left-build"]').first().click({ force: true }); await page.waitForTimeout(160);
		if ((await page.locator('[data-testid="edge-drawer-left"] [data-testid="studio-tool-palette"]').count()) < 1 || (await root.getAttribute('data-studio-chrome')) !== 'false') throw new Error('LEFT_EDGE Build mount/Calm invariant broken');
		const leftOpenStageW = await page.evaluate(() => Math.round(document.querySelector('[data-ui-stage-viewport]')?.getBoundingClientRect().width || 0));
		if (Math.abs(leftOpenStageW - baseStageW) > 1) throw new Error('LEFT_EDGE drawer changed workspace width: ' + baseStageW + ' -> ' + leftOpenStageW);
		await page.locator('[data-testid="edge-rail-tab-right-themes"]').first().click({ force: true }); await page.waitForTimeout(180);
		const rightOverlay = await page.evaluate(() => { const stW = Math.round(document.querySelector('[data-ui-stage-viewport]')?.getBoundingClientRect().width || 0), dr = document.querySelector('[data-testid="edge-drawer-right"]')?.getBoundingClientRect(), rl = document.querySelector('[data-testid="edge-rail-right"]')?.getBoundingClientRect(); return { stW, railGap: dr && rl ? Math.round(Math.abs(rl.left - dr.right)) : 999 }; });
		if (Math.abs(rightOverlay.stW - baseStageW) > 1 || rightOverlay.railGap > 16) throw new Error('RIGHT_EDGE drawer broke overlay invariance: ' + JSON.stringify({ baseStageW, rightOverlay }));
		const wcagClip = await page.evaluate(() => { const b = document.querySelector('[data-testid="edge-drawer-body-right"]'); if (!b) return 999; b.scrollTop = b.scrollHeight; const rows = b.querySelectorAll('[data-testid="wcag-audit-row"]'); const last = rows[rows.length - 1]; return last ? Math.max(0, last.getBoundingClientRect().bottom - b.getBoundingClientRect().bottom) : 999; });
		if (wcagClip > 2) throw new Error('RIGHT_EDGE WCAG audit row clipped by ' + wcagClip + 'px');
		await page.locator('[data-testid="edge-rail-toggle-left"]').first().click({ force: true }); await page.locator('[data-testid="edge-rail-toggle-right"]').first().click({ force: true }); await page.waitForTimeout(140);
		const marginPan = await page.evaluate(() => { const s = document.querySelector('[data-ui-stage-viewport]'); const before = s?.getAttribute('data-camera-x') || '0'; const el = document.elementFromPoint(12, window.innerHeight - 10); return { before, insideStage: Boolean(el?.closest('[data-ui-stage-viewport]')) }; });
		await page.mouse.move(12, 890); await page.mouse.down(); await page.mouse.move(160, 890, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(120);
		if (marginPan.insideStage || (await page.locator('[data-ui-stage-viewport]').first().getAttribute('data-camera-x')) !== marginPan.before) throw new Error('Outer margin leaked stage pan');
		const cursorBefore = await page.evaluate(async () => { const cur = getComputedStyle(document.body).cursor; const m = cur.match(/url\\("?(data:image\\/svg\\+xml,[^"\\)]+)"?\\)/); if (!m) throw new Error('Body cursor missing SVG data URL: ' + cur); if (m[1].includes('var(--')) throw new Error('Unresolved var(-- in cursor SVG'); const img = new Image(); img.src = m[1]; await img.decode(); return { w: img.naturalWidth, h: img.naturalHeight, uri: m[1] }; });
		if (cursorBefore.w !== 32 || cursorBefore.h !== 32) throw new Error('Cursor SVG decoded wrong size: ' + JSON.stringify(cursorBefore));
		await page.locator('[data-testid="calm-toggle-polarity"]').first().click({ force: true }); await page.waitForTimeout(140);
		if ((await page.evaluate(() => getComputedStyle(document.body).cursor)).includes(cursorBefore.uri)) throw new Error('Cursor SVG did not live-update on polarity toggle');
		await page.locator('[data-testid="calm-toggle-polarity"]').first().click({ force: true }); await page.waitForTimeout(120);
		await page.locator('[data-testid="starter-sample-chips"] button').first().click({ force: true }); await page.waitForTimeout(420);
		const calmStage = await page.evaluate(() => { const s = document.querySelector('[data-ui-stage-viewport]')?.getBoundingClientRect(), d = document.querySelector('[data-testid="client-document-root"]')?.getBoundingClientRect(), t = document.querySelector('[data-testid="studio-hud-toggle-btn"]')?.getBoundingClientRect(); if (!s || !d || !t) return null; return { cx: d.left + d.width / 2, cy: d.top + d.height / 2, topClip: Math.max(0, s.top - d.top), rightClip: Math.max(0, d.right - s.right), tx: t.left + t.width / 2, ty: t.top + t.height / 2 }; });
		await page.locator('[data-testid="studio-hud-toggle-btn"]').first().click({ force: true }); await page.waitForTimeout(320);
		const hudStage = await page.evaluate(() => { const s = document.querySelector('[data-ui-stage-viewport]')?.getBoundingClientRect(), d = document.querySelector('[data-testid="client-document-root"]')?.getBoundingClientRect(), t = document.querySelector('[data-testid="calm-view-toggle-btn"]')?.getBoundingClientRect(), r = document.querySelector('[data-testid="top-left-pod"] [data-testid="workspace-reset-btn"]'); if (!s || !d || !t) return null; return { cx: d.left + d.width / 2, cy: d.top + d.height / 2, topClip: Math.max(0, s.top - d.top), rightClip: Math.max(0, d.right - s.right), tx: t.left + t.width / 2, ty: t.top + t.height / 2, resetText: (r?.textContent || '').trim() }; });
		const dx = calmStage && hudStage ? Math.abs(calmStage.cx - hudStage.cx) : 999, dy = calmStage && hudStage ? Math.abs(calmStage.cy - hudStage.cy) : 999;
		const tdx = calmStage && hudStage ? Math.abs(calmStage.tx - hudStage.tx) : 999, tdy = calmStage && hudStage ? Math.abs(calmStage.ty - hudStage.ty) : 999;
		if (!calmStage || !hudStage || calmStage.topClip > 4 || hudStage.topClip > 4 || hudStage.rightClip > 4 || dx > 12 || dy > 16 || tdx > 16 || tdy > 8 || hudStage.resetText !== 'Reset') throw new Error('Stage/Toggle/Lifecycle violation: ' + JSON.stringify({ calmStage, hudStage, dx, dy, tdx, tdy }));
		const twinClip = await page.evaluate(() => { const bar = document.querySelector('[data-testid="zone-top-center"]'); const btn = bar ? [...bar.querySelectorAll('button')].find((b) => (b.textContent || '').includes('Twin MCP')) : null; if (!btn || !bar) return 999; const br = btn.getBoundingClientRect(), pr = btn.parentElement?.getBoundingClientRect(); return Math.max(btn.scrollWidth - btn.clientWidth, pr ? Math.ceil(br.right - pr.right) : 0); });
		if (twinClip > 1) throw new Error('Twin MCP button truncated by ' + twinClip + 'px');
		await page.locator('[data-testid="client-document-root"] [data-testid^="live-node-"]').first().click({ position: { x: 8, y: 8 }, force: true }); await page.waitForTimeout(160);
		if ((await page.locator('[data-testid="edge-drawer-right"] [data-testid="node-inspector-panel"]').count()) < 1) throw new Error('Canvas node click did not open RIGHT_EDGE Inspector');
		await page.locator('[data-testid="edge-rail-toggle-right"]').first().click({ force: true }); await page.waitForTimeout(120);
		return { calmRightBtns, wcagClip, centerDrift: Math.round(centerDrift.drift), topClip: Math.round(centerDrift.clip), tipGap, cursorPx: cursorBefore.w, dx: Math.round(dx), dy: Math.round(dy), tdx: Math.round(tdx), tdy: Math.round(tdy), twinClip };
	}`,
	'wireframe-cs6': `async (page) => {
		const root = page.locator('[data-layout-density]').first();
		if ((await root.getAttribute('data-studio-chrome')) !== 'true') { await page.locator('[data-testid="studio-hud-toggle-btn"]').first().click({ force: true }); await page.waitForTimeout(260); }
		await page.locator('[data-testid="zone-bottom-right"] [data-testid="radar-open-skeleton"]').first().click({ force: true }); await page.locator('[data-testid="wireframe-skeleton-modal"]').first().waitFor({ state: 'visible', timeout: 8000 });
		const panels = await Promise.all(['wf-toolbox', 'wf-artboard', 'wf-right-stack', 'wf-status-strip'].map((id) => page.locator('[data-testid="' + id + '"]').count()));
		if (panels.some((c) => c < 1)) throw new Error('Missing CS6 panel(s): ' + JSON.stringify(panels));
		const beforeBox = await page.locator('[data-testid="modal-shell-box"]').first().boundingBox();
		await page.locator('[data-testid="modal-expand-btn"]').first().click({ force: true }); await page.waitForTimeout(760);
		const expandedAttr = await page.locator('[role="dialog"]').first().getAttribute('data-modal-expanded'), expandedBox = await page.locator('[data-testid="modal-shell-box"]').first().boundingBox();
		await page.locator('[data-testid="modal-expand-btn"]').first().click({ force: true }); await page.waitForTimeout(760);
		const restoredBox = await page.locator('[data-testid="modal-shell-box"]').first().boundingBox();
		if (expandedAttr !== 'true' || !beforeBox || !expandedBox || !restoredBox || expandedBox.width <= beforeBox.width || Math.abs(beforeBox.width - restoredBox.width) > 4) throw new Error('Wireframe modal Grow/Shrink restore mismatch: ' + JSON.stringify({ beforeBox, expandedBox, restoredBox }));
		const labelOverlaps = await page.evaluate(() => { let hits = 0; document.querySelectorAll('[data-testid^="wf-node-"]').forEach((g) => { const texts = [...g.querySelectorAll('text')].map((t) => t.getBoundingClientRect()); for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) if (texts[i].left < texts[j].right && texts[i].right > texts[j].left && texts[i].top < texts[j].bottom && texts[i].bottom > texts[j].top) hits++; }); return hits; });
		if (labelOverlaps > 0) throw new Error('Wireframe node label overlap count=' + labelOverlaps);
		await page.locator('[data-testid="modal-close-btn"]').first().click({ force: true }); await page.locator('[data-testid="wireframe-skeleton-modal"]').first().waitFor({ state: 'detached', timeout: 5000 });
		await page.locator('[data-testid="hud-open-wire"]').first().click({ force: true }); await page.locator('[data-testid="wire-dag-graph"]').first().waitFor({ state: 'visible', timeout: 8000 });
		const dagNodes = await page.locator('[data-dag-node]').count(), filterW = await page.locator('[data-testid="wire-filter-input"]').first().boundingBox();
		if (dagNodes < 15 || !filterW || filterW.width < 220) throw new Error('Wire DAG check failed: nodes=' + dagNodes + ' filterW=' + JSON.stringify(filterW));
		await page.locator('[data-testid="modal-close-btn"]').first().click({ force: true }); await page.locator('[data-testid="wire-dag-graph"]').first().waitFor({ state: 'detached', timeout: 5000 });
		return { panels, labelOverlaps, dagNodes, filterW: Math.round(filterW.width) };
	}`,
	'spotlight-tour': `async (page) => {
		const root = page.locator('[data-layout-density]').first();
		if ((await root.getAttribute('data-studio-chrome')) !== 'true') { await page.locator('[data-testid="studio-hud-toggle-btn"]').first().click({ force: true }); await page.waitForTimeout(260); }
		await page.locator('[data-testid="hud-tour-btn"]').first().click({ force: true });
		const veil = page.locator('[data-testid="spotlight-veil"]').first();
		await veil.waitFor({ state: 'visible', timeout: 8000 });
		let step4Drill = false;
		for (let i = 0; i < 7; i++) {
			const txt = (await veil.textContent()) || '';
			if (!txt.includes('Step ' + (i + 1) + ' of 7')) throw new Error('Expected Step ' + (i + 1) + ' of 7, got: ' + txt);
			if (i === 3) step4Drill = (await veil.locator('[data-testid="tour-drill-btn"]').count()) > 0;
			if ((await veil.locator('rect, polygon, path').count()) < 2) throw new Error('Spotlight cutout missing at step ' + (i + 1));
			await veil.locator('button').last().click({ force: true }); await page.waitForTimeout(180);
		}
		if (!step4Drill) throw new Error('Tour Step 4 missing assistant drill CTA');
		return { stepsVerified: 7, step4Drill };
	}`,
	'assistant-dock': `async (page) => {
		const submitBtn = page.locator('[data-testid="assistant-submit-btn"]').first(), input = page.locator('[data-testid="assistant-prompt-input"]').first();
		await submitBtn.waitFor({ state: 'visible', timeout: 8000 });
		const borderOverlap = await page.evaluate(() => { const dk = document.querySelector('[data-testid="ui-assistant-dock"]')?.getBoundingClientRect(), bd = document.querySelector('[data-testid="world-canvas-border"]')?.getBoundingClientRect(); return dk && bd ? Math.max(0, bd.bottom - dk.top) : 0; });
		if (borderOverlap > 4) throw new Error('UiAssistantDock overlapped WORLD_CANVAS bottom border by ' + borderOverlap + 'px');
		const grip = page.locator('[data-testid="assistant-drag-grip"]').first();
		await grip.click({ force: true }); await page.waitForTimeout(180);
		if ((await page.locator('[data-dock-mode="FLOATING"]').count()) < 1) throw new Error('Grip click did not detach to FLOATING');
		await grip.click({ force: true }); await page.waitForTimeout(180);
		if ((await page.locator('[data-dock-mode="DOCKED"]').count()) < 1) throw new Error('Second grip click did not re-dock');
		await input.fill('Add a telemetry card'); await input.press('Enter');
		await page.waitForFunction(() => (document.querySelector('[data-testid="assistant-submit-btn"]')?.textContent || '').trim() === 'Send', null, { timeout: 6000 });
		await page.locator('[data-testid="staging-build-layer"]').first().waitFor({ state: 'visible', timeout: 6000 });
		const corridor = await page.evaluate(() => { const st = document.querySelector('[data-testid="staging-build-layer"]')?.getBoundingClientRect(), dk = document.querySelector('[data-testid="ui-assistant-dock"]')?.getBoundingClientRect(), bl = document.querySelector('[data-testid="zone-bottom-left"]')?.getBoundingClientRect(), br = document.querySelector('[data-testid="zone-bottom-right"]')?.getBoundingClientRect(); return { dockOverlap: st && dk ? Math.max(0, st.bottom - dk.top) : 0, blOverlap: st && bl ? Math.max(0, st.bottom - bl.top) : 0, brOverlap: st && br ? Math.max(0, st.bottom - br.top) : 0 }; });
		if (corridor.dockOverlap > 2 || corridor.blOverlap > 2 || corridor.brOverlap > 2) throw new Error('Staging layer overlapped dock/HUD: ' + JSON.stringify(corridor));
		await page.locator('[data-testid="staging-reject-all-btn"]').first().click({ force: true });
		await page.locator('[data-testid="staging-build-layer"]').first().waitFor({ state: 'detached', timeout: 3000 });
		return { borderOverlap: Math.round(borderOverlap), corridor, rejectedAll: true };
	}`,
	'station-preview': `async (page) => {
		await page.locator('[data-testid="open-station-btn"]').first().click({ force: true });
		const preview = page.locator('[data-testid="station-live-preview"]').first();
		await preview.waitFor({ state: 'visible', timeout: 8000 });
		const presetCount = await page.locator('[data-testid="station-motion-preset"]').count();
		if (presetCount < 8) throw new Error('Expected 8 motion presets, got ' + presetCount);
		await page.locator('[data-testid="station-corner-ROUND"]').first().click({ force: true }); await page.waitForTimeout(140);
		const cornerAttr = await preview.getAttribute('data-preview-corner');
		if (cornerAttr !== 'ROUND') throw new Error('Station live preview corner mismatch: ' + cornerAttr);
		await page.keyboard.press('Escape'); await preview.waitFor({ state: 'hidden', timeout: 4000 }).catch(() => {}); await page.waitForTimeout(180);
		return { presetCount, cornerAttr };
	}`,
	'field-tome': `async (page) => {
		await page.locator('[data-testid="open-tome-btn"]').first().click({ force: true });
		const book = page.locator('[data-testid="tome-dual-book"]').first();
		await book.waitFor({ state: 'visible', timeout: 8000 });
		const text = (await book.textContent()) || '';
		if (text.includes('Test 3s Zero-CLS Lock') || text.includes('\`')) throw new Error('Invalid Field Tome output');
		const mathCount = await book.locator('math').count();
		if (mathCount < 1) throw new Error('Expected native MathML <math> in Field Tome');
		await page.keyboard.press('ArrowRight'); await page.waitForTimeout(140);
		const folio = (await page.locator('[data-testid="tome-folio-counter"]').first().textContent() || '').trim();
		await page.keyboard.press('Escape'); await page.waitForTimeout(160);
		return { mathCount, folio };
	}`,
	'persistence': `async (page) => {
		const root = page.locator('[data-layout-density]').first(), beforeBuilt = (await page.locator('[data-testid="assistant-submit-btn"]').first().textContent() || '').trim();
		await page.reload({ waitUntil: 'domcontentloaded' }); await root.waitFor({ state: 'visible', timeout: 12000 }); await page.waitForTimeout(500);
		const afterChrome = await root.getAttribute('data-studio-chrome'), afterBuilt = (await page.locator('[data-testid="assistant-submit-btn"]').first().textContent() || '').trim();
		if (afterChrome !== 'false') throw new Error('Cold reload did not boot unconditionally in Calm Mode: ' + afterChrome);
		if (afterBuilt !== beforeBuilt) throw new Error('Build/Send state lost across reload');
		return { afterChrome, afterBuilt };
	}`,
	'responsive': `async (page) => {
		const metrics = await page.evaluate(() => ({ innerW: window.innerWidth, scrollW: document.documentElement.scrollWidth, overflowPx: document.documentElement.scrollWidth - window.innerWidth }));
		if (metrics.overflowPx > 4) throw new Error('Horizontal overflow detected: ' + JSON.stringify(metrics));
		return metrics;
	}`
};
