# Chapter 5: Dual-Spine MCP & Agent Orchestration

Chronos UI Studio exposes two complementary Model Context Protocol spines so agents synthesize artifacts, calibrate geometry and cursors, orchestrate stations and zones, and drive live sessions across 33 parity tools.

## Builder Spine (`/api/mcp` & `stdio`)

- `ui_list_primitives` — Enumerates all atoms, molecules, organisms, 14 frame shapes, 8 motion presets, and theme packs.
- `ui_probe_environment` & `ui_get_viewport_occupancy` — Reports AI capabilities and verifies zero safe-corridor collisions.
- `ui_save_project`, `ui_clean_project`, `ui_reset_workspace_view` — Commits snapshots, restores Calm Empty Stage, or resets HUD defaults.
- `ui_list_cursor_packs`, `ui_apply_cursor_pack`, `ui_derive_cursor_states` — Manages and synthesizes 21-state CSS UI Level 4 pointer packs.
- `ui_set_corner_radius`, `ui_configure_station_layer`, `ui_edit_zone_disposition`, `ui_move_entity_to_zone`, `ui_open_station_builder`, `ui_open_zone_edition` — Tunes global/per-node `--ui-corner-cut`, configures all 4 architectural station layers, mirrors and edits 11 perimeter zones, and relocates entities live.
- `ui_spawn_node`, `ui_configure_node`, `ui_patch_document`, `ui_export_static` — Manipulates normalized trees via RFC 6902 patches and exports production Vite static builds.

## Twin Live-Studio Spine (`/api/mcp/twin`)

- `ui_twin_list_sessions` — Lists active browser studio sessions connected via `/api/ws/collab`.
- `ui_twin_dispatch_intent` — Pushes live `DagEnvelope` intents directly into an open Studio session.
- `ui_twin_capture_wire_trace` — Reads unified `CLIENT_DAG` and `SERVER_DAG` ring telemetry.
