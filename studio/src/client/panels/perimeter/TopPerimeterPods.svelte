<script lang="ts">
	import {
		HISTORY_LIMIT_BOUNDS, UiBadge, UiChamferButton, UiChamferFrame, UiProgressGauge, uiSpotlight,
		UiUtilityIconButton, VERSION, ZONE_CORNER_PRESETS, type CornerKind, type ThemePolarity
	} from '@chronos-ui/svelte';
	import type { UiBlueprint } from '@studio/config';
	import { computeBlueprintGrade } from '@studio/core';
	import { ProjectLifecyclePod } from '@studio/client/canvas';
	import type { StudioUser } from '@studio/client/state';

	interface Props {
		zone: 'TOP_LEFT' | 'TOP_RIGHT';
		blueprint: UiBlueprint;
		cornerMode: CornerKind;
		polarity: ThemePolarity;
		user: StudioUser | null;
		activeModalId: string | null;
		glitterBurst: number;
		isDirty?: boolean;
		saveStatus?: 'SAVED' | 'DIRTY' | 'SAVING';
		canUndo?: boolean;
		canRedo?: boolean;
		undoCount?: number;
		redoCount?: number;
		historyLimit?: number;
		onUndo?: () => void;
		onRedo?: () => void;
		onSaveWorkspace?: () => void;
		onResetDefaultView?: () => void;
		onCleanWorkspace?: () => void;
		onOpenCursors?: () => void;
		onOpenAuth?: () => void;
		onOpenWire?: () => void;
		onTogglePolarity?: () => void;
		onOpenHelp?: () => void;
		onOpenSettings?: () => void;
		onStartSpotlight?: () => void;
	}

	let props: Props = $props();
	let visibleZones = $derived(props.blueprint.zones.filter((z) => z.visible).length);
	let identityLabel = $derived(props.user ? props.user.displayName : 'Guest');
	let zoneCfg = $derived(props.blueprint.zones.find((z) => z.id === props.zone));
	let zoneCorners = $derived(zoneCfg?.corners ?? ZONE_CORNER_PRESETS[props.zone]);
</script>

{#if props.zone === 'TOP_LEFT'}
	<div use:uiSpotlight={'spot-top-left'} class="h-full w-full">
		<UiChamferFrame
			corners={zoneCorners}
			cornerMode={props.cornerMode}
			cornerRadiusRem={zoneCfg?.cornerRadiusRem}
			cutTier="station"
			shape={zoneCfg?.shape ?? 'BOX'}
			cornerEmbellishment={zoneCfg?.cornerEmbellishment}
			cornerAnimation={zoneCfg?.cornerAnimation ?? 'NONE'}
			carets={true}
			className="px-3.5 py-2"
		>
			<div class="flex h-full min-w-0 flex-col justify-between gap-1 overflow-hidden" data-testid="top-left-pod">
				<div class="flex min-w-0 items-center justify-between gap-1.5">
					<div class="flex min-w-0 items-baseline gap-1.5 overflow-hidden">
						<span class="ui-font-display truncate text-xs font-bold tracking-wide" style="color: var(--ui-base-content);">Chronos UI Studio</span>
						<span class="ui-font-mono shrink-0 text-[0.6rem]" style="color: var(--ui-muted-content);" data-testid="top-left-version">v{VERSION}</span>
					</div>
					<UiBadge text={computeBlueprintGrade(props.blueprint)} tone="primary" cornerMode={props.cornerMode} ariaLabel="Blueprint Grade" />
				</div>
				<UiProgressGauge value={visibleZones} max={11} label="Perimeter Coverage" unitText={`${visibleZones}/11`} />
				<div class="ui-font-mono flex w-full min-w-0 items-center text-[0.65rem]" style="color: var(--ui-muted-content);">
					{#if props.onSaveWorkspace && props.onResetDefaultView && props.onCleanWorkspace}
						<ProjectLifecyclePod
							cornerMode={props.cornerMode}
							isDirty={Boolean(props.isDirty)}
							saveStatus={props.saveStatus ?? 'SAVED'}
							compact={true}
							canUndo={Boolean(props.canUndo)}
							canRedo={Boolean(props.canRedo)}
							undoCount={props.undoCount ?? 0}
							redoCount={props.redoCount ?? 0}
							historyLimit={props.historyLimit ?? HISTORY_LIMIT_BOUNDS.defaultLimit}
							onUndo={props.onUndo}
							onRedo={props.onRedo}
							onSaveWorkspace={props.onSaveWorkspace}
							onResetDefaultView={props.onResetDefaultView}
							onCleanWorkspace={props.onCleanWorkspace}
						/>
					{/if}
				</div>
			</div>
		</UiChamferFrame>
	</div>
{:else}
	<div use:uiSpotlight={'spot-top-right'} class="h-full w-full">
		<UiChamferFrame
			corners={zoneCorners}
			cornerMode={props.cornerMode}
			cornerRadiusRem={zoneCfg?.cornerRadiusRem}
			cutTier="station"
			shape={zoneCfg?.shape ?? 'BOX'}
			cornerEmbellishment={zoneCfg?.cornerEmbellishment}
			cornerAnimation={zoneCfg?.cornerAnimation ?? 'NONE'}
			carets={true}
			className="px-3.5 py-2"
		>
			<div class="flex h-full flex-col justify-between" data-testid="top-right-pod">
				<div class="flex items-center justify-between gap-1">
					<UiUtilityIconButton cornerMode={props.cornerMode} icon="cursor" label="Cursor Studio" tipLevel={55} active={props.activeModalId === 'cursors'} onclick={props.onOpenCursors} testId="hud-open-cursors" />
					<UiUtilityIconButton cornerMode={props.cornerMode} icon="user" label={`Session & Auth (${identityLabel})`} tipLevel={45} active={props.activeModalId === 'auth'} onclick={props.onOpenAuth} testId="hud-open-auth" />
					<UiUtilityIconButton cornerMode={props.cornerMode} icon="wire" label="Wire Tap Observatory" tipLevel={50} active={props.activeModalId === 'wire'} onclick={props.onOpenWire} testId="hud-open-wire-icon" />
					<UiUtilityIconButton cornerMode={props.cornerMode} icon={props.polarity === 'dark' ? 'sun' : 'moon'} label="Toggle Polarity" tipLevel={35} onclick={props.onTogglePolarity} testId="hud-toggle-polarity" />
					<UiUtilityIconButton cornerMode={props.cornerMode} icon="help" label="Contextual Help (F1)" tipLevel={85} active={props.activeModalId === 'tome'} glitterBurst={props.glitterBurst} onclick={props.onOpenHelp} testId="open-tome-btn" />
					<UiUtilityIconButton cornerMode={props.cornerMode} icon="settings" label="Accessibility & Motion Settings" tipLevel={25} active={props.activeModalId === 'settings'} onclick={props.onOpenSettings} testId="hud-open-settings" />
				</div>
				<div class="flex items-center justify-between gap-1.5">
					<UiChamferButton cornerMode={props.cornerMode} icon="spotlight" label="Tour" tip="Launch interactive HUD spotlight tour" tipLevel={70} testId="hud-tour-btn" onclick={props.onStartSpotlight} className="flex-1 py-0.5" />
					<UiChamferButton cornerMode={props.cornerMode} icon="wire" label="DAG" tip="Inspect live client + server Wire DAG traces" tipLevel={50} testId="hud-open-wire" onclick={props.onOpenWire} className="flex-1 py-0.5" />
				</div>
				<div class="ui-font-mono flex items-center justify-between gap-1 text-[0.62rem]" style="color: var(--ui-muted-content); padding-inline: calc(var(--ui-station-cut, 0.75rem) + 0.375rem);" data-testid="top-right-status-row">
					<span class="whitespace-nowrap">{identityLabel.toUpperCase()} · {props.polarity.toUpperCase()}</span>
					<span class="whitespace-nowrap">X = 50vw</span>
				</div>
			</div>
		</UiChamferFrame>
	</div>
{/if}
