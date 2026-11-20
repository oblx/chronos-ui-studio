---
name: chronos-mcp-parity
description: Design, register, and invoke 35-tool Human-Agent Parity commands across STUDIO_TOOL_REGISTRY, Builder MCP (/api/mcp and mcp:stdio), and Twin Live-Studio MCP (/api/mcp/twin) with RBAC masks, RFC 6902 JSON Patch inverse undo, and Governance Gate safety. Use when adding or debugging Studio tools, PAT auth, or live agent driving.
license: MIT
compatibility: Model Context Protocol JSON-RPC 2.0, Bun SQLite WAL
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.0.9"
allowed-tools: view_file replace_file_content run_command
---

# Dual-Spine MCP & Human-Agent Parity (35 Tools)

Every user canvas, lifecycle, entity, theme, station, zone, geometry, studio default, and cursor action MUST have a 1:1 declarative counterpart in `STUDIO_TOOL_REGISTRY` (`studio/src/core/engine/tool.registry.ts`).

## Spine Endpoints

1. **Manifest Discovery**: `GET /api/mcp/manifest` exposes the live 35-tool JSON Schema catalog (`READ_BLUEPRINTS`, `WRITE_BLUEPRINTS`, `WRITE_THEMES`, `MANAGE_WEBHOOKS`, `ADMIN_WIRE_OBSERVE`, `ADMIN_MCP_TWIN`).
2. **Builder Spine**: `POST /api/mcp` and `bun run mcp:stdio` execute structural mutations (`ui_spawn_node`, `ui_configure_node`, `ui_patch_document`, `ui_set_corner_radius`, `ui_configure_studio_defaults`, `ui_reset_studio_defaults`, `ui_configure_station_layer`, `ui_edit_zone_disposition`, `ui_move_entity_to_zone`, `ui_save_project`, `ui_clean_project`, `ui_load_sample`, `ui_export_static`, `ui_apply_cursor_pack`, `ui_derive_cursor_states`).
3. **Twin Spine**: `POST /api/mcp/twin` authenticates a PAT (`bun run mcp:token -- --label agent --caps 28`) and dispatches `ui_twin_dispatch_intent` into connected `/api/ws/collab` browser sessions.

## Adding or Extending a Tool cleanly

1. Declare descriptor metadata (`name`, `humanTitle`, `plainDescription`, `intentKind`, `requiredCapabilityBit`, `inputSchema`, `outputSchema`, `annotations`) in `tool.registry.ts`, `entity.tools.ts`, `station.tools.ts`, or `cursor.synthesizer.ts`.
2. Implement the pure executor in `studio/src/mcp/mcp.project.tools.ts`, `mcp.entity.tools.ts`, `mcp.station.tools.ts`, or `mcp.cursor.tools.ts`.
3. Route any graph edits through `applyJsonPatchWithInverse` + `evaluateGovernanceGate` (cycle check, XSS block, RBAC mask) before `commitProjectRevision`.
4. Assert 1:1 `tools/list` parity in `studio/src/tests/v006_lifecycle_shapes_cursors.test.ts`, `v007_geometry_cursor_stations.test.ts`, and `v008_aliases_embellishments_knobs.test.ts`.
