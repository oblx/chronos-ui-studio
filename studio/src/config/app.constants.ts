const env = typeof process !== 'undefined' ? process.env : undefined;

export const STUDIO_CONFIG = {
	appName: 'Chronos UI Studio',
	defaultPort: 3000,
	viteDevPort: 3001,
	dbPath: env?.CHRONOS_DB_PATH ?? 'studio/data/chronos.sqlite',
	sessionCookieName: 'chronos_session',
	tokenPrefix: 'chr_live_',
	sessionTtlMs: 1000 * 60 * 60 * 24 * 7,
	cursorBroadcastHz: 20,
	collabPollIntervalMs: 2500,
	webhookTimeoutMs: 4000,
	minPasswordLength: 8,
	maxTokenLabelLength: 64,
	defaultBlueprintId: 'bp-telemetry-command',
	devSeed: {
		ownerId: 'usr-architect',
		email: env?.CHRONOS_DEV_EMAIL ?? 'architect@chronos.local',
		password: env?.CHRONOS_DEV_PASSWORD ?? 'chronos-dev-admin',
		displayName: 'Lead Architect'
	}
} as const;

export const CAPABILITY_BITS = {
	READ_BLUEPRINTS: 0,
	WRITE_BLUEPRINTS: 1,
	WRITE_THEMES: 2,
	MANAGE_WEBHOOKS: 3,
	ADMIN_WIRE_OBSERVE: 28,
	ADMIN_MCP_TWIN: 29
} as const;
