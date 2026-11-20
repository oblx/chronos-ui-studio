import { buildCursorPackCssSheet } from '@chronos-ui/svelte';
import { eq } from 'drizzle-orm';
import { getStudioDb, uiProjects } from '../lib';
import { deriveCursorStatesForPack, listCursorPacks, loadCursorPackById } from '../server/routes/routes.cursors';
import { cleanProjectWorkspace, saveProjectSnapshot } from '../server/routes/routes.lifecycle';
import type { EntityMcpToolFn } from './mcp.entity.tools';

export function buildWorkspaceCursorMcpTools(): readonly [string, EntityMcpToolFn][] {
	return [
		['ui_save_project', async (args) => {
			const pid = String(args.projectId ?? args.slug ?? 'proj-genesis');
			const saved = await saveProjectSnapshot(pid, { name: typeof args.name === 'string' ? args.name : undefined });
			return { summary: `saved ${saved.project.slug}`, ...saved };
		}],
		['ui_clean_project', async (args) => {
			const pid = String(args.projectId ?? args.slug ?? 'proj-genesis');
			const cleaned = await cleanProjectWorkspace(pid);
			return { summary: `cleaned ${cleaned.project.slug} to empty stage`, ...cleaned };
		}],
		['ui_reset_workspace_view', async () => ({ summary: 'reset camera and workspace view to defaults', reset: true })],
		['ui_list_cursor_packs', async () => {
			const packs = await listCursorPacks();
			return { count: packs.length, packs: packs.map((p) => ({ uuid: p.uuid, slug: p.slug, name: p.name, isBuiltin: p.isBuiltin })) };
		}],
		['ui_apply_cursor_pack', async (args) => {
			const pid = String(args.projectId ?? args.slug ?? 'proj-genesis');
			const packKey = String(args.packId ?? '');
			const pack = packKey && packKey !== 'none' ? await loadCursorPackById(packKey) : null;
			if (packKey && packKey !== 'none' && !pack) throw new Error(`Cursor pack not found: ${packKey}`);
			const db = await getStudioDb();
			await db.update(uiProjects).set({ cursorPackUuid: pack?.uuid ?? null, updatedAt: Date.now() }).where(eq(uiProjects.id, pid));
			const css = pack ? buildCursorPackCssSheet(pack) : '';
			return { summary: pack ? `applied cursor pack ${pack.slug}` : 'reset cursor pack to OS defaults', packId: pack?.uuid ?? null, cssLength: css.length };
		}],
		['ui_derive_cursor_states', async (args) => {
			const packId = String(args.packId ?? '');
			const pack = await deriveCursorStatesForPack(packId, { accentColor: typeof args.accentColor === 'string' ? args.accentColor : undefined, useAiLabel: true });
			return { summary: `derived 17 states for ${pack.slug}`, pack, derivedCount: 16 };
		}]
	];
}
