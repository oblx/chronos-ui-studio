import type {
	CornerAnimation,
	CornerEmbellishment,
	CornerKind,
	CornerTuple,
	EmbellishmentConfig,
	HudZoneId,
	StudioDefaultsConfig,
	UiFrameShape
} from '../tokens';

export type UiNodeLifecycle = 'STAGING' | 'BUILDING' | 'COMMITTED';

export type UiComponentKind =
	| 'UiSection'
	| 'UiHeaderBar'
	| 'UiProjectDeck'
	| 'UiMetricCard'
	| 'UiActionBar'
	| 'UiProgressGauge'
	| 'UiBentoRadar'
	| 'UiBadge'
	| 'UiChamferButton'
	| 'UiMathFormula'
	| 'UiWireInspector';

export interface UiNode {
	readonly id: string;
	readonly type: UiComponentKind;
	readonly zone: HudZoneId;
	readonly label: string;
	readonly lifecycle: UiNodeLifecycle;
	readonly props: Readonly<Record<string, unknown>>;
	readonly corners?: CornerTuple;
	readonly cornerRadiusRem?: number;
	readonly shape?: UiFrameShape;
	readonly cornerEmbellishment?: CornerEmbellishment;
	readonly cornerAnimation?: CornerAnimation;
	readonly embellishmentConfig?: EmbellishmentConfig;
	readonly intentBinding?: string;
	readonly children?: readonly UiNode[];
}

export type UiNodeTree = readonly UiNode[];

export interface UiProjectBuildConfig {
	readonly protocol: 'https' | 'http';
	readonly basePath: string;
	readonly apiEndpoint: string;
	readonly secretRefs: readonly string[];
	readonly inlineBundle: boolean;
}

export interface UiProjectDefinition {
	readonly id: string;
	readonly slug: string;
	readonly name: string;
	readonly description: string;
	readonly themeId: string;
	readonly cornerMode: CornerKind;
	readonly cornerRadiusRem?: number;
	readonly studioDefaults?: StudioDefaultsConfig;
	readonly hasBuiltOnce?: boolean;
	readonly activeCursorPackId?: string;
	readonly activeRevisionId: string;
	readonly nodes: UiNodeTree;
	readonly buildConfig: UiProjectBuildConfig;
	readonly updatedAt: number;
}
