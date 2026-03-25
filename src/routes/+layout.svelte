<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import logo from '$lib/assets/logo.svg';

	let { data, children } = $props<{ data: LayoutData & { isAdmin: boolean }; children: Snippet }>();
</script>

<div class="flex min-h-screen flex-col bg-white text-zinc-950">
	<header class="sticky top-0 z-50 border-b border-zinc-200 bg-white">
		<div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
			<a href="/" class="flex items-center gap-2.5 opacity-90 hover:opacity-100">
				<img src={logo} alt="" class="h-8 w-auto" />
				<span class="text-sm font-semibold tracking-tight text-zinc-950">Créneaux</span>
			</a>
			<nav class="flex items-center gap-1">
				{#if data.user}
					<a
						href="/nouveau"
						class="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
					>
						Nouveau
					</a>
					{#if data.isAdmin}
						<a
							href="/admin"
							class="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
						>
							Admin
						</a>
					{/if}
					<div class="mx-1 h-4 w-px bg-zinc-200"></div>
					<div class="flex items-center gap-2 pl-1">
						{#if data.user.picture}
							<img
								src={data.user.picture}
								alt={data.user.name}
								class="h-7 w-7 rounded-full border border-zinc-200 object-cover"
							/>
						{/if}
						<span class="hidden text-sm text-zinc-600 sm:inline">{data.user.name}</span>
					</div>
					<a
						href="/auth/logout"
						class="ml-1 rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
					>
						Déconnexion
					</a>
				{:else}
					<a
						href="/auth/google"
						class="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
					>
						Connexion
					</a>
				{/if}
			</nav>
		</div>
	</header>

	<main class="flex-1">
		{@render children()}
	</main>
</div>
