---
name: chronos-cursor-studio
description: Implement, synthesize, validate, and apply 21-state hardened CSS UI Level 4 pointer packs via @chronos-ui/svelte/cursor, CursorStudioModal, Drizzle cursor_packs/cursor_state_assets, PNG <= 128 KB magic-byte checks, and AI/procedural 20-state derivation. Use when customizing cursors, hotspots, or cursor CSS exports.
license: MIT
compatibility: Svelte 5 Runes, Drizzle Bun SQLite WAL, Zero Runtime Dependencies
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.0.12"
allowed-tools: view_file replace_file_content run_command
---

# Full-State CSS Cursor Studio (`@chronos-ui/svelte/cursor`)

Orchestrate all 21 `CSS_CURSOR_STATES` across live DOM selectors (`--ui-cursor-default` through `--ui-cursor-zoom-out`) with `!important` backdrop/grip coverage and zero external asset binaries.

## Runtime & Schema Architecture

1. **Zero-Dep Package Runtime (`packages/chronos-ui/src/cursor/`)**: Manage a single `<style data-ui-cursor-sheet="true">` stylesheet via `resolveThemeCursorPalette()` + `buildCursorPackCss()` + `applyCursorPackToDocument()`, emitting concrete `%23rrggbb` hex colors (zero `var(--)` tokens inside SVG data URIs), explicit `xmlns` & `32x32` dimensions, full `html, body, #app, [data-ui-root]` coverage, all 21 `.cursor-*` overrides, and live re-emit on theme/polarity switch.
2. **Curated Builtins**: Ship 4 crisp vector packs (`Cyber Reticle`, `Archival Nib`, `Tactical Brass`, `Minimal Precision`) plus one-click fork/re-derivation into custom packs.
3. **Drizzle Persistence (`db.cursor.schema.ts`)**: Store `cursor_packs` (RFC 9562 UUID v7 PK, `derivedFromUuid` chain, base hotspot) and 21 linked `cursor_state_assets` rows via atomic `db.transaction` mirrored to IndexedDB and bundled into `static-site-build` exports.

## PNG Upload & 20-State Derivation Rules

1. Enforce `CURSOR_LIMITS` (`maxBytes = 131072` / `maxKb = 128`, magic bytes `89 50 4E 47 0D 0A 1A 0A`, dimensions `4..256`, browser auto-downscale `> 48px -> 32x32`).
2. Default synthesis palette binds directly to `THEME_PACKS[0].tokens` (`--ui-accent-vivid`, `--ui-base-100`, `--ui-primary`, `--ui-base-content`) with a declarative 21-state `Map` and zero hardcoded hex colors in synthesizer code.
3. Expose full parity on REST (`GET/POST /api/cursors`, `POST /api/cursors/:uuid/derive-states`, `PATCH /api/cursors/:uuid/states/:state`) and MCP (`ui_list_cursor_packs`, `ui_apply_cursor_pack`, `ui_derive_cursor_states`).
