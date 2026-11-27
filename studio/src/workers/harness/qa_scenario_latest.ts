export const LATEST_SCENARIO_SCRIPT = `async (page) => {
	const root = page.locator('[data-layout-density]').first(); await root.waitFor({ state: 'visible', timeout: 6000 });
	if ((await root.getAttribute('data-studio-chrome')) !== 'false') throw new Error('Expected Calm boot');
	const base = await page.evaluate(async () => {
		const decodeCur = async (el) => {
			const cur = getComputedStyle(el).cursor;
			const m = cur.match(/url\\("?(data:image\\/svg\\+xml,[^"\\)]+)"?\\)/);
			if (!m || m[1].includes('var(--')) throw new Error('Invalid cursor URI: ' + cur);
			const svg = decodeURIComponent(m[1].slice('data:image/svg+xml,'.length));
			const img = new Image(); img.src = m[1]; await img.decode();
			return { uri: m[1], svg, w: img.naturalWidth, h: img.naturalHeight };
		};
		const cDef = await decodeCur(document.body);
		const cPtr = await decodeCur(document.querySelector('[data-testid="studio-hud-toggle-btn"]'));
		const cTxt = await decodeCur(document.querySelector('[data-testid="assistant-prompt-input"]'));
		const cGrab = await decodeCur(document.querySelector('[data-testid="assistant-drag-grip"]'));
		const distinct4 = new Set([cDef.uri, cPtr.uri, cTxt.uri, cGrab.uri]).size === 4;
		const framelessNonDrag = !cDef.svg.includes('data-drag-target-frame') && !cPtr.svg.includes('data-drag-target-frame') && !cTxt.svg.includes('data-drag-target-frame');
		const undo = document.querySelector('[data-testid="workspace-undo-btn"]'), redo = document.querySelector('[data-testid="workspace-redo-btn"]');
		return {
			sb: getComputedStyle(document.documentElement).scrollbarWidth,
			undoDisabled: undo?.hasAttribute('disabled'), redoDisabled: redo?.hasAttribute('disabled'),
			all32: [cDef, cPtr, cTxt, cGrab].every((c) => c.w === 32 && c.h === 32), distinct4, framelessNonDrag
		};
	});
	if (!base.undoDisabled || !base.redoDisabled || !base.all32 || !base.distinct4 || !base.framelessNonDrag || base.sb !== 'thin') {
		throw new Error('Base v0.1.2 check failed: ' + JSON.stringify(base));
	}
	await page.locator('[data-testid="open-tome-btn"]').first().click({ force: true });
	const ch3Btn = page.locator('[data-testid="tome-toc-ch-3"]').first(); await ch3Btn.waitFor({ state: 'visible', timeout: 5000 });
	await ch3Btn.hover({ force: true }); await page.waitForTimeout(120);
	const tomeAudit = await page.evaluate(() => {
		const btn = document.querySelector('[data-testid="tome-toc-ch-3"]');
		const wrap = btn?.querySelector('.ui-marquee-wrap');
		const track = btn?.querySelector('.ui-marquee-track');
		const btnR = btn.getBoundingClientRect(), wrapR = wrap.getBoundingClientRect();
		const shift = parseFloat(getComputedStyle(wrap).getPropertyValue('--ui-marquee-shift') || '0');
		return { clippedClean: wrapR.right <= btnR.right + 1, hasTrack: Boolean(track), shiftPx: shift, overflowAttr: wrap.getAttribute('data-overflow') };
	});
	if (!tomeAudit.clippedClean || !tomeAudit.hasTrack || tomeAudit.shiftPx >= 0) {
		throw new Error('Field Tome Ch3 TOC marquee/overflow audit failed: ' + JSON.stringify(tomeAudit));
	}
	const closeBtn = page.locator('[data-testid="modal-close-btn"]:not([disabled])').first();
	await closeBtn.waitFor({ state: 'visible', timeout: 5000 });
	await closeBtn.click({ force: true });
	await page.locator('[role="dialog"]').first().waitFor({ state: 'detached', timeout: 4000 });
	await page.locator('[data-testid="assistant-prompt-input"]').first().fill('add a live event graph with hexagon nodes');
	await page.locator('[data-testid="assistant-submit-btn"]').first().click({ force: true });
	await page.locator('[data-testid="staging-commit-all-btn"]').first().waitFor({ state: 'visible', timeout: 5000 });
	await page.locator('[data-testid="staging-commit-all-btn"]').first().click({ force: true });
	await page.locator('[data-testid="client-document-root"] [data-testid^="live-event-graph-"]').first().waitFor({ state: 'visible', timeout: 5000 });
	await page.waitForFunction(() => !document.querySelector('[data-testid="workspace-undo-btn"]')?.hasAttribute('disabled'), null, { timeout: 3000 });
	await page.locator('[data-testid="studio-hud-toggle-btn"]').first().click({ force: true });
	await page.locator('[data-testid="calm-view-toggle-btn"]').first().waitFor({ state: 'visible', timeout: 4000 });
	await page.locator('[data-testid="zone-bottom-left"]').first().waitFor({ state: 'visible', timeout: 4000 });
	const hudAudit = await page.evaluate(() => {
		const pod = document.querySelector('[data-testid="top-left-pod"]');
		const resetBtn = pod?.querySelector('[data-testid="workspace-reset-btn"]');
		const podR = pod.getBoundingClientRect(), rstR = resetBtn.getBoundingClientRect();
		const wireText = document.querySelector('[data-testid="zone-bottom-left"]')?.textContent || '';
		return {
			resetInsidePod: rstR.right <= podR.right + 1,
			resetNotSliced: resetBtn.scrollWidth <= resetBtn.clientWidth + 2,
			hasZeroMs: /\\b0\\.0ms\\b/.test(wireText)
		};
	});
	if (!hudAudit.resetInsidePod || !hudAudit.resetNotSliced || hudAudit.hasZeroMs) {
		throw new Error('TOP_LEFT zero-clip or truthful sub-ms audit failed: ' + JSON.stringify(hudAudit));
	}
	await page.locator('[data-testid="hud-open-wire"]').first().click({ force: true });
	await page.locator('[data-testid="wire-observatory-root"] [data-testid="wire-dag-graph"]').first().waitFor({ state: 'visible', timeout: 5000 });
	const wireBefore = await page.evaluate(() => {
		const rootEl = document.querySelector('[data-testid="wire-observatory-root"]');
		const hdrs = [...rootEl.querySelectorAll('[data-graph-lane-header]')].map((el) => el.getBoundingClientRect());
		const nodes = [...rootEl.querySelectorAll('[data-graph-node]')].map((el) => el.getBoundingClientRect());
		const maxHdrBottom = Math.max(...hdrs.map((r) => r.bottom));
		const minNodeTop = Math.min(...nodes.map((r) => r.top));
		const pkts = [...rootEl.querySelectorAll('[data-testid="graph-packet"]')];
		const scaledMs = Number(pkts[0]?.getAttribute('data-scaled-ms') || '0');
		return { hdrCount: hdrs.length, nodeCount: nodes.length, zeroHeaderOverlap: maxHdrBottom <= minNodeTop + 0.5, scaledMs };
	});
	if (!wireBefore.zeroHeaderOverlap || wireBefore.hdrCount < 3 || wireBefore.nodeCount < 6) {
		throw new Error('Wire Observatory UiEventGraph geometry failed: ' + JSON.stringify(wireBefore));
	}
	await page.locator('[data-testid="wire-timescale-slider"]').first().evaluate((el) => { el.value = '10000'; el.dispatchEvent(new Event('input', { bubbles: true })); });
	await page.waitForTimeout(160);
	const wireAfter = await page.evaluate(() => {
		const rootEl = document.querySelector('[data-testid="wire-observatory-root"]');
		const pkts = [...rootEl.querySelectorAll('[data-testid="graph-packet"]')];
		return { readout: rootEl.querySelector('[data-testid="wire-timescale-readout"]')?.textContent || '', scaledMs: Number(pkts[0]?.getAttribute('data-scaled-ms') || '0') };
	});
	if (!wireAfter.readout.includes('10,000x') || (wireBefore.scaledMs > 0 && wireAfter.scaledMs <= wireBefore.scaledMs)) {
		throw new Error('Wire Time-Scale live scaling failed: ' + JSON.stringify({ wireBefore, wireAfter }));
	}
	await page.locator('[data-testid="modal-close-btn"]').first().click({ force: true });
	await page.locator('[role="dialog"]').first().waitFor({ state: 'detached', timeout: 3000 });
	await page.locator('[data-testid="studio-view-MCP_TWIN"]').first().click({ force: true });
	await page.locator('[data-testid="twin-mcp-telemetry-card"]').first().waitFor({ state: 'visible', timeout: 3000 });
	await page.waitForFunction(() => (document.querySelector('[data-testid="twin-mcp-telemetry-card"]')?.textContent || '').includes('50 TOOLS'), null, { timeout: 3000 });
	return {
		framelessCursors32: base.framelessNonDrag && base.all32,
		tomeCh3Marquee: tomeAudit,
		topLeftZeroClip: hudAudit,
		wireGraphZeroOverlap: wireBefore.zeroHeaderOverlap,
		timeScaleScaled: { beforeMs: wireBefore.scaledMs, afterMs: wireAfter.scaledMs },
		liveCanvasGraphSpawned: true,
		mcpSynced50: true
	};
}`;
