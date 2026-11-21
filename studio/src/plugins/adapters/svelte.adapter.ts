import {
	DEFAULT_MOTION_CONFIG, findThemePack, VERSION,
	type MotionConfig, type UiNode, type UiProjectDefinition
} from '@chronos-ui/svelte';
import { registerOutputAdapter } from '../registry';

export interface ProjectTextArtifact {
	readonly adapterId: string;
	readonly filename: string;
	readonly mimeType: string;
	readonly content: string;
}

function renderNodeMarkup(node: UiNode, project: UiProjectDefinition): string {
	const title = String(node.props.title ?? node.label);
	const subtitle = String(node.props.subtitle ?? '');
	const shape = node.shape ?? 'BOX';
	const emb = node.cornerEmbellishment ? ` cornerEmbellishment=${JSON.stringify(node.cornerEmbellishment)}` : '';
	const anim = node.cornerAnimation ? ` cornerAnimation=${JSON.stringify(node.cornerAnimation)}` : '';
	if (node.type === 'UiProgressGauge') {
		return `\t\t\t<UiProgressGauge label=${JSON.stringify(String(node.props.label ?? node.label))} value={${Number(node.props.value ?? 72)}} max={${Number(node.props.max ?? 100)}} />`;
	}
	if (node.type === 'UiBadge') {
		return `\t\t\t<UiBadge text=${JSON.stringify(String(node.props.text ?? node.props.label ?? node.label))} tone=${JSON.stringify(String(node.props.tone ?? 'primary'))} />`;
	}
	if (node.type === 'UiChamferButton') {
		return `\t\t\t<UiChamferButton cornerMode=${JSON.stringify(String(node.props.cornerMode ?? project.cornerMode))} label=${JSON.stringify(String(node.props.label ?? node.label))} variant="primary" />`;
	}
	return [
		`\t\t\t<article class="ui-virtual-node" in:uiTransition={{ offsetPx: 10 }}>`,
		`\t\t\t\t<UiChamferFrame cornerMode=${JSON.stringify(project.cornerMode)} shape=${JSON.stringify(shape)}${emb}${anim} carets={true} outerClass="w-full" className="flex flex-col gap-1 p-4">`,
		`\t\t\t\t\t<h2 class="ui-font-display text-sm font-semibold">${title}</h2>`,
		subtitle ? `\t\t\t\t\t<p class="text-xs opacity-80">${subtitle}</p>` : '',
		`\t\t\t\t</UiChamferFrame>`,
		`\t\t\t</article>`
	].filter(Boolean).join('\n');
}

function buildSvelteTemplateMarkup(project: UiProjectDefinition, stageMarkup: string, asideMarkup: string): string {
	return [
		`<a href="#main-stage" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:px-3 focus:py-2" style="background-color: var(--ui-base-200); color: var(--ui-base-content);">Skip to Main Content</a>`,
		`<div class="flex min-h-screen w-full flex-col" style="background-color: var(--ui-base-100); color: var(--ui-base-content);">`,
		`\t<header class="flex items-center justify-between gap-4 border-b px-6 py-3" style="border-color: var(--ui-border-subtle);">`,
		`\t\t<div class="flex items-center gap-2">`,
		`\t\t\t<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><polygon points="3,1 17,1 19,3 19,17 17,19 3,19 1,17 1,3" fill="none" stroke="currentColor" stroke-width="1.5" /></svg>`,
		`\t\t\t<h1 class="ui-font-display text-base font-semibold">${project.name}</h1>`,
		`\t\t</div>`,
		`\t\t<nav aria-label="Primary application navigation" class="flex items-center gap-4 text-xs">`,
		`\t\t\t<a href="#main-stage" class="underline-offset-4 hover:underline">Workspace</a>`,
		`\t\t\t<a href="./llms.txt" class="underline-offset-4 hover:underline">llms.txt</a>`,
		`\t\t\t<a href="./.well-known/webmcp.json" class="underline-offset-4 hover:underline">WebMCP</a>`,
		`\t\t</nav>`,
		`\t</header>`,
		`\t<div class="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-4 p-6 lg:grid-cols-[1fr_16rem]">`,
		`\t\t<main id="main-stage" class="grid grid-cols-1 gap-4 md:grid-cols-2" tabindex="-1">`,
		stageMarkup,
		`\t\t</main>`,
		`\t\t<aside aria-label="Supplementary workspace details" class="flex flex-col gap-3">`,
		asideMarkup,
		`\t\t</aside>`,
		`\t</div>`,
		`\t<footer class="flex items-center justify-between border-t px-6 py-3 text-xs opacity-75" style="border-color: var(--ui-border-subtle);">`,
		`\t\t<span>${project.name}</span>`,
		`\t\t<span class="ui-font-mono">@chronos-ui/svelte v${VERSION}</span>`,
		`\t</footer>`,
		`</div>`, ''
	].join('\n');
}

export function emitProjectSvelteScaffold(
	project: UiProjectDefinition,
	motionConfig: MotionConfig = DEFAULT_MOTION_CONFIG
): ProjectTextArtifact {
	const theme = findThemePack(project.themeId);
	const atoms = new Set<string>(['UiChamferFrame']);
	for (const n of project.nodes) {
		if (n.type === 'UiProgressGauge' || n.type === 'UiBadge' || n.type === 'UiChamferButton') atoms.add(n.type);
	}
	const visibleNodes = project.nodes.filter((n) => n.visible !== false);
	const sideNodes = visibleNodes.filter((n) => n.zone === 'LEFT_EDGE' || n.zone === 'RIGHT_EDGE');
	const stageNodes = visibleNodes.filter((n) => n.zone !== 'LEFT_EDGE' && n.zone !== 'RIGHT_EDGE');
	const stageMarkup = stageNodes.length > 0
		? stageNodes.map((n) => renderNodeMarkup(n, project)).join('\n')
		: `\t\t\t<UiChamferFrame cornerMode=${JSON.stringify(project.cornerMode)} className="p-6"><p class="text-sm opacity-85">${project.description || project.name}</p></UiChamferFrame>`;
	const asideMarkup = sideNodes.length > 0
		? sideNodes.map((n) => renderNodeMarkup(n, project)).join('\n')
		: `\t\t\t<p class="text-xs opacity-75">Active zones: ${[...new Set(visibleNodes.map((n) => n.zone))].join(', ') || 'WORLD_CANVAS'}</p>`;
	const scriptBlock = [
		`<script lang="ts">`,
		`\t// Generated by @chronos-ui/svelte v${VERSION} — Project: ${project.name}`,
		`\timport { ${[...atoms].sort().join(', ')} } from '@chronos-ui/svelte/atoms';`,
		`\timport { applyThemeToRoot, findThemePack } from '@chronos-ui/svelte/tokens';`,
		`\timport { setActiveMotionConfig, uiTransition } from '@chronos-ui/svelte/motion';`,
		`\tsetActiveMotionConfig(${JSON.stringify(motionConfig)});`,
		`\t$effect(() => { applyThemeToRoot(findThemePack(${JSON.stringify(theme.id)})); });`,
		`</script>`, ''
	].join('\n');
	return {
		adapterId: 'svelte-scaffold',
		filename: `${project.slug}.App.svelte`,
		mimeType: 'text/plain; charset=utf-8',
		content: `${scriptBlock}\n${buildSvelteTemplateMarkup(project, stageMarkup, asideMarkup)}`
	};
}

registerOutputAdapter<UiProjectDefinition, ProjectTextArtifact>({
	id: 'svelte-scaffold',
	label: 'Tree-Shaken Svelte 5 Runes Scaffold',
	mimeType: 'text/plain; charset=utf-8',
	emit: emitProjectSvelteScaffold
});
