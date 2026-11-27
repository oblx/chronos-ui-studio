---
name: chronos-cursor-studio
description: Authoring and verifying bespoke 21-state concrete-hex CSS UI Level 4 cursor silhouettes, hotspot calibration, and polarity-reactive SVG synthesis for @chronos-ui/svelte.
license: MIT
metadata:
  author: Oblx <code@oblx.dev>
  version: "0.1.2"
---

# Chronos 21-State Cursor Studio (`v0.1.2`)

Use this skill when modifying `@chronos-ui/svelte/cursor`, built-in cursor packs, or the Cursor Studio workbench modal.

## Tip-Clean Frameless Silhouette & Browser Invariants

1. **Tip-Clean Frameless 21-State Silhouettes**: `cursor.silhouettes.ts` defines 21 genuinely distinct `32x32` architectural vectors with zero stray pixels ahead of `(hx, hy)` and zero decorative corner brackets on all 17 non-drag states. Optional corner-bracket targets (`data-drag-target-frame="true"`) are gated strictly to `CURSOR_DRAG_TARGET_STATES` (`grab`, `grabbing`, `copy`, `alias`) via `cursorDragTargetFrames`.
2. **Concrete-Hex SVG Data URIs**: Never embed CSS `var(--ui-*)` inside `data:image/svg+xml,...` cursor URIs. Always resolve active theme polarity (`fillHex`, `strokeHex`, `accentHex`, `errorHex`) via `resolveThemeCursorPalette(theme)` before calling `applyCursorPackToDocument(pack, palette)`.
3. **Calibrated Hotspots & Normalized Dimensions**: All states normalize to $32\text{px} \times 32\text{px}$ (`<= 128 KB`) with integer hotspots from `CURSOR_CALIBRATED_HOTSPOTS` clamped to `[0, 31]`.
4. **Live Polarity Cascade & Cohesive Packs**: All 4 built-in packs (`Cyber Reticle`, `Minimal Precision`, `HUD Crosshair`, `Studio Ink`) share theme polarity cohesion and re-emit live CSS on `UI_TOGGLE_POLARITY` and `UI_SET_STUDIO_DEFAULT`.
5. **Silhouette-Aware Synthesizer**: `studio/src/core/engine/cursor.synthesizer.ts` derives custom packs using `buildBespokeCursorBody` and `CURSOR_CALIBRATED_HOTSPOTS`.
