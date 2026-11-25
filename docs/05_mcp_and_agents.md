# Chapter 5: Dual-Spine MCP & Agent Orchestration

Chronos UI Studio (`v0.1.0`) exposes two complementary Model Context Protocol spines generated 1:1 from `STUDIO_TOOL_REGISTRY` (`42` parity tools) via modular `studio/src/mcp/tools/` handlers.

## Builder Spine (`/api/mcp`, `/api/mcp/manifest` & `stdio`)

- `ui_list_primitives` & `ui_probe_environment` — Enumerates all atoms, molecules, organisms, 14 frame shapes, 8 motion presets, 6 theme packs, and active AI capabilities.
- `ui_get_viewport_occupancy` — Verifies zero safe-corridor collisions and `OVERLAY_HOVER` invariance across Calm and Studio HUD modes.
- `ui_save_project`, `ui_clean_project`, `ui_reset_workspace_view` — Commits snapshots, clears nodes + persisted chat history (`hasBuiltOnce = 0`) to restore Calm Empty Stage, or resets HUD defaults.
- `ui_list_cursor_packs`, `ui_apply_cursor_pack`, `ui_derive_cursor_states` — Manages and synthesizes concrete-hex 21-state CSS UI Level 4 pointer packs.
- `ui_set_corner_radius`, `ui_configure_studio_defaults`, `ui_configure_station_layer`, `ui_edit_zone_disposition`, `ui_move_entity_to_zone`, `ui_open_wireframe_skeleton` — Calibrates parametric geometry, station layers, 11-zone bilateral mirrors, and CS6 Wireframe Skeleton workbench.
- `ui_spawn_node`, `ui_configure_node`, `ui_patch_document`, `ui_export_static`, `ui_export_fullstack_bundle` — Applies RFC 6902 patches and emits W3C/WebMCP static sites or vendored SQLite + Drizzle full-stack bundles.

## Twin Live-Studio Spine (`/api/mcp/twin`)

- `ui_twin_list_sessions` — Lists active browser studio sessions connected via `/api/ws/collab`.
- `ui_twin_dispatch_intent` — Pushes live `DagEnvelope` intents directly into an open Studio session.
- `ui_twin_capture_wire_trace` — Reads unified `CLIENT_DAG` and `SERVER_DAG` ring telemetry.
