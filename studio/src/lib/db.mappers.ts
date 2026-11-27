import {
	clampCornerRadiusRem, clampStudioDefaults, CORNER_RADIUS_LIMITS, DEFAULT_STUDIO_DEFAULTS, STUDIO_DEFAULTS_VERSION,
	type AssistantMessage, type CornerKind, type CssCursorState, type CursorGeneratorOrigin, type CursorPackDefinition,
	type CursorStateAsset, type SemanticTokenMap, type StudioDefaultsConfig, type UiNodeTree, type UiProjectBuildConfig, type UiProjectDefinition
} from '@chronos-ui/svelte';
import type { UiBlueprint } from '../config';
import type { AiProviderKind } from '../core';
import type { cursorPacks, cursorStateAssets } from './db.cursor.schema';
import type { aiChatMessages, aiProviderProfiles, blueprints, themes, uiProjects } from './db.schema';

function normalizeCornerMode(raw: string): CornerKind {
	if (raw === 'STRAIGHT' || raw === 'ROUND' || raw === 'CHAMFER') return raw;
	return 'CHAMFER';
}

export function migrateLegacyStudioDefaults(
	raw: Partial<StudioDefaultsConfig> | undefined,
	legacyCornerRadiusRem?: number
): StudioDefaultsConfig {
	const hasV2BaseCut = typeof raw?.defaultsVersion === 'number' && raw.defaultsVersion >= 2;
	const rawBase = raw?.baseCornerCutRem ?? legacyCornerRadiusRem;
	const isLegacyDefault = !hasV2BaseCut && (rawBase === undefined || rawBase === 0.75);
	const resolvedBase = isLegacyDefault ? CORNER_RADIUS_LIMITS.defaultRem : clampCornerRadiusRem(rawBase);
	return clampStudioDefaults(
		{ ...raw, baseCornerCutRem: resolvedBase, defaultsVersion: STUDIO_DEFAULTS_VERSION },
		{ ...DEFAULT_STUDIO_DEFAULTS, baseCornerCutRem: resolvedBase }
	);
}

export function mapBlueprintRow(row: typeof blueprints.$inferSelect): UiBlueprint {
	return {
		id: row.id, name: row.name, description: row.description, themeId: row.themeId,
		cornerMode: normalizeCornerMode(row.cornerMode),
		starred: row.starred === 1, version: row.version, zones: JSON.parse(row.zonesJson)
	};
}

export function mapThemeRow(row: typeof themes.$inferSelect) {
	return {
		id: row.id, name: row.name, polarity: row.polarity as 'dark' | 'light',
		tokens: JSON.parse(row.tokensJson) as SemanticTokenMap, starred: row.starred === 1, updatedAt: row.updatedAt
	};
}

export function mapProjectRow(row: typeof uiProjects.$inferSelect, nodes: UiNodeTree): UiProjectDefinition {
	const rawDefaults = row.studioDefaultsJson ? (JSON.parse(row.studioDefaultsJson) as Partial<StudioDefaultsConfig>) : undefined;
	const studioDefaults = migrateLegacyStudioDefaults(rawDefaults, row.cornerRadiusRem);
	return {
		id: row.id, slug: row.slug, name: row.name, description: row.description,
		themeId: row.themeId, cornerMode: normalizeCornerMode(row.cornerStyle),
		cornerRadiusRem: studioDefaults.baseCornerCutRem, studioDefaults,
		hasBuiltOnce: row.hasBuiltOnce === 1,
		...(row.cursorPackUuid ? { activeCursorPackId: row.cursorPackUuid } : {}),
		activeRevisionId: row.activeRevisionId, nodes,
		buildConfig: JSON.parse(row.buildConfigJson) as UiProjectBuildConfig, updatedAt: row.updatedAt
	};
}

export function mapAiProfileRow(row: typeof aiProviderProfiles.$inferSelect) {
	return {
		id: row.id, label: row.label, providerKind: row.providerKind as AiProviderKind,
		baseUrl: row.baseUrl, modelId: row.modelId, hasSecret: Boolean(row.vaultSecretCipher),
		secretMask: row.secretMask ?? '', temperature: row.temperature / 100,
		maxTokens: row.maxTokens, persona: row.persona, isDefault: row.isDefault === 1, updatedAt: row.updatedAt
	};
}

export function mapChatMessageRow(row: typeof aiChatMessages.$inferSelect): AssistantMessage {
	return {
		id: row.id, role: row.role as AssistantMessage['role'], content: row.content,
		toolCalls: JSON.parse(row.toolCallsJson), revisionId: row.revisionId ?? undefined, createdAt: row.createdAt
	};
}

export function mapCursorPackRow(
	pack: typeof cursorPacks.$inferSelect,
	assets: readonly (typeof cursorStateAssets.$inferSelect)[]
): CursorPackDefinition {
	const states = {} as Record<CssCursorState, CursorStateAsset>;
	for (const a of assets) {
		states[a.cssState as CssCursorState] = {
			uuid: a.uuid,
			cssState: a.cssState as CssCursorState,
			assetDataUrl: a.assetDataUrl,
			hotspotX: a.hotspotX,
			hotspotY: a.hotspotY,
			generatorOrigin: a.generatorOrigin as CursorGeneratorOrigin
		};
	}
	return {
		uuid: pack.uuid, slug: pack.slug, name: pack.name, description: pack.description,
		isBuiltin: pack.isBuiltin === 1, derivedFromUuid: pack.derivedFromUuid,
		sourcePngDataUrl: pack.sourcePngDataUrl, baseHotspotX: pack.baseHotspotX,
		baseHotspotY: pack.baseHotspotY, states
	};
}
