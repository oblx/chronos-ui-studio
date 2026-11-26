import { BUILTIN_CURSOR_PACKS, CORNER_RADIUS_LIMITS, CSS_CURSOR_STATES, DEFAULT_STUDIO_DEFAULTS, generateUuidV7, STUDIO_DEFAULTS_VERSION, THEME_PACKS } from '@chronos-ui/svelte';
import { Database } from 'bun:sqlite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { STARTER_BLUEPRINTS, STUDIO_CONFIG } from '../config';
import { DEFAULT_BUILD_CONFIG, formatHlc, maskForRole, tickHlc } from '../core';
import { hashPassword } from './crypto.vault';
import * as cursorSchema from './db.cursor.schema';
import * as baseSchema from './db.schema';

const schema = { ...baseSchema, ...cursorSchema };
type StudioDb = ReturnType<typeof drizzle<typeof schema>>;

const DDL_STATEMENTS = [
	`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL, capability_mask INTEGER NOT NULL, created_at INTEGER NOT NULL)`,
	`CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL)`,
	`CREATE TABLE IF NOT EXISTS mcp_tokens (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, label TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, capability_mask INTEGER NOT NULL, created_at INTEGER NOT NULL)`,
	`CREATE TABLE IF NOT EXISTS themes (id TEXT PRIMARY KEY, name TEXT NOT NULL, polarity TEXT NOT NULL, tokens_json TEXT NOT NULL, starred INTEGER NOT NULL DEFAULT 0, owner_id TEXT NOT NULL, updated_at INTEGER NOT NULL)`,
	`CREATE TABLE IF NOT EXISTS blueprints (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, theme_id TEXT NOT NULL, corner_mode TEXT NOT NULL, zones_json TEXT NOT NULL, starred INTEGER NOT NULL DEFAULT 0, version INTEGER NOT NULL DEFAULT 1, owner_id TEXT NOT NULL, updated_at INTEGER NOT NULL)`,
	`CREATE TABLE IF NOT EXISTS audit_events (id TEXT PRIMARY KEY, spine TEXT NOT NULL, kind TEXT NOT NULL, ip_hash TEXT NOT NULL, summary TEXT NOT NULL, created_at INTEGER NOT NULL)`,
	`CREATE TABLE IF NOT EXISTS webhooks (id TEXT PRIMARY KEY, url TEXT NOT NULL, secret_cipher TEXT NOT NULL, events_json TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL)`,
	`CREATE TABLE IF NOT EXISTS ui_projects (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT NOT NULL, active_revision_id TEXT NOT NULL, theme_id TEXT NOT NULL, corner_style TEXT NOT NULL, corner_radius_rem REAL NOT NULL DEFAULT ${CORNER_RADIUS_LIMITS.defaultRem}, studio_defaults_json TEXT, cursor_pack_uuid TEXT, has_built_once INTEGER NOT NULL DEFAULT 0, build_config_json TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
	`CREATE TABLE IF NOT EXISTS ui_project_revisions (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, hlc_timestamp TEXT NOT NULL, parent_revision_id TEXT, nodes_json TEXT NOT NULL, author_origin TEXT NOT NULL, created_at INTEGER NOT NULL)`,
	`CREATE TABLE IF NOT EXISTS ai_provider_profiles (id TEXT PRIMARY KEY, label TEXT NOT NULL, provider_kind TEXT NOT NULL, base_url TEXT NOT NULL, model_id TEXT NOT NULL, vault_secret_cipher TEXT, secret_mask TEXT, temperature INTEGER NOT NULL DEFAULT 30, max_tokens INTEGER NOT NULL DEFAULT 2048, persona TEXT NOT NULL DEFAULT 'architect', is_default INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL)`,
	`CREATE TABLE IF NOT EXISTS ai_chat_messages (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, tool_calls_json TEXT NOT NULL, revision_id TEXT, created_at INTEGER NOT NULL)`,
	`CREATE TABLE IF NOT EXISTS connector_configs (id TEXT PRIMARY KEY, connector_id TEXT NOT NULL, label TEXT NOT NULL, config_json TEXT NOT NULL, created_at INTEGER NOT NULL)`,
	`CREATE TABLE IF NOT EXISTS export_jobs (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, adapter_id TEXT NOT NULL, checksum TEXT NOT NULL, artifact_meta_json TEXT NOT NULL, created_at INTEGER NOT NULL)`,
	`CREATE TABLE IF NOT EXISTS ui_entities (uuid TEXT PRIMARY KEY, project_uuid TEXT NOT NULL, parent_uuid TEXT, zone_id TEXT NOT NULL, kind TEXT NOT NULL, label TEXT NOT NULL, shape TEXT NOT NULL, lifecycle TEXT NOT NULL, hlc_timestamp TEXT NOT NULL, props_json TEXT NOT NULL, updated_at INTEGER NOT NULL)`,
	`CREATE TABLE IF NOT EXISTS cursor_packs (uuid TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT NOT NULL, is_builtin INTEGER NOT NULL DEFAULT 0, derived_from_uuid TEXT, source_png_data_url TEXT, base_hotspot_x INTEGER NOT NULL DEFAULT 3, base_hotspot_y INTEGER NOT NULL DEFAULT 2, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
	`CREATE TABLE IF NOT EXISTS cursor_state_assets (uuid TEXT PRIMARY KEY, pack_uuid TEXT NOT NULL, css_state TEXT NOT NULL, asset_data_url TEXT NOT NULL, hotspot_x INTEGER NOT NULL DEFAULT 3, hotspot_y INTEGER NOT NULL DEFAULT 2, generator_origin TEXT NOT NULL, updated_at INTEGER NOT NULL)`
] as const;

let dbSingleton: StudioDb | null = null;
let sqliteSingleton: Database | null = null;

function ensureSchema(sqlite: Database): void {
	sqlite.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
	for (const stmt of DDL_STATEMENTS) sqlite.exec(stmt);
	const cols = sqlite.query('PRAGMA table_info(ui_projects);').all() as Array<{ name: string }>;
	if (!cols.some((c) => c.name === 'cursor_pack_uuid')) sqlite.exec('ALTER TABLE ui_projects ADD COLUMN cursor_pack_uuid TEXT;');
	if (!cols.some((c) => c.name === 'corner_radius_rem')) sqlite.exec(`ALTER TABLE ui_projects ADD COLUMN corner_radius_rem REAL NOT NULL DEFAULT ${CORNER_RADIUS_LIMITS.defaultRem};`);
	if (!cols.some((c) => c.name === 'studio_defaults_json')) sqlite.exec('ALTER TABLE ui_projects ADD COLUMN studio_defaults_json TEXT;');
	if (!cols.some((c) => c.name === 'has_built_once')) sqlite.exec('ALTER TABLE ui_projects ADD COLUMN has_built_once INTEGER NOT NULL DEFAULT 0;');
	const migrated = JSON.stringify({ ...DEFAULT_STUDIO_DEFAULTS, defaultsVersion: STUDIO_DEFAULTS_VERSION });
	sqlite.query(`UPDATE ui_projects SET corner_radius_rem = ?, studio_defaults_json = ? WHERE corner_radius_rem = 0.75 AND (studio_defaults_json IS NULL OR studio_defaults_json NOT LIKE '%"defaultsVersion":2%')`).run(CORNER_RADIUS_LIMITS.defaultRem, migrated);
}

async function seedAdminUser(db: StudioDb, now: number): Promise<void> {
	const { ownerId, email, password, displayName } = STUDIO_CONFIG.devSeed;
	const existing = await db.select().from(schema.users).where(eq(schema.users.id, ownerId)).limit(1);
	const pwHash = await hashPassword(password);
	if (existing.length > 0) {
		if (!process.env.CHRONOS_AUTH_PEPPER_V1) {
			await db.update(schema.users).set({ passwordHash: pwHash }).where(eq(schema.users.id, ownerId));
		}
		return;
	}
	await db.insert(schema.users).values({
		id: ownerId, email, displayName, passwordHash: pwHash,
		role: 'admin', capabilityMask: maskForRole('admin'), createdAt: now
	});
}

async function seedCursorPacks(db: StudioDb, now: number): Promise<void> {
	for (const pack of BUILTIN_CURSOR_PACKS) {
		const existing = await db.select().from(schema.cursorPacks).where(eq(schema.cursorPacks.uuid, pack.uuid)).limit(1);
		if (existing.length === 0) {
			await db.insert(schema.cursorPacks).values({
				uuid: pack.uuid, slug: pack.slug, name: pack.name, description: pack.description,
				isBuiltin: 1, derivedFromUuid: null, sourcePngDataUrl: null,
				baseHotspotX: pack.baseHotspotX, baseHotspotY: pack.baseHotspotY, createdAt: now, updatedAt: now
			});
		}
		const assets = await db.select().from(schema.cursorStateAssets).where(eq(schema.cursorStateAssets.packUuid, pack.uuid));
		if (assets.length !== CSS_CURSOR_STATES.length) {
			await db.delete(schema.cursorStateAssets).where(eq(schema.cursorStateAssets.packUuid, pack.uuid));
			await db.insert(schema.cursorStateAssets).values(CSS_CURSOR_STATES.map((st) => ({
				uuid: generateUuidV7(), packUuid: pack.uuid, cssState: st,
				assetDataUrl: pack.states[st].assetDataUrl, hotspotX: pack.states[st].hotspotX,
				hotspotY: pack.states[st].hotspotY, generatorOrigin: 'PRESET', updatedAt: now
			})));
		}
	}
}

async function seedCatalogAndGenesis(db: StudioDb, now: number): Promise<void> {
	if ((await db.select().from(schema.themes).limit(1)).length === 0) {
		for (const pack of THEME_PACKS) {
			await db.insert(schema.themes).values({
				id: pack.id, name: pack.name, polarity: pack.polarity, tokensJson: JSON.stringify(pack.tokens),
				starred: pack.id === THEME_PACKS[0].id ? 1 : 0, ownerId: STUDIO_CONFIG.devSeed.ownerId, updatedAt: now
			});
		}
	}
	if ((await db.select().from(schema.blueprints).limit(1)).length === 0) {
		for (const bp of STARTER_BLUEPRINTS) {
			await db.insert(schema.blueprints).values({
				id: bp.id, name: bp.name, description: bp.description, themeId: bp.themeId, cornerMode: bp.cornerMode,
				zonesJson: JSON.stringify(bp.zones), starred: bp.starred ? 1 : 0, version: bp.version,
				ownerId: STUDIO_CONFIG.devSeed.ownerId, updatedAt: now
			});
		}
	}
	if ((await db.select().from(schema.uiProjects).limit(1)).length === 0) {
		const revId = 'rev-genesis-0';
		await db.insert(schema.uiProjects).values({
			id: STUDIO_CONFIG.defaultProjectId, slug: 'genesis', name: 'Genesis Canvas',
			description: 'Calm empty-stage canvas ready for live AI composition.',
			activeRevisionId: revId, themeId: THEME_PACKS[0].id, cornerStyle: 'CHAMFER',
			cornerRadiusRem: CORNER_RADIUS_LIMITS.defaultRem, cursorPackUuid: BUILTIN_CURSOR_PACKS[0].uuid,
			buildConfigJson: JSON.stringify(DEFAULT_BUILD_CONFIG), createdAt: now, updatedAt: now
		});
		await db.insert(schema.uiProjectRevisions).values({
			id: revId, projectId: STUDIO_CONFIG.defaultProjectId, hlcTimestamp: formatHlc(tickHlc(null, 'studio', now)),
			parentRevisionId: null, nodesJson: '[]', authorOrigin: 'SYSTEM', createdAt: now
		});
	}
	if ((await db.select().from(schema.aiProviderProfiles).limit(1)).length === 0) {
		await db.insert(schema.aiProviderProfiles).values({
			id: 'ai-local-default', label: 'Local Heuristic Engine', providerKind: 'local',
			baseUrl: '', modelId: 'LOCAL AGENT', vaultSecretCipher: null, secretMask: '',
			temperature: 20, maxTokens: 2048, persona: 'architect', isDefault: 1, updatedAt: now
		});
	}
	await seedCursorPacks(db, now);
}

function isTestRuntime(): boolean {
	if (process.env.CHRONOS_TEST_DB === '1' || process.env.BUN_ENV === 'test' || process.env.NODE_ENV === 'test') return true;
	return typeof Bun !== 'undefined' && (Bun.main.endsWith('.test.ts') || process.argv.some((a) => a.endsWith('.test.ts') || a === 'test'));
}

export async function getStudioDb(customPath?: string): Promise<StudioDb> {
	if (dbSingleton && !customPath) return dbSingleton;
	const targetPath = customPath ?? (isTestRuntime() ? ':memory:' : STUDIO_CONFIG.dbPath);
	if (targetPath !== ':memory:') mkdirSync(dirname(targetPath), { recursive: true });
	const sqlite = new Database(targetPath);
	ensureSchema(sqlite);
	const db = drizzle(sqlite, { schema });
	const now = Date.now();
	await seedAdminUser(db, now);
	await seedCatalogAndGenesis(db, now);
	if (!customPath) { sqliteSingleton = sqlite; dbSingleton = db; }
	return db;
}

export const closeStudioDb = (): void => { sqliteSingleton?.close(); sqliteSingleton = null; dbSingleton = null; };
