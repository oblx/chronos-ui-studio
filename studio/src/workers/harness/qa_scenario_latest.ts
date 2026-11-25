export const LATEST_SCENARIO_SCRIPT = `async (page) => {
	const root = page.locator('[data-layout-density]').first(); await root.waitFor({ state: 'visible', timeout: 6000 });
	if ((await root.getAttribute('data-studio-chrome')) !== 'false') throw new Error('Expected Calm boot');
	const base = await page.evaluate(async () => {
		const decodeCur = async (el) => {
			const cur = getComputedStyle(el).cursor;
			const m = cur.match(/url\\("?(data:image\\/svg\\+xml,[^"\\)]+)"?\\)/);
			if (!m || m[1].includes('var(--')) throw new Error('Invalid cursor URI: ' + cur);
			const img = new Image(); img.src = m[1]; await img.decode();
			return { uri: m[1], w: img.naturalWidth, h: img.naturalHeight };
		};
		const cDef = await decodeCur(document.body);
		const cPtr = await decodeCur(document.querySelector('[data-testid="studio-hud-toggle-btn"]'));
		const cTxt = await decodeCur(document.querySelector('[data-testid="assistant-prompt-input"]'));
		const cGrab = await decodeCur(document.querySelector('[data-testid="assistant-drag-grip"]'));
		const distinct4 = new Set([cDef.uri, cPtr.uri, cTxt.uri, cGrab.uri]).size === 4;
		const undo = document.querySelector('[data-testid="workspace-undo-btn"]'), redo = document.querySelector('[data-testid="workspace-redo-btn"]');
		return {
			sb: getComputedStyle(document.documentElement).scrollbarWidth,
			undoDisabled: undo?.hasAttribute('disabled'), redoDisabled: redo?.hasAttribute('disabled'),
			all32: [cDef, cPtr, cTxt, cGrab].every((c) => c.w === 32 && c.h === 32), distinct4
		};
	});
	if (!base.undoDisabled || !base.redoDisabled || !base.all32 || !base.distinct4 || base.sb !== 'thin') throw new Error('Base v0.1.1 check failed: ' + JSON.stringify(base));
	await page.locator('[data-testid="assistant-unfold-trigger"]').first().click({ force: true });
	const dockUndoDisabled = await page.locator('[data-testid="assistant-undo-btn"]').first().isDisabled();
	const dockRedoDisabled = await page.locator('[data-testid="assistant-redo-btn"]').first().isDisabled();
	if (!dockUndoDisabled || !dockRedoDisabled) throw new Error('Expected Assistant Dock Undo/Redo disabled initially');
	await page.locator('[data-testid="assistant-collapse-trigger"]').first().click({ force: true });
	await page.waitForFunction(() => (document.querySelector('[data-testid="ui-assistant-dock"]')?.getBoundingClientRect().height || 999) < 84, null, { timeout: 2500 });
	await page.locator('[data-testid="starter-sample-chips"] button').first().click({ force: true });
	await page.locator('[data-testid="client-document-root"] [data-testid^="live-node-"]').first().waitFor({ state: 'visible', timeout: 4000 });
	await page.waitForFunction(() => !document.querySelector('[data-testid="workspace-undo-btn"]')?.hasAttribute('disabled'), null, { timeout: 3000 });
	await page.locator('[data-testid="workspace-undo-btn"]').first().click({ force: true });
	await page.waitForFunction(() => !document.querySelector('[data-testid="workspace-redo-btn"]')?.hasAttribute('disabled'), null, { timeout: 3000 });
	await page.locator('[data-testid="workspace-redo-btn"]').first().click({ force: true });
	await page.locator('[data-testid="client-document-root"] [data-testid^="live-node-"]').first().waitFor({ state: 'visible', timeout: 3000 });
	await page.locator('[data-testid="calm-open-settings"]').first().click({ force: true });
	const dlg = page.locator('[role="dialog"][data-modal-phase]').first(); await dlg.waitFor({ state: 'visible', timeout: 8000 });
	await page.waitForFunction(() => document.querySelector('[role="dialog"]')?.getAttribute('data-modal-phase') === 'OPEN', null, { timeout: 2500 });
	const modalDur = await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="modal-shell-box"]')).transitionDuration);
	await page.locator('button:has-text("Visuals & Motion")').first().click({ force: true });
	await page.locator('[data-testid="ctrl-btn-variant-solid"]').first().click({ force: true });
	const btnVar = await page.evaluate(() => document.documentElement.dataset.uiBtnVariant);
	if (btnVar !== 'SOLID') throw new Error('Expected live data-ui-btn-variant=SOLID, got ' + btnVar);
	await page.locator('[data-testid="ctrl-btn-variant-tactical"]').first().click({ force: true });
	await page.locator('[data-testid="settings-tooltip-level-slider"]').first().evaluate((el) => { el.value = '30'; el.dispatchEvent(new Event('input', { bubbles: true })); });
	await page.locator('[data-testid="modal-close-btn"]').first().click({ force: true }); await dlg.waitFor({ state: 'detached', timeout: 3000 });
	await page.locator('[data-testid="studio-hud-toggle-btn"]').first().click({ force: true });
	await page.locator('[data-testid="calm-view-toggle-btn"]').first().waitFor({ state: 'visible', timeout: 4000 });
	await page.locator('[data-testid="zone-bottom-right"]').first().waitFor({ state: 'visible', timeout: 4000 });
	await page.locator('[data-testid="open-zones-btn"]').first().hover({ force: true }); await page.waitForTimeout(260);
	const blockedAt30 = (await page.locator('[data-testid="ui-cyber-tooltip"]').count()) === 0;
	await page.locator('[data-testid="calm-view-toggle-btn"]').first().hover({ force: true });
	await page.locator('[data-testid="ui-cyber-tooltip"]').first().waitFor({ state: 'visible', timeout: 2500 });
	if (!blockedAt30) throw new Error('Expected tipLevel=85 blocked when tooltipInfoLevel=30');
	await page.locator('[data-testid="studio-view-THEMES"]').first().click({ force: true }); await page.locator('[data-testid="edge-drawer-right"]').first().waitFor({ state: 'visible', timeout: 3000 });
	await page.locator('[data-testid="studio-view-BLUEPRINTS"]').first().click({ force: true }); await page.locator('[data-testid="edge-drawer-left"]').first().waitFor({ state: 'visible', timeout: 3000 });
	await page.locator('[data-testid="studio-view-MCP_TWIN"]').first().click({ force: true });
	await page.locator('[data-testid="twin-mcp-telemetry-card"]').first().waitFor({ state: 'visible', timeout: 3000 });
	await page.waitForFunction(() => (document.querySelector('[data-testid="twin-mcp-telemetry-card"]')?.textContent || '').includes('48 TOOLS'), null, { timeout: 3000 });
	await page.locator('[data-testid="studio-view-WORKBENCH"]').first().click({ force: true });
	await page.locator('[data-testid="hud-open-settings"]').first().click({ force: true }); await page.locator('button:has-text("Visuals & Motion")').first().click({ force: true });
	await page.locator('[data-testid="settings-tooltip-level-slider"]').first().evaluate((el) => { el.value = '100'; el.dispatchEvent(new Event('input', { bubbles: true })); });
	await page.locator('[data-testid="replay-hud-sequence-btn"]').first().click({ force: true });
	await page.locator('[data-testid="edge-rail-left"]').first().waitFor({ state: 'visible', timeout: 5500 });
	await page.locator('[data-testid="open-zones-btn"]').first().hover({ force: true });
	await page.locator('[data-testid="ui-cyber-tooltip"]').first().waitFor({ state: 'visible', timeout: 2500 });
	const revealedCount = (await page.locator('[data-zone-revealed="true"]').count()) + (await page.locator('[data-testid="edge-rail-left"], [data-testid="edge-rail-right"]').count());
	const hasRevealTrace = await page.evaluate(() => (document.querySelector('[data-testid="zone-bottom-left"]')?.textContent || '').includes('UI_REVEAL_ZONE'));
	if (revealedCount < 8 || !hasRevealTrace) throw new Error('HUD replay check failed: ' + JSON.stringify({ revealedCount, hasRevealTrace }));
	return { scrollbarWidth: base.sb, distinct4Cursors: base.distinct4, undoRedoDockAndPod: true, modalDur, btnVar, tipFilterVerified: blockedAt30, mcpSynced48: true, revealedCount, hasRevealTrace };
}`;
