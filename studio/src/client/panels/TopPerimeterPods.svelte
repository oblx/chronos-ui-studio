<script lang="ts">
	import {
		UiBadge, UiChamferButton, UiChamferFrame, UiProgressGauge, uiSpotlight,
		UiUtilityIconButton, VERSION, ZONE_CORNER_PRESETS, type CornerKind, type ThemePolarity
	} from '@chronos-ui/svelte';
	import type { UiBlueprint } from '@studio/config';
	import { computeBlueprintGrade } from '@studio/core';
	import type { StudioUser } from '../state';

	interface Props {
		zone: 'TOP_LEFT' | 'TOP_RIGHT';
		blueprint: UiBlueprint;
		cornerMode: CornerKind;
		polarity: ThemePolarity;
		user: StudioUser | null;
		activeModalId: string | null;
		glitterBurst: number;
		isDirty?: boolean;
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
			<div class="flex h-full flex-col justify-between gap-1" data-testid="top-left-pod">
				<div class="flex items-center justify-between gap-2">
					<div class="ui-font-display truncate text-xs font-bold tracking-wide" style="color: var(--ui-base-content);">
						Chronos UI Studio
					</div>
					<UiBadge text={computeBlueprintGrade(props.blueprint)} tone="primary" cornerMode={props.cornerMode} ariaLabel="Blueprint Grade" />
				</div>
				<UiProgressGauge value={visibleZones} max={11} label="Perimeter Coverage" unitText={`${visibleZones}/11`} />
				<div class="ui-font-mono flex items-center justify-between gap-1 text-[0.65rem]" style="color: var(--ui-muted-content);">
					<span>v{VERSION}</span>
					<div class="flex items-center gap-1">
						{#if props.onSaveWorkspace}
							<UiChamferButton cornerMode={props.cornerMode} icon="save" variant={props.isDirty ? 'secondary' : 'ghost'} onclick={props.onSaveWorkspace} testId="hud-save-btn" className="px-1.5 py-0.5 text-[0.62rem]">
								<span>Save</span>
								<span class="inline-flex h-1.5 w-1.5 shrink-0 items-center justify-center">
									{#if props.isDirty}<span class="inline-block h-1.5 w-1.5 rounded-full" style="background-color: var(--ui-accent-vivid, var(--ui-primary));"></span>{/if}
								</span>
							</UiChamferButton>
						{/if}
						{#if props.onCleanWorkspace}
							<UiChamferButton cornerMode={props.cornerMode} icon="reset" label="Clean" variant="ghost" onclick={props.onCleanWorkspace} testId="hud-clean-btn" className="px-1.5 py-0.5 text-[0.62rem]" />
						{/if}
					</div>
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
					<UiUtilityIconButton cornerMode={props.cornerMode} icon="cursor" label="Cursor Studio" active={props.activeModalId === 'cursors'} onclick={props.onOpenCursors} />
					<UiUtilityIconButton cornerMode={props.cornerMode} icon="user" label={`Session & Auth (${identityLabel})`} active={props.activeModalId === 'auth'} onclick={props.onOpenAuth} />
					<UiUtilityIconButton cornerMode={props.cornerMode} icon="wire" label="Wire Tap Observatory" active={props.activeModalId === 'wire'} onclick={props.onOpenWire} />
					<UiUtilityIconButton cornerMode={props.cornerMode} icon={props.polarity === 'dark' ? 'sun' : 'moon'} label="Toggle Polarity" onclick={props.onTogglePolarity} />
					<UiUtilityIconButton cornerMode={props.cornerMode} icon="help" label="Contextual Help (F1)" active={props.activeModalId === 'tome'} glitterBurst={props.glitterBurst} onclick={props.onOpenHelp} testId="open-tome-btn" />
					<UiUtilityIconButton cornerMode={props.cornerMode} icon="settings" label="Accessibility Settings" active={props.activeModalId === 'settings'} onclick={props.onOpenSettings} />
				</div>
				<div class="flex items-center justify-between gap-1.5">
					<UiChamferButton cornerMode={props.cornerMode} icon="spotlight" label="Tour" onclick={props.onStartSpotlight} className="flex-1 py-0.5" />
					<UiChamferButton cornerMode={props.cornerMode} icon="wire" label="DAG" onclick={props.onOpenWire} className="flex-1 py-0.5" />
				</div>
				<div class="ui-font-mono flex items-center justify-between gap-1 text-[0.62rem]" style="color: var(--ui-muted-content); padding-inline: calc(var(--ui-station-cut, 0.75rem) + 0.375rem);" data-testid="top-right-status-row">
					<span class="whitespace-nowrap">{identityLabel.toUpperCase()} · {props.polarity.toUpperCase()}</span>
					<span class="whitespace-nowrap">X = 50vw</span>
				</div>
			</div>
		</UiChamferFrame>
	</div>
{/if}
