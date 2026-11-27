---
name: chronos-mcp-parity
description: Maintains 1:1 parity across STUDIO_TOOL_REGISTRY, Dual-Spine MCP handlers (/api/mcp, /api/mcp/twin, stdio), and Companion Builder Studio client intents.
license: MIT
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.1.2"
---

# Chronos Dual-Spine MCP Parity (`v0.1.2`)

Use this skill when adding or modifying Studio capabilities, MCP tools, slash commands, or client wire intents.

## Single Source of Truth Rules

1. **Declarative Registry**: Declare every tool once inside `STUDIO_TOOL_REGISTRY` (`studio/src/core/engine/`), spanning `50` parity tools including `ui_configure_graph`, `ui_set_wire_timescale`, `ui_configure_controls`, `ui_set_history_limit`, `ui_undo`, `ui_redo`, `ui_replay_hud_sequence`, and `ui_set_tooltip_info_level`.
2. **Modular Handler Barrels**: Implement Builder Spine handlers inside `studio/src/mcp/tools/` (`mcp.v011.tools.ts`, `mcp.project.tools.ts`, `mcp.station.tools.ts`, `mcp.entity.tools.ts`, `mcp.cursor.tools.ts`) keeping every directory at $\le 8$ files.
3. **Builder & Twin Spines**:
	- Builder Spine (`/api/mcp` & `bun run mcp:stdio`) mutates persisted Drizzle SQLite projects, studio defaults, revisions, and blueprints, returning structured JSON + `clientIntents`.
	- Twin Live-Studio Spine (`/api/mcp/twin`, `/api/mcp/manifest`, `/api/ws/collab`) synchronizes live browser sessions, dispatches `DagEnvelope` intents, and streams unified `CLIENT_DAG` + `SERVER_DAG` ring telemetry (`SERVER_MANIFEST_SYNCED`).
4. **100% Real-Action Header & Rail Intents**: Every `TOP_CENTER` view tab (`Workbench`, `Tokens`, `Decks`, `Twin MCP`) and utility trigger dispatches real client or server-backed state transitions (`UI_SET_ACTIVE_VIEW`, `SERVER_MANIFEST_SYNCED`).
5. **Security & Auth**: Enforce bearer PAT (`bun run mcp:token`) or session cookie checks and SSRF URL guards (`studio/src/core/ssrf.guard.ts`) on all external provider webhooks.
