<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { formatDate } from '$lib/utils';
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();

	let emailsText = $state(untrack(() => (data.allowedEmails ?? []).join('\n')));
	let adminsText = $state(untrack(() => (data.adminEmails ?? []).join('\n')));
	let confirmDelete = $state<string | null>(null);
</script>

<svelte:head>
	<title>Administration — Dispo</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10">
	<div class="mb-6">
		<a href="/" class="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-950">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
			Retour
		</a>
	</div>

	<h1 class="mb-8 text-xl font-semibold text-zinc-950">Administration</h1>

	{#if form?.error}
		<div class="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
			{form.error}
		</div>
	{/if}

	<div class="mb-10 grid gap-6 sm:grid-cols-2">
		<!-- Admins -->
		<section>
			<div class="mb-3">
				<h2 class="text-sm font-semibold text-zinc-950">Administrateurs</h2>
				<p class="mt-0.5 text-xs text-zinc-500">Accès à cette page admin. Un email par ligne.</p>
			</div>
			{#if form?.success && form?.target === 'admins'}
				<div
					class="mb-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700"
				>
					Sauvegardé.
				</div>
			{/if}
			<form method="POST" action="?/saveAdmins" use:enhance>
				<textarea
					name="admins"
					bind:value={adminsText}
					rows="4"
					placeholder="admin@example.com"
					class="w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-950 placeholder-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-1"
				></textarea>
				<div class="mt-2 flex justify-end">
					<button
						type="submit"
						class="h-8 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
					>
						Sauvegarder
					</button>
				</div>
			</form>
		</section>

		<!-- Emails autorisés -->
		<section>
			<div class="mb-3">
				<h2 class="text-sm font-semibold text-zinc-950">Emails autorisés</h2>
				<p class="mt-0.5 text-xs text-zinc-500">
					Qui peut se connecter. Wildcards : <code class="rounded bg-zinc-100 px-1 font-mono"
						>*@domaine.com</code
					>
				</p>
			</div>
			{#if form?.success && form?.target === 'emails'}
				<div
					class="mb-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700"
				>
					Sauvegardé.
				</div>
			{/if}
			<form method="POST" action="?/saveEmails" use:enhance>
				<textarea
					name="emails"
					bind:value={emailsText}
					rows="4"
					placeholder="user@example.com&#10;*@domaine.com"
					class="w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-950 placeholder-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-1"
				></textarea>
				<div class="mt-2 flex justify-end">
					<button
						type="submit"
						class="h-8 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
					>
						Sauvegarder
					</button>
				</div>
			</form>
		</section>
	</div>

	<!-- Liste des créneaux -->
	<section>
		<h2 class="mb-4 text-sm font-semibold text-zinc-950">
			Sondages <span class="font-normal text-zinc-400">({data.crenaux.length})</span>
		</h2>

		{#if data.crenaux.length === 0}
			<p class="text-sm text-zinc-400">Aucun créneau.</p>
		{:else}
			<div class="divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200">
				{#each data.crenaux as creneau (creneau.id)}
					<div class="flex items-center justify-between gap-4 px-4 py-3">
						<div class="min-w-0">
							<a
								href="/c/{creneau.id}"
								class="block truncate text-sm font-medium text-zinc-950 underline-offset-4 hover:text-zinc-600 hover:underline"
							>
								{creneau.title}
							</a>
							<p class="mt-0.5 text-xs text-zinc-400">
								{formatDate(creneau.date_start)} → {formatDate(creneau.date_end)}
								· {creneau.created_by}
								· {Object.keys(creneau.responses).length} rép.
							</p>
						</div>

						{#if creneau.created_by === data.user.email}
							{#if confirmDelete === creneau.id}
								<div class="flex flex-shrink-0 items-center gap-2">
									<span class="text-xs text-zinc-500">Confirmer ?</span>
									<form
										method="POST"
										action="?/deleteCreneau"
										use:enhance={() => {
											return async ({ update }) => {
												confirmDelete = null;
												await update();
											};
										}}
									>
										<input type="hidden" name="slug" value={creneau.id} />
										<button
											type="submit"
											class="h-7 rounded-md bg-red-600 px-3 text-xs text-white hover:bg-red-700"
										>
											Supprimer
										</button>
									</form>
									<button
										onclick={() => (confirmDelete = null)}
										class="h-7 rounded-md border border-zinc-200 px-3 text-xs text-zinc-600 hover:bg-zinc-50"
									>
										Annuler
									</button>
								</div>
							{:else}
								<button
									onclick={() => (confirmDelete = creneau.id)}
									class="h-7 flex-shrink-0 rounded-md border border-zinc-200 px-3 text-xs text-red-500 hover:border-red-300 hover:text-red-700"
								>
									Supprimer
								</button>
							{/if}
						{:else}
							<span class="flex-shrink-0 text-xs text-zinc-300">Non créateur</span>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>
