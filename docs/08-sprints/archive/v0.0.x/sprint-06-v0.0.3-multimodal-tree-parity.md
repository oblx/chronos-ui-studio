# Sprint 06 — v0.0.3 Persistent Drag, RFC 6902 Tree, Tool Parity & Multimodal Ports

Author: Oblx <code@oblx.dev> | Release Lock: `@chronos-ui/svelte` (`v0.0.3`)

## Scope & S0 Remediation

1. Persistent Floating Assistant Drag (S0): Promoted `assistantDock` (`mode`, `expanded`, `xRem`, `yRem`) into `UiWireBroker` state. Mounted chamfered dotted grip handle (`assistant-drag-grip`) inside `UiAssistantDock` with capture-phase click suppression on drag (`> 4px`). Assistant detaches to `FLOATING` on first drag pixel without jump, stays permanently anchored across renders, prompts, and expand toggles, and returns to `BOTTOM_CENTER` exclusively via `[ Dock ]` (`UI_ASSISTANT_DOCK`) or `/dock`.
2. Visual Symmetry & Typography: Applied exact bilateral mirror corner tuples (`mirrorCornerTuple`) across $X = 50\text{vw}$ on `CalmTopStrip`, replaced corporate prefix with active project title plus subtle `v0.0.3` badge, and applied `text-wrap: balance` (`max-w-[34rem]`) to the empty-stage headline.

## Core Engine & Human-Agent Parity

1. RFC 6902 JSON Patch Engine (`studio/src/core/engine/json.patch.ts`): Full `add`, `remove`, `replace`, `move`, `copy`, and `test` implementation emitting symmetric `inverse` patches satisfying $\text{apply}(\text{apply}(D, P), P^{-1}) = D$.
2. Normalized Document Graph & Infinite Derivation (`document.tree.ts`): Indexed `UiDocumentGraph` with `UiComponentPrototype`, `derivePrototypeFromNode`, `instantiateFromPrototype`, and cycle-guarded `resolveEffectiveNodeProps`.
3. Governance Gate (`governance.gate.ts`): Enforces u32 RBAC capability masks, tree depth $\le 8$, total node count $\le 350$, acyclic prototype inheritance, and XSS payload blocking.
4. Canonical Tool Registry (`tool.registry.ts`): Single `STUDIO_TOOL_REGISTRY` conforming to MCP Tools Spec (`inputSchema`, `outputSchema`, `annotations`) drives both `/api/mcp` (`tools/list`) and the clickable visual `StudioToolPalettePanel`.

## Starter Samples & Multimodal Input Ports

1. Four Choreographed Starter Samples (`sample.projects.ts`): Neon Ops Command Deck, Bio-Telemetry Lab, Synth Audio Console, and Writer's Focus Cockpit with 75 ms zone-band stagger honoring `prefers-reduced-motion`.
2. Zero-Dependency Multimodal Input (`packages/chronos-ui/src/input/`): Spatial WAI-ARIA focus walker, Web Speech API + `SpeechToTextPort` fallback voice adapter, and W3C Gamepad API adapter with Xbox (`045e`) & PS5 DualSense (`054c:0ce6`) profiles, radial deadzone $d = 0.18$, and optional `dual-rumble` haptic cues.
