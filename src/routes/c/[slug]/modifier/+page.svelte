<script lang="ts">
	import type { PageData, ActionData } from './$types';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();

	const c = data.creneau;

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
					{#each hourOptions as h}
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
					{#each hourOptions as h}
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
</div>
