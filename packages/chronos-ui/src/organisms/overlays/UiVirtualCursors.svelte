<script lang="ts">
	import { PEER_STALE_MS } from '@ui/tokens';
	import type { VirtualCursorPeer } from '../organisms.types';

	interface Props {
		peers: readonly VirtualCursorPeer[];
		localSessionId?: string;
	}

	let { peers, localSessionId }: Props = $props();

	let remotePeers = $derived.by(() => {
		const now = Date.now();
		return peers.filter((peer) => {
			if (!peer.sessionId) return false;
			if (localSessionId && peer.sessionId === localSessionId) return false;
			if (typeof peer.lastSeenAt === 'number' && now - peer.lastSeenAt > PEER_STALE_MS) return false;
			return true;
		});
	});
</script>

{#if remotePeers.length > 0}
	<div data-ui-virtual-cursors="true" class="pointer-events-none fixed inset-0 z-[55] overflow-hidden" aria-hidden="true">
		{#each remotePeers as peer (peer.sessionId)}
			<div
				data-ui-peer-cursor={peer.sessionId}
				class="ui-dur-micro absolute flex items-start gap-1 transition-transform"
				style="transform: translate3d({peer.x}px, {peer.y}px, 0);"
			>
				<svg viewBox="0 0 18 18" class="h-4 w-4 shrink-0" style="color: var(--ui-accent);">
					<polygon points="2,2 15,7 9,9 7,15" fill="currentColor" stroke="var(--ui-base-100)" stroke-width="1.5" />
				</svg>
				<span
					class="ui-font-mono whitespace-nowrap px-1.5 py-0.5 text-[0.65rem] font-semibold"
					style="background-color: var(--ui-base-300); color: var(--ui-base-content); border: var(--ui-hairline) solid var(--ui-accent);"
				>
					{peer.label} · {peer.scope}
				</span>
			</div>
		{/each}
	</div>
{/if}
