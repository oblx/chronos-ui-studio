export const LATEST_SCENARIO_SCRIPT = `async (page) => {
	const vp = page.viewportSize() || { width: 1440, height: 900 };
	const root = page.locator('[data-layout-density]').first();
	await root.waitFor({ state: 'visible', timeout: 6000 });
	if ((await root.getAttribute('data-studio-chrome')) !== 'false') throw new Error('Expected Calm boot');

	if (vp.width < 640) {
		const mob = await page.evaluate(() => ({
			calmVisible: Boolean(document.querySelector('[data-testid="calm-top-strip"]')),
			scrollW: document.documentElement.scrollWidth,
			innerW: window.innerWidth
		}));
		if (!mob.calmVisible || mob.scrollW > mob.innerW + 1) throw new Error('Mobile 390x844 audit failed: ' + JSON.stringify(mob));
		return { viewport: '390x844', calmVisible: mob.calmVisible, zeroOverflow: true };
	}

	if (vp.width === 1280) {
		await page.keyboard.press('Control+Shift+H');
		await page.locator('[data-testid="top-left-pod"]').first().waitFor({ state: 'visible', timeout: 4000 });
		const lap = await page.evaluate(() => {
			const pod = document.querySelector('[data-testid="top-left-pod"]');
			const rst = pod?.querySelector('[data-testid="workspace-reset-btn"]');
			const podR = pod.getBoundingClientRect(), rstR = rst.getBoundingClientRect();
			return {
				text: (rst?.textContent || '').trim(),
				clippedRightPx: Math.max(0, Math.round(rstR.right - (podR.right + 1))),
				scrollW: document.documentElement.scrollWidth,
				innerW: window.innerWidth
			};
		});
		if (!lap.text.includes('Reset') || lap.clippedRightPx > 0 || lap.scrollW > lap.innerW + 1) {
			throw new Error('1280x800 TOP_LEFT Reset or overflow failed: ' + JSON.stringify(lap));
		}
		await page.keyboard.press('Control+Shift+H');
		await page.locator('[data-testid="calm-top-strip"]').first().waitFor({ state: 'visible', timeout: 4000 });
		return { viewport: '1280x800', resetText: lap.text, clippedRightPx: lap.clippedRightPx, zeroOverflow: true };
	}

	const ctlAudit = await page.evaluate(() => {
		const btn = document.querySelector('[data-testid="studio-hud-toggle-btn"]');
		const cs = getComputedStyle(btn);
		const contour = btn?.querySelector('[data-ui-contour-path="true"]');
		const halo = btn?.querySelector('[data-ui-focus-halo="true"]');
		const idleStroke = contour ? getComputedStyle(contour).stroke : '';
		btn.focus();
		const focusHaloOp = halo ? Number(getComputedStyle(halo).opacity || '0') : 0;
		return {
			borderTopWidth: cs.borderTopWidth,
			outlineStyle: cs.outlineStyle,
			hasContour: Boolean(contour),
			hasHalo: Boolean(halo),
			idleStroke,
			focusHaloOp
		};
	});
	if (ctlAudit.borderTopWidth !== '0px' || ctlAudit.outlineStyle !== 'none' || !ctlAudit.hasContour || !ctlAudit.hasHalo) {
		throw new Error('SVG-native 5-state control audit failed: ' + JSON.stringify(ctlAudit));
	}

	await page.keyboard.press('Control+k');
	const searchModal = page.locator('[data-testid="global-search-modal"]').first();
	await searchModal.waitFor({ state: 'visible', timeout: 4000 });
	if ((await root.getAttribute('data-studio-chrome')) !== 'false') {
		throw new Error('Ctrl+K must open Global Search without toggling Studio HUD');
	}
	const searchInput = page.locator('[data-testid="global-search-input-wrap"] input').first();
	await searchInput.fill('Wireframe');
	await page.locator('[data-testid="global-search-item-act-wireframe"]').first().waitFor({ state: 'visible', timeout: 4000 });
	await searchInput.press('Enter');
	await page.locator('[data-testid="wireframe-skeleton-modal"]').first().waitFor({ state: 'visible', timeout: 6000 });
	await page.keyboard.press('Escape');
	await page.locator('[data-testid="wireframe-skeleton-modal"]').first().waitFor({ state: 'detached', timeout: 4000 });

	await page.locator('[data-testid="open-tome-btn"]').first().click({ force: true });
	const ch3Btn = page.locator('[data-testid="tome-toc-ch-3"]').first();
	await ch3Btn.waitFor({ state: 'visible', timeout: 5000 });
	await ch3Btn.hover({ force: true });
	await page.waitForTimeout(100);
	const tomeAudit = await page.evaluate(() => {
		const btn = document.querySelector('[data-testid="tome-toc-ch-3"]');
		const wrap = btn?.querySelector('.ui-marquee-wrap');
		const btnR = btn.getBoundingClientRect(), wrapR = wrap.getBoundingClientRect();
		const shift = parseFloat(getComputedStyle(wrap).getPropertyValue('--ui-marquee-shift') || '0');
		return { clippedClean: wrapR.right <= btnR.right + 1, shiftPx: shift, overflowAttr: wrap.getAttribute('data-overflow') };
	});
	if (!tomeAudit.clippedClean || tomeAudit.shiftPx >= 0) throw new Error('Tome Ch3 marquee failed: ' + JSON.stringify(tomeAudit));
	await page.keyboard.press('Escape');
	await page.locator('[role="dialog"]').first().waitFor({ state: 'detached', timeout: 4000 });

	await page.keyboard.press('Control+Shift+H');
	await page.locator('[data-testid="top-left-pod"]').first().waitFor({ state: 'visible', timeout: 4000 });
	await page.locator('[data-testid="hud-open-wire"]').first().click({ force: true });
	await page.locator('[data-testid="wire-observatory-root"] [data-testid="wire-dag-graph"]').first().waitFor({ state: 'visible', timeout: 5000 });
	const slider = page.locator('[data-testid="wire-timescale-slider"]').first();
	await slider.evaluate((el) => { el.value = '2500'; el.dispatchEvent(new Event('input', { bubbles: true })); });
	await page.waitForTimeout(100);
	const d2500 = await page.evaluate(() => Number(document.querySelector('[data-testid="graph-packet"]')?.getAttribute('data-scaled-ms') || '0'));
	await slider.evaluate((el) => { el.value = '10000'; el.dispatchEvent(new Event('input', { bubbles: true })); });
	await page.waitForTimeout(140);
	const d10000 = await page.evaluate(() => Number(document.querySelector('[data-testid="graph-packet"]')?.getAttribute('data-scaled-ms') || '0'));
	await slider.evaluate((el) => { el.value = '2500'; el.dispatchEvent(new Event('input', { bubbles: true })); });
	const ratio = d2500 > 0 ? Number((d10000 / d2500).toFixed(2)) : 0;
	if (ratio < 3.5) throw new Error('True-ratio time-scale failed: ' + JSON.stringify({ d2500, d10000, ratio }));
	await page.keyboard.press('Escape');
	await page.locator('[role="dialog"]').first().waitFor({ state: 'detached', timeout: 4000 });

	await page.locator('[data-testid="studio-view-MCP_TWIN"]').first().click({ force: true });
	await page.waitForFunction(() => (document.querySelector('[data-testid="twin-mcp-telemetry-card"]')?.textContent || '').includes('52 TOOLS'), null, { timeout: 3000 });
	await page.keyboard.press('Control+Shift+H');
	await page.locator('[data-testid="calm-top-strip"]').first().waitFor({ state: 'visible', timeout: 4000 });
	return {
		viewport: '1440x900',
		svgNative5State: ctlAudit,
		ctrlKGlobalSearch: true,
		ctrlShiftHHudToggle: true,
		tomeCh3MarqueeShiftPx: tomeAudit.shiftPx,
		timeScaleRatio: { d2500, d10000, ratio },
		mcpSynced52: true
	};
}`;
