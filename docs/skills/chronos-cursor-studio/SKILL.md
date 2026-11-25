---
name: chronos-cursor-studio
description: Authoring and verifying 21-state concrete-hex CSS UI Level 4 cursor packs, hotspot calibration, and polarity-reactive SVG synthesis for @chronos-ui/svelte.
license: MIT
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.1.0"
---

# Chronos 21-State Cursor Studio (`v0.1.0`)

Use this skill when modifying `@chronos-ui/svelte/cursor`, built-in cursor packs, or the Cursor Studio workbench modal.

## Concrete-Hex & Browser Invariants

1. **21-State CSS UI Level 4 Coverage**: Every pack provides complete rules for all 21 pointer states (`default`, `pointer`, `text`, `move`, `grab`, `grabbing`, `not-allowed`, `wait`, `progress`, `help`, `crosshair`, `cell`, `copy`, `alias`, `context-menu`, `col-resize`, `row-resize`, `ew-resize`, `ns-resize`, `nesw-resize`, `nwse-resize`).
2. **Concrete-Hex SVG Data URIs**: Never embed CSS `var(--ui-*)` inside `data:image/svg+xml,...` cursor URIs (browsers ignore CSS variables inside external image data URIs). Always resolve active theme polarity via `resolveThemeCursorPalette(theme)` before calling `applyCursorPackToDocument(pack, palette)`.
3. **Normalized Dimensions & Hotspot Bounds**: Built-in and uploaded PNG assets normalize to $32\text{px} \times 32\text{px}$ (`<= 128 KB`), with integer hotspot coordinates clamped to `[0, 31]`.
4. **Live Polarity Cascade**: Toggling `dark <-> light` polarity (`UI_TOGGLE_POLARITY`) or switching theme packs immediately re-emits the concrete-hex cursor stylesheet via `syncThemeAndCursor`.
5. **Export Fidelity**: Static and full-stack exports emit the active 21-state cursor CSS alongside `--ui-corner-cut` and `CALM_SLOW` motion tokens.
