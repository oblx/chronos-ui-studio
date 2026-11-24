# Chapter 2: The 11-Zone Clockwise Perimeter

`UiPerimeterHud` orchestrates eleven spatial zones around `X = 50vw` bilateral symmetry without obscuring or shifting the primary stage.

## Zone Map

1. `WORLD_CANVAS` — Full-viewport $100\text{vw} \times 100\text{vh}$ pan/zoom stage with inner chamfered safe frame.
2. `TOP_LEFT` — System badge, grade (`A`–`F`), and level progress gauge (`height: 6.25rem`).
3. `TOP_CENTER` & `PROJECT_TAB_DECK` — Primary projection bar (`3.125rem`) and workspace deck (`2.375rem`).
4. `TOP_RIGHT` — Bilateral mirror of `TOP_LEFT` housing session status and five $2\text{rem} \times 2\text{rem}$ utility triggers.
5. `RIGHT_EDGE` & `LEFT_EDGE` — $3.25\text{rem}$ chamfered mini-rails (`z-index: 35`) with dotted-grip drag/float and elevated overlay drawers (`z-index: 36`) anchored flush to `--ui-safe-left`/`--ui-safe-right` with $0\text{px}$ workspace width displacement.
6. `BOTTOM_LEFT`, `BOTTOM_CENTER`, `BOTTOM_RIGHT` — Unified $8.25\text{rem}$ bottom dock housing live telemetry, flush `UiAssistantDock` (`z-index: 45`), and 3-column Bento Radar.
7. `MODAL_OVERLAY_STACK` — Pure-Flex centered modal stack (`z-index: 70`) with universal Grow/Shrink (`Alt+M`) and $0\text{px}$ canvas displacement.
