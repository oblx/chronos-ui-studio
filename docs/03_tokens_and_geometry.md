# Chapter 3: Semantic Tokens & Corner Geometry

Every surface, border, and glyph binds to semantic CSS variables resolved from `:root[data-ui-theme]` and `:root[data-ui-polarity="dark|light"]`.

## Bilateral Corner Symmetry

Each panel accepts a four-vertex tuple $T = [\text{TL}, \text{TR}, \text{BR}, \text{BL}]$ where each corner is `CHAMFER` or `STRAIGHT`. Right-perimeter components mirror their left counterpart automatically via $\text{mirror}([\text{TL}, \text{TR}, \text{BR}, \text{BL}]) = [\text{TR}, \text{TL}, \text{BL}, \text{BR}]$, ensuring facing channels form parallel $45^\circ$ chevrons.

## WCAG Contrast Verification

Six curated palettes (`Obsidian Brass`, `Phosphor CRT`, `Tokyo Phosphor`, `Alabaster Lab`, `Archival Vellum`, `Daylight Blueprint`) satisfy relative luminance contrast $C = (L_1 + 0.05) / (L_2 + 0.05) \ge 4.5$ across primary and muted surfaces.
