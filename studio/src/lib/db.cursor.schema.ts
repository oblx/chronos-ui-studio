import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const cursorPacks = sqliteTable('cursor_packs', {
	uuid: text('uuid').primaryKey(),
	slug: text('slug').notNull().unique(),
	name: text('name').notNull(),
	description: text('description').notNull(),
	isBuiltin: integer('is_builtin').notNull().default(0),
	derivedFromUuid: text('derived_from_uuid'),
	sourcePngDataUrl: text('source_png_data_url'),
	baseHotspotX: integer('base_hotspot_x').notNull().default(3),
	baseHotspotY: integer('base_hotspot_y').notNull().default(2),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull()
});

export const cursorStateAssets = sqliteTable('cursor_state_assets', {
	uuid: text('uuid').primaryKey(),
	packUuid: text('pack_uuid').notNull(),
	cssState: text('css_state').notNull(),
	assetDataUrl: text('asset_data_url').notNull(),
	hotspotX: integer('hotspot_x').notNull().default(3),
	hotspotY: integer('hotspot_y').notNull().default(2),
	generatorOrigin: text('generator_origin').notNull(),
	updatedAt: integer('updated_at').notNull()
});
