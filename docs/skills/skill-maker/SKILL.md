---
name: skill-maker
description: Author, review, and validate AgentSkills-compliant SKILL.md files under docs/skills/ using the https://agentskills.io/specification standard and Chronos repository invariants. Use when creating a new skill, updating stale skills, or auditing frontmatter and line caps.
license: MIT
compatibility: Bun >= 1.4, Chronos QA Harness (studio/src/workers/qa_audit.ts)
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.1.2"
allowed-tools: view_file write_to_file replace_file_content run_command
---

# Skill Maker (`agentskills.io` Specification)

Use this skill whenever crafting or refactoring a skill directory inside `docs/skills/<skill-name>/SKILL.md`.

## Mandatory YAML Frontmatter Contract

1. Every `SKILL.md` MUST begin on line 1 with `---` and close cleanly with `---`.
2. **`name`** (Required): `1..64` chars matching `^[a-z0-9]+(?:-[a-z0-9]+)*$`, and MUST equal its parent folder name exactly (no uppercase, underscores, or consecutive hyphens).
3. **`description`** (Required): `1..1024` chars combining **what the skill does** and **when an agent should load it** (clear trigger keywords).
4. **Optional fields**: `license` (e.g. `MIT`), `compatibility` (`<= 500` chars), `metadata` (`author`, `version`), and `allowed-tools` (space-delimited tool list).

## Chronos Repository Invariants for Skills

1. **Compact Signal (`<= 100 LoC`)**: Keep every `SKILL.md` at or below 100 lines total including frontmatter; move exhaustive lookup tables to optional `references/` markdown files if ever needed.
2. **Zero Fenced Code Blocks**: Never use triple-backtick fences inside `docs/**/*.md`; express commands and identifiers cleanly using inline backticks or ordered lists.
3. **Zero Unicode Emojis**: Forbid `Extended_Pictographic` glyphs so automated `qa_audit.ts` static gates stay green.
4. **Zero Dead External Links**: Ground every path, MCP tool name, CLI script (`package.json`), and symbol strictly in files verified on disk inside this workspace.
5. **Release Freshness**: Keep `metadata.version` synced to `VERSION` (`0.1.2`) so `DOCS_AND_SKILL_FRESHNESS` in `studio/src/workers/qa_audit.ts` stays green.

## Authoring Workflow

1. Audit neighboring files or modules first to gather exact verified symbol names and CLI commands.
2. Create or update `docs/skills/<kebab-case-name>/SKILL.md` with valid frontmatter and structured workflows.
3. Keep instructions imperative, terse, and ordered by blast radius or execution sequence.
4. Validate every skill automatically by running `bun run qa:fast` (`checkSkillFile` + `DOCS_AND_SKILL_FRESHNESS` in `studio/src/workers/qa_audit.ts`).
