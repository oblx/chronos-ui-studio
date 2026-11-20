# Chapter 4: Acyclic Event DAG & Wire Observatory

All state changes enter as typed `DagEnvelope` frames through `createUiWireBroker` and flow strictly in one topological direction:

$$\text{Input} \to \text{Stage 1 (Validate)} \to \text{Stage 2 (Reduce)} \to \text{Stage 3 (Coalesce Effect)} \to \text{Stage 4 (Ring Telemetry)}$$

## Anti-Poisoning Guarantees

- **Cycle Guard:** Re-entrant dispatches during an active reduction cycle are rejected immediately.
- **Observer Untrack:** DOM `ResizeObserver` measurements compare $\lvert \Delta \rvert > 0.5$ and write inside `untrack(() => ...)`.
- **Map Dispatch:** Intent handlers register declaratively in `Map<IntentKind, IntentHandler>`.
- **Three-Tier Routing:** `TIER_0_LOCAL_UI` updates synchronously, `TIER_1_COALESCED_PERSIST` debounces at $150\text{ms}$ with `BroadcastChannel` sync ($3000\text{ms}$ token rotation grace), and `TIER_2_REALTIME_CLUSTER` streams at $20\text{Hz}$ over WebSockets.
