<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import type { UserResponse, CalendarEvent } from '$lib/types';
	import {
		getDatesInRange,
		getHours,
		heatmapColor,
		eventOverlapsSlot,
		formatDate,
		formatDateParts,
		formatHour
	} from '$lib/utils';

	let { data } = $props<{ data: PageData }>();

	const creneau = $derived(data.creneau);
	const user = $derived(data.user);
	const initialCalendarEvents = $derived((data.calendarEvents ?? []) as CalendarEvent[]);
	const dates = $derived(
		getDatesInRange(creneau.date_start, creneau.date_end, creneau.include_weekends)
	);
	const hours = $derived(getHours(creneau.hour_start, creneau.hour_end));

	let serverResponses = $state<Record<string, UserResponse>>({ ...data.creneau.responses });
	let mySlots = $state<Record<string, number[]>>({
		...(data.creneau.responses[data.user.email]?.slots ?? {})
	});
	let saving = $state(false);
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	let copied = $state(false);

	// Effective responses: server data merged with current user's live selections
	let effectiveResponses = $derived<Record<string, UserResponse>>({
		...serverResponses,
		[user.email]: {
			name: user.name,
			updated_at: new Date().toISOString(),
			slots: mySlots
		}
	});

	let participants = $derived(Object.keys(effectiveResponses));

	function getConvergence(date: string, hour: number) {
		const entries = Object.values(effectiveResponses);
		const total = entries.length;
		const count = entries.filter((r) => r.slots[date]?.includes(hour)).length;
		return { count, total, ratio: total > 0 ? count / total : 0 };
	}

	function isMySlot(date: string, hour: number): boolean {
		return mySlots[date]?.includes(hour) ?? false;
	}

	function getSlotCalendarEvents(date: string, hour: number): CalendarEvent[] {
		return initialCalendarEvents.filter((ev) => eventOverlapsSlot(ev, date, hour));
	}

	function toggleSlot(date: string, hour: number) {
		const current = mySlots[date] ?? [];
		if (current.includes(hour)) {
			mySlots = { ...mySlots, [date]: current.filter((h) => h !== hour) };
		} else {
			mySlots = { ...mySlots, [date]: [...current, hour].sort((a, b) => a - b) };
		}
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(save, 800);
	}

	async function save() {
		saving = true;
		try {
			await fetch(`/api/crenaux/${creneau.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ slots: mySlots })
			});
		} finally {
			saving = false;
		}
	}

	let bestSlots = $derived(
		(() => {
			const all: Array<{
				date: string;
				hour: number;
				count: number;
				total: number;
				ratio: number;
			}> = [];
			for (const date of dates) {
				for (const hour of hours) {
					const c = getConvergence(date, hour);
					if (c.count > 0) all.push({ date, hour, ...c });
				}
			}
			return all.sort((a, b) => b.ratio - a.ratio || b.count - a.count).slice(0, 5);
		})()
	);

	async function copyLink() {
		await navigator.clipboard.writeText(window.location.href);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	onMount(() => {
		const es = new EventSource(`/c/${creneau.id}/stream`);
		es.onmessage = (e) => {
			const newResponses = JSON.parse(e.data) as Record<string, UserResponse>;
			// Merge: preserve our own local state but update others
			serverResponses = newResponses;
		};
		return () => es.close();
	});
</script>

<svelte:head>
	<title>{creneau.title} - Créneaux</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">
	<!-- Header -->
	<div class="mb-6">
		<a href="/" class="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-950">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
			Retour
		</a>
	</div>

	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div>
			<h1 class="text-xl font-semibold text-zinc-950">{creneau.title}</h1>
			<p class="mt-1 text-sm text-zinc-500">
				{formatDate(creneau.date_start)} → {formatDate(creneau.date_end)}
				· {creneau.hour_start}h–{creneau.hour_end}h ·
				<span class="font-medium text-zinc-700">{participants.length}</span>
				participant{participants.length !== 1 ? 's' : ''}
			</p>
		</div>
		<div class="flex flex-shrink-0 items-center gap-3">
			{#if saving}
				<span class="animate-pulse text-xs text-zinc-400">Sauvegarde…</span>
			{:else}
				<span class="text-xs text-zinc-300">Sauvegardé</span>
			{/if}
			{#if user.email === creneau.created_by}
				<a
					href="/c/{creneau.id}/modifier"
					class="inline-flex h-8 items-center rounded-md border border-zinc-200 px-3 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
				>
					Modifier
				</a>
			{/if}
			<button
				onclick={copyLink}
				class="h-8 rounded-md border border-zinc-200 px-3 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
			>
				{copied ? 'Copié !' : 'Copier le lien'}
			</button>
		</div>
	</div>

	<!-- Legend -->
	<div class="mb-4 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
		<div class="flex items-center gap-1.5">
			<div
				class="relative h-3.5 w-5 overflow-hidden rounded-sm border border-blue-300"
				style="background-color: #f9fafb; background-image: repeating-linear-gradient(45deg, rgba(59,130,246,0.18) 0px, rgba(59,130,246,0.18) 2px, transparent 2px, transparent 9px);"
			>
				<div class="absolute inset-y-0 left-0 w-[3px] bg-blue-500"></div>
			</div>
			<span>Votre sélection</span>
		</div>
		<div class="flex items-center gap-1.5">
			<div class="rounded bg-amber-400/90 px-1 py-px text-[9px] font-medium text-white">Réunion</div>
			<span>Agenda Google</span>
		</div>
		<div class="flex items-center gap-1.5">
			<div class="flex gap-0.5">
				{#each [0, 0.33, 0.66, 1] as r (r)}
					<div
						class="h-3.5 w-3.5 rounded-sm"
						style="background-color: {heatmapColor(r)}; border: 1px solid rgba(0,0,0,0.06)"
					></div>
				{/each}
			</div>
			<span>0 → 100% disponibles</span>
		</div>
	</div>

	<!-- Grid -->
	<div class="mb-8 overflow-hidden rounded-xl border border-zinc-200 shadow-sm">
		<div class="overflow-x-auto">
			<table class="w-full border-collapse" style="min-width: max-content;">
				<thead>
					<tr class="bg-zinc-50">
						<th
							class="sticky left-0 z-10 border-r border-b border-zinc-200 bg-zinc-50 px-3 py-3"
							style="min-width: 56px;"
						></th>
						{#each dates as date (date)}
							{@const parts = formatDateParts(date)}
							<th
								class="border-r border-b border-zinc-200 px-2 py-2.5 text-center whitespace-nowrap"
								style="min-width: 84px;"
							>
								<span class="block text-[10px] font-medium tracking-wider text-zinc-400 uppercase"
									>{parts.day}</span
								>
								<span class="block text-sm leading-tight font-semibold text-zinc-950"
									>{parts.num} {parts.month}</span
								>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each hours as hour, hi (hour)}
						<tr>
							<td
								class="sticky left-0 z-10 border-r border-zinc-200 bg-white px-3 text-right align-middle"
								class:border-b={hi < hours.length - 1}
								style="min-width: 56px; height: 52px; border-bottom-color: rgb(228 228 231);"
							>
								<span class="text-xs font-medium text-zinc-400">{formatHour(hour)}</span>
							</td>
							{#each dates as date, di (date)}
								{@const conv = getConvergence(date, hour)}
								{@const mine = isMySlot(date, hour)}
								{@const slotEvents = getSlotCalendarEvents(date, hour)}
								<td
									class="group relative cursor-pointer select-none"
									class:border-b={hi < hours.length - 1}
									class:border-r={di < dates.length - 1}
									style="height: 52px; min-width: 84px; background-color: {heatmapColor(conv.ratio)}; background-image: {mine ? 'repeating-linear-gradient(45deg, rgba(59,130,246,0.18) 0px, rgba(59,130,246,0.18) 2px, transparent 2px, transparent 9px)' : 'none'}; border-color: rgba(0,0,0,0.07);"
									onclick={() => toggleSlot(date, hour)}
									onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleSlot(date, hour)}
									role="button"
									tabindex="0"
									aria-pressed={mine}
								>
									<!-- Hover overlay -->
									<div
										class="pointer-events-none absolute inset-0 bg-white opacity-0 transition-opacity group-hover:opacity-10"
									></div>

									<!-- Selection indicator: left border accent -->
									{#if mine}
										<div class="pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-l bg-blue-500"></div>
									{/if}

									<!-- Calendar events -->
									{#if slotEvents.length > 0}
										<div
											class="pointer-events-none absolute top-1 right-1 flex flex-col gap-0.5"
											title={slotEvents.map((e) => e.summary).join(', ')}
										>
											{#each slotEvents.slice(0, 2) as ev (ev.id)}
												<div class="max-w-[60px] truncate rounded bg-amber-400/90 px-1 py-px text-[9px] font-medium leading-tight text-white shadow-sm">
													{ev.summary}
												</div>
											{/each}
										</div>
									{/if}

									<!-- Count (only when at least 1 person available) -->
									{#if conv.count > 0}
										<div
											class="pointer-events-none absolute inset-0 flex items-center justify-center"
										>
											<span
												class="text-[11px] font-semibold tabular-nums {conv.ratio > 0.55
													? 'text-white/90'
													: 'text-zinc-600'}"
											>
												{conv.count}<span class="opacity-50">/{conv.total}</span>
											</span>
										</div>
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
					<!-- End-time boundary row -->
					<tr class="border-t border-zinc-200">
						<td
							class="sticky left-0 z-10 border-r border-zinc-200 bg-white px-3 text-right align-middle"
							style="min-width: 56px; height: 24px;"
						>
							<span class="text-xs font-medium text-zinc-400">{formatHour(creneau.hour_end)}</span>
						</td>
						{#each dates as date, di (date)}
							<td
								class="bg-zinc-50"
								class:border-r={di < dates.length - 1}
								style="min-width: 84px; border-color: rgba(0,0,0,0.07);"
							></td>
						{/each}
					</tr>
				</tbody>
			</table>
		</div>
	</div>

	<!-- Participants + Best slots -->
	<div class="grid gap-6 sm:grid-cols-2">
		<!-- Participants -->
		{#if participants.length > 0}
			<div>
				<h2 class="mb-3 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
					Participants · {participants.length}
				</h2>
				<div class="flex flex-wrap gap-1.5">
					{#each participants as email (email)}
						{@const resp = effectiveResponses[email]}
						<div
							class="inline-flex h-7 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-xs"
						>
							<span class="font-medium text-zinc-700">{resp.name}</span>
							{#if email === user.email}
								<span class="rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white"
									>vous</span
								>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Best slots -->
		<div>
			<h2 class="mb-3 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
				Meilleurs créneaux
			</h2>
			{#if bestSlots.length > 0}
				<div class="space-y-1.5">
					{#each bestSlots as slot, i (i)}
						<div
							class="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5"
						>
							<div
								class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
								style="background-color: {heatmapColor(slot.ratio)}; color: {slot.ratio > 0.55
									? 'white'
									: '#52525b'}"
							>
								{i + 1}
							</div>
							<div class="min-w-0 flex-1">
								<span class="text-sm font-medium text-zinc-950">{formatDate(slot.date)}</span>
								<span class="ml-2 text-xs text-zinc-400"
									>{formatHour(slot.hour)}–{formatHour(slot.hour + 1)}</span
								>
							</div>
							<div class="flex-shrink-0 text-right">
								<span class="text-sm font-semibold text-zinc-950">{slot.count}/{slot.total}</span>
								<span class="ml-1 text-xs text-zinc-400">{Math.round(slot.ratio * 100)}%</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-zinc-400">
					Cliquez sur des cellules pour indiquer vos disponibilités.
				</p>
			{/if}
		</div>
	</div>
</div>
