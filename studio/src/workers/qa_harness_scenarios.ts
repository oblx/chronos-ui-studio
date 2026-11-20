export type HarnessScenarioId =
	| 'calm-density'
	| 'assistant-dock'
	| 'station-preview'
	| 'field-tome'
	| 'persistence'
	| 'responsive';

export const ALL_HARNESS_SCENARIOS: readonly HarnessScenarioId[] = [
	'calm-density', 'assistant-dock', 'station-preview', 'field-tome', 'persistence', 'responsive'
] as const;

export const SCENARIO_SCRIPTS: Readonly<Record<HarnessScenarioId, string>> = {
	'calm-density': `async (page) => {
		const root = page.locator('[data-layout-density]').first();
		await root.waitFor({ state: 'visible', timeout: 8000 });
		const states = [];
		for (let i = 0; i < 4; i++) {
			const density = await root.getAttribute('data-layout-density');
			const chrome = await root.getAttribute('data-studio-chrome');
			states.push({ density, chrome });
			await page.locator('[data-testid="density-cycle-btn"]').first().click({ force: true });
			await page.waitForTimeout(160);
		}
		const distinct = new Set(states.map((s) => s.density + ':' + s.chrome)).size;
		if (distinct < 3) throw new Error('Density cycle did not mutate layout/chrome: ' + JSON.stringify(states));
		return { states, distinct };
	}`,
	'assistant-dock': `async (page) => {
		const submitBtn = page.locator('[data-testid="assistant-submit-btn"]').first();
		const input = page.locator('[data-testid="assistant-prompt-input"]').first();
		await submitBtn.waitFor({ state: 'visible', timeout: 8000 });
		const beforeLabel = (await submitBtn.textContent() || '').trim();
		const grip = page.locator('[data-testid="assistant-drag-grip"]').first();
		await grip.click({ force: true });
		await page.waitForTimeout(180);
		const floating = await page.locator('[data-dock-mode="FLOATING"]').count();
		if (floating < 1) throw new Error('Click on dotted grip did not detach to FLOATING');
		await grip.click({ force: true });
		await page.waitForTimeout(180);
		const redocked = await page.locator('[data-dock-mode="DOCKED"]').count();
		if (redocked < 1) throw new Error('Second click on dotted grip did not re-dock to DOCKED');
		await input.fill('Add a telemetry card');
		await submitBtn.click({ force: true });
		await page.waitForTimeout(600);
		const afterLabel = (await submitBtn.textContent() || '').trim();
		if (afterLabel !== 'Send') throw new Error('Expected Send after first build, got: ' + afterLabel);
		return { beforeLabel, afterLabel, floating, redocked };
	}`,
	'station-preview': `async (page) => {
		const density = await page.locator('[data-layout-density]').first().getAttribute('data-layout-density');
		if (density === 'CALM') {
			await page.locator('[data-testid="density-cycle-btn"]').first().click({ force: true });
			await page.waitForTimeout(180);
		}
		await page.locator('[data-testid="open-station-btn"]').first().click({ force: true });
		const preview = page.locator('[data-testid="station-live-preview"]').first();
		await preview.waitFor({ state: 'visible', timeout: 8000 });
		const presetCount = await page.locator('[data-testid="station-motion-preset"]').count();
		if (presetCount < 8) throw new Error('Expected 8 motion presets in Station Builder, got ' + presetCount);
		const roundBtn = page.locator('[data-testid="station-corner-ROUND"]').first();
		await roundBtn.click({ force: true });
		await page.waitForTimeout(140);
		const cornerAttr = await preview.getAttribute('data-preview-corner');
		if (cornerAttr !== 'ROUND') throw new Error('Station live preview did not reflect ROUND corner: ' + cornerAttr);
		await page.keyboard.press('Escape');
		await page.waitForTimeout(160);
		return { presetCount, cornerAttr };
	}`,
	'field-tome': `async (page) => {
		const tomeBtn = page.locator('[data-testid="open-tome-btn"]').first();
		await tomeBtn.click({ force: true });
		const book = page.locator('[data-testid="tome-dual-book"]').first();
		await book.waitFor({ state: 'visible', timeout: 8000 });
		const text = (await book.textContent()) || '';
		if (text.includes('Test 3s Zero-CLS Lock')) throw new Error('Deprecated Test 3s Zero-CLS Lock button still present');
		if (text.includes('\`')) throw new Error('Raw markdown backtick leaked into Field Tome');
		const mathCount = await book.locator('math').count();
		if (mathCount < 1) throw new Error('Expected native MathML <math> in Field Tome');
		await page.keyboard.press('ArrowRight');
		await page.waitForTimeout(140);
		const folio = await page.locator('[data-testid="tome-folio-counter"]').first().textContent();
		await page.keyboard.press('Escape');
		await page.waitForTimeout(160);
		return { mathCount, folio: (folio || '').trim() };
	}`,
	'persistence': `async (page) => {
		const root = page.locator('[data-layout-density]').first();
		const beforeDensity = await root.getAttribute('data-layout-density');
		const beforeBuilt = await page.locator('[data-testid="assistant-submit-btn"]').first().textContent();
		await page.reload({ waitUntil: 'networkidle' });
		await root.waitFor({ state: 'visible', timeout: 8000 });
		await page.waitForTimeout(260);
		const afterDensity = await root.getAttribute('data-layout-density');
		const afterBuilt = await page.locator('[data-testid="assistant-submit-btn"]').first().textContent();
		if (afterDensity !== beforeDensity) throw new Error('Density lost across reload: ' + beforeDensity + ' -> ' + afterDensity);
		if ((afterBuilt || '').trim() !== (beforeBuilt || '').trim()) throw new Error('Build/Send state lost across reload: ' + beforeBuilt + ' -> ' + afterBuilt);
		return { beforeDensity, afterDensity, afterBuilt: (afterBuilt || '').trim() };
	}`,
	'responsive': `async (page) => {
		const metrics = await page.evaluate(() => ({
			innerW: window.innerWidth,
			scrollW: document.documentElement.scrollWidth,
			overflowPx: document.documentElement.scrollWidth - window.innerWidth
		}));
		if (metrics.overflowPx > 4) throw new Error('Horizontal overflow detected: ' + JSON.stringify(metrics));
		return metrics;
	}`
};
