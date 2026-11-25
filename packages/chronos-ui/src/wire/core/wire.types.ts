export type RoutingTier =
	| 'TIER_0_LOCAL_UI'
	| 'TIER_1_COALESCED_PERSIST'
	| 'TIER_2_REALTIME_CLUSTER';

export type WireSpine = 'CLIENT_DAG' | 'SERVER_DAG';

export type IntentKind =
	| 'UI_SET_THEME'
	| 'UI_TOGGLE_POLARITY'
	| 'UI_SET_ACCESSIBILITY'
	| 'UI_SET_DRAWER_OPEN'
	| 'UI_SET_DRAWER_TAB'
	| 'UI_TOGGLE_DRAWER_FLOAT'
	| 'UI_MOVE_EDGE_RAIL'
	| 'UI_MOVE_FLOATING_DRAWER'
	| 'UI_OPEN_MODAL'
	| 'UI_CLOSE_MODAL'
	| 'UI_SET_ACTIVE_VIEW'
	| 'UI_SET_ACTIVE_TAB'
	| 'UI_TOGGLE_ZONE_VISIBILITY'
	| 'UI_SET_ZONE_CORNER'
	| 'UI_SPOTLIGHT_START'
	| 'UI_SPOTLIGHT_STEP'
	| 'UI_SPOTLIGHT_STOP'
	| 'UI_PUSH_TOAST'
	| 'UI_DISMISS_TOAST'
	| 'UI_STAGE_PAN_ZOOM'
	| 'HELP_CONTEXT_SHIFTED'
	| 'STUDIO_COMMAND_EXEC'
	| 'TWIN_REMOTE_INTENT'
	| 'UI_SWITCH_PROJECT'
	| 'UI_SPAWN_NODE'
	| 'UI_COMMIT_NODE'
	| 'UI_REJECT_NODE'
	| 'UI_REJECT_ALL_STAGED'
	| 'UI_PATCH_NODE'
	| 'UI_REMOVE_NODE'
	| 'UI_SELECT_NODE'
	| 'UI_TOGGLE_STUDIO_CHROME'
	| 'UI_UNDO_REVISION'
	| 'UI_REDO_REVISION'
	| 'UI_ASSISTANT_MOVE'
	| 'UI_ASSISTANT_DROP'
	| 'UI_ASSISTANT_DOCK'
	| 'UI_ASSISTANT_EXPAND'
	| 'UI_DERIVE_BLUEPRINT'
	| 'UI_LOAD_SAMPLE'
	| 'UI_PATCH_DOCUMENT'
	| 'UI_INPUT_ACTION'
	| 'UI_SET_LAYOUT_DENSITY'
	| 'UI_SET_MOTION_CONFIG'
	| 'UI_SET_CORNER_STYLE'
	| 'UI_PROJECT_SAVE'
	| 'UI_PROJECT_CLEAN'
	| 'UI_WORKSPACE_RESET_DEFAULT'
	| 'UI_SET_EMBELLISHMENT_CONFIG'
	| 'UI_APPLY_CURSOR_PACK'
	| 'UI_UPDATE_CURSOR_STATE'
	| 'UI_RESET_CURSOR_PACK'
	| 'UI_SET_CORNER_RADIUS'
	| 'UI_CONFIGURE_STATION_LAYER'
	| 'UI_EDIT_ZONE_DISPOSITION'
	| 'UI_MOVE_ENTITY_TO_ZONE'
	| 'UI_SET_STUDIO_DEFAULT'
	| 'UI_RESET_STUDIO_DEFAULTS'
	| 'UI_ASSISTANT_TOGGLE_FLOAT'
	| 'UI_ASSISTANT_SUBMIT'
	| 'UI_STATION_PREVIEW_UPDATE'
	| 'UI_WIREFRAME_SET_TOOL'
	| 'UI_TOGGLE_ENTITY_LOCK'
	| 'UI_TOGGLE_ENTITY_VISIBILITY'
	| 'UI_SET_MOTION_PROFILE'
	| 'UI_MODAL_TOGGLE_EXPAND'
	| 'UI_ASSISTANT_SET_DOCK_MODE'
	| 'UI_ASSISTANT_SUBMIT_PROMPT'
	| 'UI_SET_CONTROL_CONFIG'
	| 'UI_SET_HISTORY_LIMIT'
	| 'UI_SET_TOOLTIP_INFO_LEVEL'
	| 'UI_MODAL_OPENED'
	| 'UI_MODAL_CLOSED'
	| 'UI_REVEAL_ZONE'
	| 'UI_REPLAY_HUD_SEQUENCE'
	| 'SERVER_MANIFEST_SYNCED';

export interface BatchIntentInput<P = Record<string, unknown>> {
	readonly kind: IntentKind;
	readonly payload: P;
	readonly origin?: DagEnvelope['origin'];
}

export interface DagEnvelope<P = Record<string, unknown>> {
	readonly id: string;
	readonly kind: IntentKind;
	readonly tier: RoutingTier;
	readonly origin: 'USER' | 'ASSISTANT_CHAT' | 'VOICE' | 'GAMEPAD' | 'MCP_TWIN' | 'BROADCAST' | 'SYSTEM';
	readonly timestamp: number;
	readonly payload: P;
}

export interface WireTraceRecord {
	readonly seq: number;
	readonly spine: WireSpine;
	readonly envelopeId: string;
	readonly kind: IntentKind;
	readonly tier: RoutingTier;
	readonly origin: DagEnvelope['origin'];
	readonly stageMs: number;
	readonly ok: boolean;
	readonly summary: string;
	readonly timestamp: number;
}

export type IntentValidator<S, P = Record<string, unknown>> = (
	state: S,
	envelope: DagEnvelope<P>
) => boolean;

export type IntentReducer<S, P = Record<string, unknown>> = (
	state: S,
	envelope: DagEnvelope<P>
) => S;

export type IntentEffect<S, P = Record<string, unknown>> = (
	nextState: S,
	envelope: DagEnvelope<P>
) => void | Promise<void>;

export interface IntentHandler<S, P = Record<string, unknown>> {
	readonly tier: RoutingTier;
	readonly validate?: IntentValidator<S, P>;
	readonly reduce: IntentReducer<S, P>;
	readonly effect?: IntentEffect<S, P>;
	readonly summarize?: (envelope: DagEnvelope<P>) => string;
}

export type WireMiddleware<S> = (
	envelope: DagEnvelope,
	state: S,
	next: () => void
) => void;
