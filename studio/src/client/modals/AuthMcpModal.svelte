<script lang="ts">
	import { UiBadge, UiChamferButton, UiModalFooter, UiModalShell, type CornerKind } from '@chronos-ui/svelte';
	import type { StudioUser } from '../state';

	interface Props {
		open: boolean;
		user: StudioUser | null;
		cornerMode: CornerKind;
		onLogin: (email: string, pw: string) => Promise<string | null>;
		onRegister: (email: string, pw: string, name: string) => Promise<string | null>;
		onDevArchitect: () => Promise<void>;
		onLogout: () => Promise<void>;
		onMintPat: (label: string) => Promise<string | null>;
		onClose: () => void;
	}

	let { open, user, cornerMode, onLogin, onRegister, onDevArchitect, onLogout, onMintPat, onClose }: Props = $props();
	let mode = $state<'login' | 'register'>('login');
	let email = $state('');
	let password = $state('');
	let displayName = $state('');
	let patLabel = $state('Agent CI Runner');
	let mintedPat = $state('');
	let errorMsg = $state('');

	async function submitForm(): Promise<void> {
		errorMsg = '';
		const err = mode === 'login' ? await onLogin(email, password) : await onRegister(email, password, displayName);
		if (err) errorMsg = err;
	}

	async function mintToken(): Promise<void> {
		const token = await onMintPat(patLabel);
		if (token) mintedPat = token;
	}
</script>

<UiModalShell
	{open}
	sizeTier="COMPACT"
	title="Session, RBAC & Dual-Spine MCP Credentials"
	subtitle="Argon2id auth, capability bitmask, and headless chr_live_* PATs"
	icon="user"
	{cornerMode}
	{onClose}
>
	{#if user}
		<div class="flex flex-col gap-3">
			<div class="flex items-center justify-between p-3" style="background-color: var(--ui-base-100); border: var(--ui-hairline) solid var(--ui-border-subtle);">
				<div>
					<div class="text-sm font-bold" style="color: var(--ui-base-content);">{user.displayName}</div>
					<div class="ui-font-mono text-xs" style="color: var(--ui-muted-content);">{user.email} · {user.role}</div>
				</div>
				<UiBadge text={`Mask 0x${(user.capabilityMask >>> 0).toString(16)}`} tone="success" />
			</div>
			<div class="flex items-center gap-2">
				<input type="text" bind:value={patLabel} aria-label="PAT Label" class="min-w-0 flex-1 px-2.5 py-1.5 text-xs" style="background-color: var(--ui-base-100); color: var(--ui-base-content); border: var(--ui-hairline) solid var(--ui-border-subtle);" />
				<UiChamferButton {cornerMode} icon="lock" label="Mint MCP PAT" variant="primary" onclick={mintToken} />
			</div>
			{#if mintedPat}
				<div class="ui-font-mono break-all p-2 text-xs" style="background-color: var(--ui-base-100); color: var(--ui-accent); border: var(--ui-hairline) solid var(--ui-accent);">
					{mintedPat}
				</div>
			{/if}
		</div>
	{:else}
		<div class="flex flex-col gap-3">
			<div class="flex items-center justify-between gap-2">
				<div class="flex gap-1.5">
					<UiChamferButton {cornerMode} label="Sign In" active={mode === 'login'} onclick={() => (mode = 'login')} />
					<UiChamferButton {cornerMode} label="Register" active={mode === 'register'} onclick={() => (mode = 'register')} />
				</div>
				<UiChamferButton {cornerMode} label="Dev Architect" variant="secondary" onclick={onDevArchitect} />
			</div>
			{#if mode === 'register'}
				<input type="text" bind:value={displayName} placeholder="Display name" aria-label="Display name" class="px-2.5 py-1.5 text-xs" style="background-color: var(--ui-base-100); color: var(--ui-base-content); border: var(--ui-hairline) solid var(--ui-border-subtle);" />
			{/if}
			<input type="email" bind:value={email} placeholder="Email address" aria-label="Email address" class="px-2.5 py-1.5 text-xs" style="background-color: var(--ui-base-100); color: var(--ui-base-content); border: var(--ui-hairline) solid var(--ui-border-subtle);" />
			<input type="password" bind:value={password} placeholder="Password (8+ chars)" aria-label="Password" class="px-2.5 py-1.5 text-xs" style="background-color: var(--ui-base-100); color: var(--ui-base-content); border: var(--ui-hairline) solid var(--ui-border-subtle);" />
			{#if errorMsg}
				<div class="text-xs font-semibold" style="color: var(--ui-error);">{errorMsg}</div>
			{/if}
			<UiChamferButton {cornerMode} label={mode === 'login' ? 'Authenticate' : 'Create Account'} variant="primary" onclick={submitForm} />
		</div>
	{/if}
	{#snippet footer()}
		<UiModalFooter>
			{#if user}
				<UiChamferButton {cornerMode} label="Sign Out" variant="danger" onclick={onLogout} />
			{/if}
			<UiChamferButton {cornerMode} label="Close" onclick={onClose} />
		</UiModalFooter>
	{/snippet}
</UiModalShell>
