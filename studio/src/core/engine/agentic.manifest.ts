import { findThemePack, VERSION, type UiProjectDefinition } from '@chronos-ui/svelte';

export function buildCriticalTokensCss(project: UiProjectDefinition): string {
	const pack = findThemePack(project.themeId);
	const pairs = Object.entries(pack.tokens).map(([k, v]) => `${k}:${v};`).join('');
	const cut = project.studioDefaults?.baseCornerCutRem ?? project.cornerRadiusRem ?? 0.5;
	return `:root{${pairs}--ui-corner-cut:${cut}rem;color-scheme:${pack.polarity};}`;
}

export function buildRobotsTxt(project: UiProjectDefinition): string {
	const base = (project.buildConfig.basePath || '/').replace(/\/$/, '');
	return [
		'User-agent: *',
		'Allow: /',
		'',
		`# Agentic discovery for ${project.name}`,
		`# LLMs catalog: ${base}/llms.txt`,
		`# WebMCP manifest: ${base}/.well-known/webmcp.json`,
		''
	].join('\n');
}

export function buildWebManifest(project: UiProjectDefinition): string {
	const pack = findThemePack(project.themeId);
	return JSON.stringify({
		name: project.name,
		short_name: project.name.slice(0, 16),
		description: project.description || `Static client built with @chronos-ui/svelte v${VERSION}`,
		start_url: project.buildConfig.basePath || './',
		display: 'standalone',
		background_color: pack.tokens['--ui-base-100'],
		theme_color: pack.tokens['--ui-primary']
	}, null, '\t');
}

export function buildLlmsTxt(project: UiProjectDefinition): string {
	const zones = [...new Set(project.nodes.map((n) => n.zone))].sort();
	const lines = [
		`# ${project.name}`,
		'',
		`> ${project.description || 'Standalone @chronos-ui/svelte application exported from Chronos UI Studio.'}`,
		'',
		'## Runtime Metadata',
		`- Package: @chronos-ui/svelte v${VERSION}`,
		`- Theme: ${project.themeId} (${project.cornerMode})`,
		`- Active Zones: ${zones.length > 0 ? zones.join(', ') : 'WORLD_CANVAS'}`,
		`- Entity Count: ${project.nodes.length}`,
		'',
		'## Mounted Entities',
		...(project.nodes.length > 0
			? project.nodes.map((n) => `- ${n.label} (${n.type}) in ${n.zone} [uuid=${n.id}, shape=${n.shape ?? 'BOX'}]`)
			: ['- Empty stage root in WORLD_CANVAS']),
		'',
		'## Agentic Interaction Schema',
		'- Discovery manifest: /.well-known/webmcp.json',
		'- Read-only tools: get_ui_structure, list_entities, get_theme_tokens',
		''
	];
	return lines.join('\n');
}

export function buildWebMcpManifest(project: UiProjectDefinition): string {
	const pack = findThemePack(project.themeId);
	return JSON.stringify({
		$schema: 'https://webmcp.org/schemas/webmcp-manifest-v1.json',
		version: VERSION,
		name: project.name,
		slug: project.slug,
		theme: { id: pack.id, polarity: pack.polarity },
		tools: [
			{
				name: 'get_ui_structure',
				description: 'Return the exported project summary, active HUD zones, and entity count.',
				readOnly: true,
				inputSchema: { type: 'object', properties: {}, additionalProperties: false },
				outputSchema: { type: 'object', properties: { name: { type: 'string' }, zones: { type: 'array' }, count: { type: 'number' } } }
			},
			{
				name: 'list_entities',
				description: 'List all mounted UI entities with UUID, component kind, HUD zone, and shape.',
				readOnly: true,
				inputSchema: { type: 'object', properties: { zone: { type: 'string' } }, additionalProperties: false },
				outputSchema: { type: 'object', properties: { entities: { type: 'array' } } }
			},
			{
				name: 'get_theme_tokens',
				description: 'Return the active WCAG AA+ semantic CSS custom properties for this application.',
				readOnly: true,
				inputSchema: { type: 'object', properties: {}, additionalProperties: false },
				outputSchema: { type: 'object', properties: { themeId: { type: 'string' }, tokens: { type: 'object' } } }
			}
		]
	}, null, '\t');
}

export function buildWebMcpBridgeSource(project: UiProjectDefinition): string {
	const pack = findThemePack(project.themeId);
	const entities = project.nodes.map((n) => ({ uuid: n.id, kind: n.type, zone: n.zone, label: n.label, shape: n.shape ?? 'BOX' }));
	const zones = [...new Set(entities.map((e) => e.zone))];
	return [
		`const STRUCTURE = ${JSON.stringify({ name: project.name, slug: project.slug, zones, count: entities.length })};`,
		`const ENTITIES = ${JSON.stringify(entities)};`,
		`const THEME = ${JSON.stringify({ themeId: pack.id, polarity: pack.polarity, tokens: pack.tokens })};`,
		`export function registerChronosWebMcp(): void {`,
		`\tconst tools = [`,
		`\t\t{ name: 'get_ui_structure', description: 'Return exported UI structure.', inputSchema: { type: 'object', properties: {} }, execute: async () => STRUCTURE },`,
		`\t\t{ name: 'list_entities', description: 'List mounted UI entities.', inputSchema: { type: 'object', properties: { zone: { type: 'string' } } }, execute: async (a?: { zone?: string }) => ({ entities: a?.zone ? ENTITIES.filter((e) => e.zone === a.zone) : ENTITIES }) },`,
		`\t\t{ name: 'get_theme_tokens', description: 'Return semantic CSS tokens.', inputSchema: { type: 'object', properties: {} }, execute: async () => THEME }`,
		`\t];`,
		`\tconst w = window as unknown as { __chronosWebMcpTools?: unknown[] };`,
		`\tw.__chronosWebMcpTools = tools;`,
		`\tconst mc = (document as unknown as { modelContext?: { registerTool?: (t: unknown) => void } }).modelContext;`,
		`\tif (mc && typeof mc.registerTool === 'function') { for (const t of tools) { try { mc.registerTool(t); } catch {} } }`,
		`}`,
		''
	].join('\n');
}
