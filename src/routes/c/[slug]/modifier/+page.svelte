<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { untrack } from 'svelte';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();

	const c = untrack(() => data.creneau);

	let title = $state(c.title);
	let dateStart = $state(c.date_start);
	let dateEnd = $state(c.date_end);
	let hourStart = $state(c.hour_start);
	let hourEnd = $state(c.hour_end);
	let includeWeekends = $state(c.include_weekends);

	const hourOptions = Array.from({ length: 25 }, (_, i) => i);
</script>

<svelte:head>
	<title>Modifier — {c.title}</title>
</svelte:head>

<div class="mx-auto max-w-lg px-4 py-10">
	<div class="mb-6">
		<a
			href="/c/{c.id}"
			class="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-950"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
			Retour au créneau
		</a>
	</div>

	<div class="mb-8">
		<h1 class="text-xl font-semibold text-zinc-950">Modifier le créneau</h1>
		<p class="mt-1 text-sm text-zinc-500">Les réponses existantes sont conservées.</p>
	</div>

	{#if form?.error}
		<div class="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			{form.error}
		</div>
	{/if}

	<form method="POST" class="space-y-5">
		<div class="space-y-1.5">
			<label for="title" class="text-sm font-medium text-zinc-950">
				Titre <span class="text-red-500">*</span>
			</label>
			<input
				id="title"
				name="title"
				type="text"
				required
				bind:value={title}
				class="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950
               placeholder-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-1"
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-1.5">
				<label for="date_start" class="text-sm font-medium text-zinc-950">
					Début <span class="text-red-500">*</span>
				</label>
				<input
					id="date_start"
					name="date_start"
					type="date"
					required
					bind:value={dateStart}
					class="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950
                 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-1"
				/>
			</div>
			<div class="space-y-1.5">
				<label for="date_end" class="text-sm font-medium text-zinc-950">
					Fin <span class="text-red-500">*</span>
				</label>
				<input
					id="date_end"
					name="date_end"
					type="date"
					required
					bind:value={dateEnd}
					class="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950
                 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-1"
				/>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-1.5">
				<label for="hour_start" class="text-sm font-medium text-zinc-950">Heure début</label>
				<select
					id="hour_start"
					name="hour_start"
					bind:value={hourStart}
					class="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950
                 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-1"
				>
					{#each hourOptions as h (h)}
						<option value={h}>{h}h00</option>
					{/each}
				</select>
			</div>
			<div class="space-y-1.5">
				<label for="hour_end" class="text-sm font-medium text-zinc-950">Heure fin</label>
				<select
					id="hour_end"
					name="hour_end"
					bind:value={hourEnd}
					class="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950
                 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-1"
				>
					{#each hourOptions as h (h)}
						<option value={h}>{h}h00</option>
					{/each}
				</select>
			</div>
		</div>

		<label class="flex cursor-pointer items-center gap-2.5">
			<input
				id="include_weekends"
				name="include_weekends"
				type="checkbox"
				bind:checked={includeWeekends}
				class="h-4 w-4 rounded border-zinc-300 text-zinc-900"
			/>
			<span class="text-sm text-zinc-700">Inclure les week-ends</span>
		</label>

		<div class="flex gap-3 pt-1">
			<button
				type="submit"
				class="h-9 flex-1 rounded-md bg-zinc-900 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
			>
				Enregistrer
			</button>
			<a
				href="/c/{c.id}"
				class="flex h-9 flex-1 items-center justify-center rounded-md border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
			>
				Annuler
			</a>
		</div>
	</form>

	<div class="mt-10 border-t border-zinc-100 pt-8">
		<h2 class="mb-1 text-sm font-medium text-zinc-950">Zone de danger</h2>
		<p class="mb-4 text-sm text-zinc-400">
			Cette action est irréversible. Toutes les réponses seront supprimées.
		</p>
		<form
			method="POST"
			action="?/delete"
			onsubmit={(e) => {
				if (!confirm(`Supprimer « ${c.title} » ? Cette action est irréversible.`))
					e.preventDefault();
			}}
		>
			<button
				type="submit"
				class="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-600 hover:bg-red-100 hover:text-red-700"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					/>
				</svg>
				Supprimer ce créneau
			</button>
		</form>
	</div>
</div>
