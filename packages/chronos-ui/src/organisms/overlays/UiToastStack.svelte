<script lang="ts">
	import { UiChamferFrame, UiIcon } from '@ui/atoms';
	import { uiTransition } from '@ui/motion';
	import { DEFAULT_CHAMFER_TUPLE, type CornerKind, type UiIconName } from '@ui/tokens';
	import type { ToastItem } from '../organisms.types';

	interface Props {
		toasts: readonly ToastItem[];
		cornerMode?: CornerKind;
		onDismiss: (id: string) => void;
	}

	let { toasts, cornerMode = 'CHAMFER', onDismiss }: Props = $props();

	function iconForTone(tone: ToastItem['tone']): UiIconName {
		if (tone === 'success') return 'check';
		if (tone === 'warning' || tone === 'error') return 'warning';
		return 'wire';
	}

	function colorForTone(tone: ToastItem['tone']): string {
		if (tone === 'success') return 'var(--ui-success)';
		if (tone === 'warning') return 'var(--ui-warning)';
		if (tone === 'error') return 'var(--ui-error)';
		return 'var(--ui-accent-vivid, var(--ui-info))';
	}
</script>

<div
	data-testid="ui-toast-stack"
	class="pointer-events-none fixed left-1/2 z-[55] flex w-80 -translate-x-1/2 flex-col gap-1.5"
	style="top: var(--ui-safe-top, 4.25rem);"
	aria-live="polite"
>
	{#each toasts as toast (toast.id)}
		<div
			role="status"
			in:uiTransition={{ offsetPx: -8 }}
			out:uiTransition={{ offsetPx: -8 }}
			class="pointer-events-auto shadow-md"
		>
			<UiChamferFrame
				corners={DEFAULT_CHAMFER_TUPLE}
				{cornerMode}
				carets={false}
				strokeVar={colorForTone(toast.tone)}
				className="flex h-9 items-center justify-between gap-2 px-3"
			>
				<div class="flex min-w-0 items-center gap-2">
					<span style="color: {colorForTone(toast.tone)};">
						<UiIcon name={iconForTone(toast.tone)} sizeRem={0.9} />
					</span>
					<span class="truncate text-xs font-medium">{toast.title}</span>
				</div>
				<button
					type="button"
					aria-label="Dismiss notification"
					onclick={() => onDismiss(toast.id)}
					class="shrink-0 p-0.5"
					style="color: var(--ui-muted-content);"
				>
					<UiIcon name="close" sizeRem={0.8} />
				</button>
			</UiChamferFrame>
		</div>
	{/each}
</div>
