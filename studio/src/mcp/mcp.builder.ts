import { THEME_PACKS, UI_FRAMEWORK_MANIFEST, validateThemePackContrast, type ThemePack } from '@chronos-ui/svelte';
import { eq } from 'drizzle-orm';
import { STUDIO_CONFIG } from '@studio/config';
import { blueprints, getStudioDb, mapBlueprintRow } from '@studio/lib';
import { exportBlueprintArtifact, listInputConnectors, listOutputAdapters, runInputConnector, type BlueprintImportResult, type ExportFormat } from '@studio/plugins';
import { pushServerTrace } from '@studio/server/server.telemetry';
import { MCP_MANIFEST } from './mcp.manifest';
import { dispatchJsonRpc, type JsonRpcRequest } from './mcp.rpc';
import { buildProjectMcpTools } from './tools';

type ToolFn = (args: Record<string, unknown>) => Promise<unknown>;

async function toolComposeBlueprint(args: Record<string, unknown>) {
	const check = runInputConnector<unknown, BlueprintImportResult>('object-blueprint', args);
	if (!check.ok) throw new Error(check.error);
	const db = await getStudioDb();
	const bp = check.blueprint;
	await db.insert(blueprints).values({
		id: bp.id, name: bp.name, description: bp.description, themeId: bp.themeId,
		cornerMode: bp.cornerMode, zonesJson: JSON.stringify(bp.zones),
		starred: bp.starred ? 1 : 0, version: bp.version, ownerId: STUDIO_CONFIG.devSeed.ownerId, updatedAt: Date.now()
	}).onConflictDoUpdate({
		target: blueprints.id,
		set: { name: bp.name, description: bp.description, themeId: bp.themeId, cornerMode: bp.cornerMode, zonesJson: JSON.stringify(bp.zones), updatedAt: Date.now() }
	});
	pushServerTrace('STUDIO_COMMAND_EXEC', `MCP composed ${bp.id}`, 0.5, true, 'MCP_TWIN');
	return { blueprint: bp };
}

async function toolExportScaffold(args: Record<string, unknown>) {
	const db = await getStudioDb();
	const id = String(args.blueprintId ?? STUDIO_CONFIG.defaultBlueprintId);
	const format = String(args.format ?? 'svelte') as ExportFormat;
	const rows = await db.select().from(blueprints).where(eq(blueprints.id, id)).limit(1);
	if (!rows[0]) throw new Error(`Blueprint not found: ${id}`);
	return exportBlueprintArtifact(mapBlueprintRow(rows[0]), format);
}

const builderTools = new Map<string, ToolFn>([
	['ui_list_primitives', async () => ({
		...UI_FRAMEWORK_MANIFEST,
		connectors: listInputConnectors(),
		adapters: listOutputAdapters()
	})],
	...buildProjectMcpTools(),
	['ui_compose_blueprint', toolComposeBlueprint],
	['ui_validate_theme_wcag', async (args) => {
		const candidate = (args.theme ?? THEME_PACKS[0]) as ThemePack;
		return { themeId: candidate.id, checks: validateThemePackContrast(candidate) };
	}],
	['ui_export_package_scaffold', toolExportScaffold]
]);

async function readBuilderResource(uri: string): Promise<unknown> {
	if (uri === 'ui://manifest') return UI_FRAMEWORK_MANIFEST;
	if (uri === 'ui://tokens/semantic') return THEME_PACKS;
	if (uri.startsWith('ui://blueprints/')) {
		const id = uri.slice('ui://blueprints/'.length);
		const db = await getStudioDb();
		const rows = await db.select().from(blueprints).where(eq(blueprints.id, id)).limit(1);
		if (!rows[0]) throw new Error(`Resource not found: ${uri}`);
		return mapBlueprintRow(rows[0]);
	}
	throw new Error(`Unknown resource URI: ${uri}`);
}

export function handleBuilderMcpRpc(req: JsonRpcRequest) {
	return dispatchJsonRpc(req, {
		serverName: 'chronos-builder-mcp',
		toolsMeta: MCP_MANIFEST.spines.builder.tools,
		resourcesMeta: MCP_MANIFEST.spines.builder.resources,
		tools: builderTools,
		readResource: readBuilderResource
	}, undefined);
}
