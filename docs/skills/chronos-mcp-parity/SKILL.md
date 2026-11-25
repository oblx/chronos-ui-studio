---
name: chronos-mcp-parity
description: Maintains 1:1 parity across STUDIO_TOOL_REGISTRY, Dual-Spine MCP handlers (/api/mcp, /api/mcp/twin, stdio), and Companion Builder Studio client intents.
license: MIT
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.1.0"
---

# Chronos Dual-Spine MCP Parity (`v0.1.0`)

Use this skill when adding or modifying Studio capabilities, MCP tools, slash commands, or client wire intents.

## Single Source of Truth Rules

1. **Declarative Registry**: Declare every tool once inside `STUDIO_TOOL_REGISTRY` (`studio/src/core/engine/`), currently spanning `42` parity tools across primitives, canvas nodes, themes, 21-state cursors, station layers, 11-zone dispositions, lifecycle snapshots, exports, and Twin live-session telemetry.
2. **Modular Handler Barrels**: Implement Builder Spine handlers inside `studio/src/mcp/tools/` (re-exported via `studio/src/mcp/index.ts`) and keep every directory at $\le 8$ files.
3. **Builder & Twin Spines**:
	- Builder Spine (`/api/mcp` & `bun run mcp:stdio`) mutates persisted Drizzle SQLite projects, revisions, and blueprints, returning structured JSON + `clientIntents`.
	- Twin Live-Studio Spine (`/api/mcp/twin` & `/api/ws/collab`) lists active browser sessions, dispatches live `DagEnvelope` intents, and streams unified `CLIENT_DAG` + `SERVER_DAG` ring telemetry.
4. **Assistant & Lifecycle Sync**: `ui_clean_project` and `POST /api/projects/:id/clean` clear both project nodes and persisted `ai_chat_messages` while resetting `hasBuiltOnce = 0`, keeping `Build -> Send` CTA state deterministic across reloads.
5. **Security & Auth**: Enforce bearer PAT (`bun run mcp:token`) or session cookie checks and SSRF URL guards (`studio/src/core/ssrf.guard.ts`) on all external provider webhooks.
