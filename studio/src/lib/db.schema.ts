import { CORNER_RADIUS_LIMITS } from '@chronos-ui/svelte';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	displayName: text('display_name').notNull(),
	passwordHash: text('password_hash').notNull(),
	role: text('role').notNull(),
	capabilityMask: integer('capability_mask').notNull(),
	createdAt: integer('created_at').notNull()
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(), userId: text('user_id').notNull(),
	tokenHash: text('token_hash').notNull().unique(), expiresAt: integer('expires_at').notNull(), createdAt: integer('created_at').notNull()
});

export const mcpTokens = sqliteTable('mcp_tokens', {
	id: text('id').primaryKey(), userId: text('user_id').notNull(), label: text('label').notNull(),
	tokenHash: text('token_hash').notNull().unique(), capabilityMask: integer('capability_mask').notNull(), createdAt: integer('created_at').notNull()
});

export const themes = sqliteTable('themes', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	polarity: text('polarity').notNull(),
	tokensJson: text('tokens_json').notNull(),
	starred: integer('starred').notNull().default(0),
	ownerId: text('owner_id').notNull(),
	updatedAt: integer('updated_at').notNull()
});

export const blueprints = sqliteTable('blueprints', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description').notNull(),
	themeId: text('theme_id').notNull(),
	cornerMode: text('corner_mode').notNull(),
	zonesJson: text('zones_json').notNull(),
	starred: integer('starred').notNull().default(0),
	version: integer('version').notNull().default(1),
	ownerId: text('owner_id').notNull(),
	updatedAt: integer('updated_at').notNull()
});

export const auditEvents = sqliteTable('audit_events', {
	id: text('id').primaryKey(),
	spine: text('spine').notNull(),
	kind: text('kind').notNull(),
	ipHash: text('ip_hash').notNull(),
	summary: text('summary').notNull(),
	createdAt: integer('created_at').notNull()
});

export const webhooks = sqliteTable('webhooks', {
	id: text('id').primaryKey(),
	url: text('url').notNull(),
	secretCipher: text('secret_cipher').notNull(),
	eventsJson: text('events_json').notNull(),
	enabled: integer('enabled').notNull().default(1),
	createdAt: integer('created_at').notNull()
});

export const uiProjects = sqliteTable('ui_projects', {
	id: text('id').primaryKey(),
	slug: text('slug').notNull().unique(),
	name: text('name').notNull(),
	description: text('description').notNull(),
	activeRevisionId: text('active_revision_id').notNull(),
	themeId: text('theme_id').notNull(),
	cornerStyle: text('corner_style').notNull(),
	cornerRadiusRem: real('corner_radius_rem').notNull().default(CORNER_RADIUS_LIMITS.defaultRem),
	cursorPackUuid: text('cursor_pack_uuid'),
	buildConfigJson: text('build_config_json').notNull(),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull()
});

export const uiProjectRevisions = sqliteTable('ui_project_revisions', {
	id: text('id').primaryKey(),
	projectId: text('project_id').notNull(),
	hlcTimestamp: text('hlc_timestamp').notNull(),
	parentRevisionId: text('parent_revision_id'),
	nodesJson: text('nodes_json').notNull(),
	authorOrigin: text('author_origin').notNull(),
	createdAt: integer('created_at').notNull()
});

export const aiProviderProfiles = sqliteTable('ai_provider_profiles', {
	id: text('id').primaryKey(),
	label: text('label').notNull(),
	providerKind: text('provider_kind').notNull(),
	baseUrl: text('base_url').notNull(),
	modelId: text('model_id').notNull(),
	vaultSecretCipher: text('vault_secret_cipher'),
	secretMask: text('secret_mask'),
	temperature: integer('temperature').notNull().default(30),
	maxTokens: integer('max_tokens').notNull().default(2048),
	persona: text('persona').notNull().default('architect'),
	isDefault: integer('is_default').notNull().default(0),
	updatedAt: integer('updated_at').notNull()
});

export const aiChatMessages = sqliteTable('ai_chat_messages', {
	id: text('id').primaryKey(),
	projectId: text('project_id').notNull(),
	role: text('role').notNull(),
	content: text('content').notNull(),
	toolCallsJson: text('tool_calls_json').notNull(),
	revisionId: text('revision_id'),
	createdAt: integer('created_at').notNull()
});

export const connectorConfigs = sqliteTable('connector_configs', {
	id: text('id').primaryKey(),
	connectorId: text('connector_id').notNull(),
	label: text('label').notNull(),
	configJson: text('config_json').notNull(),
	createdAt: integer('created_at').notNull()
});

export const exportJobs = sqliteTable('export_jobs', {
	id: text('id').primaryKey(),
	projectId: text('project_id').notNull(),
	adapterId: text('adapter_id').notNull(),
	checksum: text('checksum').notNull(),
	artifactMetaJson: text('artifact_meta_json').notNull(),
	createdAt: integer('created_at').notNull()
});

export const uiEntities = sqliteTable('ui_entities', {
	uuid: text('uuid').primaryKey(),
	projectUuid: text('project_uuid').notNull(),
	parentUuid: text('parent_uuid'),
	zoneId: text('zone_id').notNull(),
	kind: text('kind').notNull(),
	label: text('label').notNull(),
	shape: text('shape').notNull(),
	lifecycle: text('lifecycle').notNull(),
	hlcTimestamp: text('hlc_timestamp').notNull(),
	propsJson: text('props_json').notNull(),
	updatedAt: integer('updated_at').notNull()
});
