# Chapter 3: Semantic Tokens, Corner Geometry & Bounded Tooltips

Every surface, border, and glyph binds to semantic CSS variables resolved from `:root[data-ui-theme]` and `:root[data-ui-polarity="dark|light"]`, exported tree-shakeably via `@chronos-ui/svelte/tokens`.

## Bilateral Corner Symmetry & 14 True-Contour Shapes

Each panel accepts a four-vertex tuple $T = [\text{TL}, \text{TR}, \text{BR}, \text{BL}]$ where each vertex is `CHAMFER`, `ROUND`, or `STRAIGHT` across 3 parametric tiers (`0.5rem` base, `0.75rem` stations/modals, `0.3125rem` controls clamped at $\le 28\%$ height). Right-perimeter components mirror their left twin via $\text{mirror}([\text{TL}, \text{TR}, \text{BR}, \text{BL}]) = [\text{TR}, \text{TL}, \text{BL}, \text{BR}]$, while `tokens/geometry/` generates continuous SVG paths for all 14 UML/diagram hulls and 9 corner embellishments.

## Bounded Multi-Paragraph Tooltips

`UiCyberTooltip` parses structured `data-ui-tip` strings (`\n\n` paragraphs, `\n` line breaks, optional bold title, and `[Key]` shortcut badges) inside a `ResizeObserver`-synced `UiChamferFrame` (`min-w-[8rem]`, `max-w-[20rem]`, `whitespace-normal break-words`). Post-layout clamping enforces $0\text{px}$ text overflow and $\ge 8\text{px}$ viewport margin across $390\text{px}$–$2560\text{px}$.

## WCAG Contrast Verification

Six curated palettes (`Obsidian Brass`, `Phosphor CRT`, `Tokyo Phosphor`, `Alabaster Lab`, `Archival Vellum`, `Daylight Blueprint`) satisfy relative luminance contrast $C = (L_1 + 0.05) / (L_2 + 0.05) \ge 4.5$ across primary and muted surfaces, cascading concrete hex colors into all 21 CSS cursor states.
