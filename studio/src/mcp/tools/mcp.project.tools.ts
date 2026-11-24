import {
	computeViewportOccupancy, DEFAULT_VIEWPORT, generateUuidV7,
	type CornerAnimation, type CornerEmbellishment, type CornerTuple,
	type HudZoneId, type LayoutDensity, type UiComponentKind, type UiFrameShape, type UiNode
} from '@chronos-ui/svelte';
import { eq } from 'drizzle-orm';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CAPABILITY_BITS, findStarterSample } from '@studio/config';
import {
	applyJsonPatchWithInverse, derivePrototypeFromNode, documentGraphToNodeTree, evaluateGovernanceGate,
	nodeTreeToDocumentGraph, probeServerEnvironmentCapabilities, STUDIO_ROLE_MASKS, validateUiNode, type JsonPatchOp
} from '@studio/core';
import { getStudioDb, uiProjects } from '@studio/lib';
import { compileStaticClientBuild } from '@studio/plugins';
import { commitProjectRevision, createStudioProject, loadProjectWithNodes } from '@studio/server/routes/routes.projects';
import { buildWorkspaceCursorMcpTools } from './mcp.cursor.tools';
import { buildEntityMcpTools, buildWireframeMcpTools } from './mcp.entity.tools';
import { buildStationMcpTools } from './mcp.station.tools';

export type ProjectMcpToolFn = (args: Record<string, unknown>) => Promise<unknown>;

export async function resolveMcpProject(args: Record<string, unknown>) {
	const key = String(args.projectId ?? args.slug ?? 'proj-genesis');
	const project = await loadProjectWithNodes(key);
	if (!project) throw new Error(`Project not found: ${key}`);
	return project;
}
const resolveProjectOrThrow = resolveMcpProject;

async function toolSpawnNode(args: Record<string, unknown>) {
	const project = await resolveProjectOrThrow(args);
	const check = validateUiNode({
		id: String(args.id ?? generateUuidV7()),
		type: (args.type ?? 'UiSection') as UiComponentKind,
		zone: (args.zone ?? 'WORLD_CANVAS') as HudZoneId,
		label: String(args.label ?? args.type ?? 'Section'),
		lifecycle: args.lifecycle === 'COMMITTED' ? 'COMMITTED' : 'STAGING',
		props: (args.props && typeof args.props === 'object') ? args.props : {},
		shape: args.shape, corners: args.corners,
		cornerEmbellishment: args.cornerEmbellishment, cornerAnimation: args.cornerAnimation,
		intentBinding: typeof args.intentBinding === 'string' ? args.intentBinding : undefined
	});
	if (!check.ok) throw new Error(check.error);
	const dup = check.node.lifecycle === 'STAGING' && project.nodes.some((n) => (n.lifecycle === 'STAGING' || n.lifecycle === 'BUILDING') && n.type === check.node.type && n.zone === check.node.zone && n.label === check.node.label && JSON.stringify(n.props) === JSON.stringify(check.node.props));
	if (dup) return { summary: `deduplicated ${check.node.type} in ${check.node.zone}`, node: check.node, project };
	const res = await commitProjectRevision(project.id, [...project.nodes, check.node], 'MCP_BUILDER');
	return { summary: `spawned ${check.node.type} in ${check.node.zone}`, node: check.node, project: res.project };
}

async function toolConfigureNode(args: Record<string, unknown>) {
	const project = await resolveProjectOrThrow(args);
	const nodeId = String(args.nodeId ?? '');
	const target = project.nodes.find((n) => n.id === nodeId);
	if (target?.locked) throw new Error(`GOVERNANCE_LOCKED: Entity ${nodeId} is locked against mutations.`);
	const nextNodes: UiNode[] = project.nodes.map((n) => n.id !== nodeId ? n : {
		...n,
		label: typeof args.label === 'string' ? args.label : n.label,
		zone: typeof args.zone === 'string' ? (args.zone as HudZoneId) : n.zone,
		shape: typeof args.shape === 'string' ? (args.shape as UiFrameShape) : n.shape,
		corners: Array.isArray(args.corners) ? (args.corners as unknown as CornerTuple) : n.corners,
		cornerEmbellishment: typeof args.cornerEmbellishment === 'string' ? (args.cornerEmbellishment as CornerEmbellishment) : n.cornerEmbellishment,
		cornerAnimation: typeof args.cornerAnimation === 'string' ? (args.cornerAnimation as CornerAnimation) : n.cornerAnimation,
		intentBinding: typeof args.intentBinding === 'string' ? args.intentBinding : n.intentBinding,
		props: { ...n.props, ...((args.props && typeof args.props === 'object') ? (args.props as Record<string, unknown>) : {}) }
	});
	const res = await commitProjectRevision(project.id, nextNodes, 'MCP_BUILDER');
	return { summary: `configured ${nodeId}`, project: res.project };
}

async function toolCommitNode(args: Record<string, unknown>) {
	const project = await resolveProjectOrThrow(args);
	const nodeId = typeof args.nodeId === 'string' ? args.nodeId : null;
	const nextNodes: UiNode[] = project.nodes.map((n) => (!nodeId || n.id === nodeId) ? { ...n, lifecycle: 'COMMITTED' } : n);
	const res = await commitProjectRevision(project.id, nextNodes, 'MCP_BUILDER');
	return { summary: nodeId ? `committed ${nodeId}` : `committed ${nextNodes.length} node(s)`, project: res.project };
}

async function toolRemoveNode(args: Record<string, unknown>) {
	const project = await resolveProjectOrThrow(args), nodeId = String(args.nodeId ?? '');
	if (project.nodes.find((n) => n.id === nodeId)?.locked) throw new Error(`GOVERNANCE_LOCKED: Entity ${nodeId} is locked against deletion.`);
	const res = await commitProjectRevision(project.id, project.nodes.filter((n) => n.id !== nodeId), 'MCP_BUILDER');
	return { summary: `removed ${nodeId}`, project: res.project };
}

async function toolRejectAllStaged(args: Record<string, unknown>) {
	const project = await resolveProjectOrThrow(args), next = project.nodes.filter((n) => n.lifecycle === 'COMMITTED');
	const res = await commitProjectRevision(project.id, next, 'MCP_BUILDER');
	return { summary: `rejected ${project.nodes.length - next.length} staged node(s)`, rejectedCount: project.nodes.length - next.length, project: res.project };
}

async function toolLoadSample(args: Record<string, unknown>) {
	const project = await resolveProjectOrThrow(args), sample = findStarterSample(String(args.sampleId ?? 'sample-neon-ops'));
	if (!sample) throw new Error(`Starter sample not found: ${String(args.sampleId)}`);
	const db = await getStudioDb();
	await db.update(uiProjects).set({ themeId: sample.themeId, updatedAt: Date.now() }).where(eq(uiProjects.id, project.id));
	const res = await commitProjectRevision(project.id, [...sample.nodes], 'MCP_BUILDER');
	return { summary: `loaded sample ${sample.title}`, sampleId: sample.id, project: res.project };
}

async function toolDeriveBlueprint(args: Record<string, unknown>) {
	const project = await resolveProjectOrThrow(args), node = project.nodes.find((n) => n.id === String(args.nodeId ?? ''));
	if (!node) throw new Error(`Node not found for derivation: ${String(args.nodeId)}`);
	const prototype = derivePrototypeFromNode(node, String(args.name ?? `${node.label} Blueprint`));
	return { summary: `derived prototype ${prototype.name}`, prototype };
}

async function toolPatchDocument(args: Record<string, unknown>) {
	const project = await resolveProjectOrThrow(args), patches = Array.isArray(args.patches) ? (args.patches as JsonPatchOp[]) : [];
	const { doc, inverse } = applyJsonPatchWithInverse(nodeTreeToDocumentGraph(project.nodes), patches);
	const mask = typeof args.capabilityMask === 'number' ? args.capabilityMask : STUDIO_ROLE_MASKS.ARCHITECT;
	const gate = evaluateGovernanceGate({ graph: doc, actorCapabilityMask: mask, requiredCapabilityBit: CAPABILITY_BITS.WRITE_BLUEPRINTS });
	if (!gate.ok) throw new Error(`${gate.code}: ${gate.reason}`);
	const res = await commitProjectRevision(project.id, documentGraphToNodeTree(doc), 'MCP_BUILDER');
	return { summary: `applied ${patches.length} RFC 6902 patch op(s)`, inverseCount: inverse.length, inverse, project: res.project };
}

async function toolApplyTheme(args: Record<string, unknown>) {
	const project = await resolveProjectOrThrow(args), themeId = String(args.themeId ?? 'obsidian-brass'), db = await getStudioDb();
	await db.update(uiProjects).set({ themeId, updatedAt: Date.now() }).where(eq(uiProjects.id, project.id));
	return { summary: `theme ${themeId}`, project: await loadProjectWithNodes(project.id) };
}

async function toolExportStatic(args: Record<string, unknown>) {
	const project = await resolveProjectOrThrow(args);
	const workDir = typeof args.outDir === 'string' && args.outDir.trim() ? args.outDir.trim() : join(tmpdir(), `chronos-mcp-static-${project.slug}-${Date.now().toString(36)}`);
	const build = await compileStaticClientBuild({ project, workDir });
	return { summary: `compiled ${build.files.length} static assets`, build };
}

export function buildProjectMcpTools(): readonly [string, ProjectMcpToolFn][] {
	return [
		['ui_probe_environment', async () => probeServerEnvironmentCapabilities()],
		['ui_get_viewport_occupancy', async (args) => computeViewportOccupancy({ viewportW: Number(args.viewportW ?? DEFAULT_VIEWPORT.width), viewportH: Number(args.viewportH ?? DEFAULT_VIEWPORT.height), chromeVisible: Boolean(args.chromeVisible ?? true), density: String(args.density ?? 'BALANCED') as LayoutDensity, leftPanelOpen: Boolean(args.leftPanelOpen ?? true), rightPanelOpen: Boolean(args.rightPanelOpen ?? true), toastVisible: Boolean(args.toastVisible ?? true), assistantExpanded: Boolean(args.assistantExpanded ?? true) })],
		['ui_create_project', async (args) => { const project = await createStudioProject({ name: String(args.name ?? 'Untitled Workspace'), description: typeof args.description === 'string' ? args.description : undefined, themeId: typeof args.themeId === 'string' ? args.themeId : undefined }); return { summary: `created ${project.slug}`, project }; }],
		['ui_switch_project', async (args) => ({ summary: `switched to ${String(args.projectId ?? 'proj-genesis')}`, project: await resolveProjectOrThrow(args) })],
		['ui_load_sample', toolLoadSample], ['ui_spawn_node', toolSpawnNode], ['ui_configure_node', toolConfigureNode],
		['ui_commit_node', toolCommitNode], ['ui_remove_node', toolRemoveNode], ['ui_reject_all_staged', toolRejectAllStaged], ['ui_derive_blueprint', toolDeriveBlueprint],
		['ui_patch_document', toolPatchDocument], ['ui_apply_theme', toolApplyTheme], ['ui_export_static', toolExportStatic],
		...buildEntityMcpTools(), ...buildWorkspaceCursorMcpTools(), ...buildStationMcpTools(), ...buildWireframeMcpTools()
	];
}
