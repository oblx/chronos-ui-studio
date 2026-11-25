# Chapter 2: The 11-Zone Clockwise Perimeter

`UiPerimeterHud` orchestrates eleven spatial zones around $X = 50\text{vw}$ bilateral symmetry without obscuring or shifting the primary stage.

## Zone Map & Overlay Invariance

1. `WORLD_CANVAS` — Full-viewport $100\text{vw} \times 100\text{vh}$ pan/zoom stage with inner chamfered safe frame whose width and height remain strictly invariant ($0\text{px}$ delta) when edge drawers or `UiAssistantDock` unfold.
2. `TOP_LEFT` — Unified `ProjectLifecyclePod` (`Save` + `Reset` recovery popover shared across Calm and Studio HUD modes), system badge, grade (`A`–`F`), and level progress gauge (`height: 6.25rem`).
3. `TOP_CENTER` & `PROJECT_TAB_DECK` — Symmetric 3-column projection bar (`3.125rem`) anchoring the reciprocal `Calm View` / `Studio HUD` toggle at $X = 50\text{vw}$ ($\Delta x \le 16\text{px}, \Delta y \le 8\text{px}$) and workspace deck (`2.375rem`).
4. `TOP_RIGHT` — Bilateral mirror of `TOP_LEFT` housing session status and five $2\text{rem} \times 2\text{rem}$ utility triggers.
5. `RIGHT_EDGE` & `LEFT_EDGE` — $3.25\text{rem}$ chamfered mini-rails (`z-index: 35`) separating tabs from `⋮⋮` (`use:uiFoldGrip`, `axis: 'HORIZONTAL'`) via a hairline divider, opening elevated `OVERLAY_HOVER` drawers (`z-index: 36`) flush to `--ui-safe-left`/`--ui-safe-right`.
6. `BOTTOM_LEFT`, `BOTTOM_CENTER`, `BOTTOM_RIGHT` — Unified $8.25\text{rem}$ bottom dock housing live telemetry, `OVERLAY_HOVER` `UiAssistantDock` (`z-index: 38`, `axis: 'VERTICAL'`, sticky transcript header + discrete tool chips + deterministic `Build` / `Send` CTA), and 3-column Bento Radar.
7. `MODAL_OVERLAY_STACK` — Pure-Flex centered modal stack (`z-index: 70`) with universal Grow/Shrink (`Alt+M`) and $0\text{px}$ canvas displacement.
