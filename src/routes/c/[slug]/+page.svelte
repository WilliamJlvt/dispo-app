<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/stores';
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
	const calendarError = $derived(data.calendarError as string | undefined);
	const dates = $derived(
		getDatesInRange(creneau.date_start, creneau.date_end, creneau.include_weekends)
	);
	const hours = $derived(getHours(creneau.hour_start, creneau.hour_end));

	let serverResponses = $state<Record<string, UserResponse>>(
		untrack(() => ({ ...data.creneau.responses }))
	);
	let mySlots = $state<Record<string, number[]>>(
		untrack(() => ({
			...(data.user ? (data.creneau.responses[data.user.email]?.slots ?? {}) : {})
		}))
	);
	let saving = $state(false);
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	let copied = $state(false);

	// Effective responses: server data merged with current user's live selections
	let effectiveResponses = $derived<Record<string, UserResponse>>({
		...serverResponses,
		...(user
			? {
					[user.email]: {
						name: user.name,
						updated_at: new Date().toISOString(),
						slots: mySlots
					}
				}
			: {})
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

	function getAllDayEvents(date: string): CalendarEvent[] {
		return initialCalendarEvents.filter((ev) => {
			if (!ev.allDay) return false;
			const evStart = ev.start.slice(0, 10);
			const evEnd = ev.end.slice(0, 10); // Google end date is exclusive
			return date >= evStart && date < evEnd;
		});
	}

	function getSlotCalendarEvents(date: string, hour: number): CalendarEvent[] {
		return initialCalendarEvents.filter((ev) => !ev.allDay && eventOverlapsSlot(ev, date, hour));
	}

	function toggleSlot(date: string, hour: number) {
		if (!user) return;
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

	// Participant hover highlight
	let hoveredEmail = $state<string | null>(null);

	// Tooltip for calendar event badges
	let tooltipData = $state<{ lines: string[] } | null>(null);
	let tooltipPos = $state({ x: 0, y: 0 });

	function formatEventTime(ev: CalendarEvent): string {
		if (ev.allDay) return 'Toute la journée';
		const start = new Date(ev.start);
		const end = new Date(ev.end);
		const fmt = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
		return `${fmt(start)} – ${fmt(end)}`;
	}

	function showTooltip(e: MouseEvent, events: CalendarEvent[]) {
		const lines = events.flatMap((ev) => [ev.summary, formatEventTime(ev)]);
		tooltipData = { lines };
		tooltipPos = { x: e.clientX, y: e.clientY };
	}

	function moveTooltip(e: MouseEvent) {
		if (tooltipData) tooltipPos = { x: e.clientX, y: e.clientY };
	}

	function hideTooltip() {
		tooltipData = null;
	}

	async function copyLink() {
		await navigator.clipboard.writeText(window.location.href);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	onMount(() => {
		const es = new EventSource(`/c/${creneau.id}/stream`);
		es.onmessage = (e) => {
			const newResponses = JSON.parse(e.data) as Record<string, UserResponse>;
			serverResponses = newResponses;
		};
		return () => es.close();
	});
</script>

<svelte:head>
	<title>{creneau.title} — Dispo</title>
	<meta property="og:title" content={creneau.title} />
	<meta
		property="og:description"
		content="{Object.keys(creneau.responses).length} participant{Object.keys(creneau.responses)
			.length !== 1
			? 's'
			: ''} · {creneau.date_start} → {creneau.date_end}"
	/>
	<meta property="og:image" content="{data.origin}/c/{creneau.id}/og.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={creneau.title} />
	<meta name="twitter:image" content="{data.origin}/c/{creneau.id}/og.png" />
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
			{#if user}
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
			{/if}
			<button
				onclick={copyLink}
				class="h-8 rounded-md border border-zinc-200 px-3 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
			>
				{copied ? 'Copié !' : 'Copier le lien'}
			</button>
		</div>
	</div>

	<!-- Login CTA for anonymous visitors -->
	{#if !user}
		<div
			class="mb-6 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3"
		>
			<div class="flex items-center gap-2.5">
				<svg
					class="h-4 w-4 text-blue-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
					/>
				</svg>
				<span class="text-sm text-blue-700">Connecte-toi pour indiquer tes disponibilités</span>
			</div>
			<a
				href="/auth/google?redirectTo={$page.url.pathname}"
				class="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
			>
				Connexion
			</a>
		</div>
	{/if}

	<!-- Legend -->
	<div class="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-400">
		<!-- My selection (only shown when logged in) -->
		{#if user}
			<div class="flex items-center gap-2">
				<div
					class="relative h-5 w-7 rounded-sm"
					style="background-color: {heatmapColor(0.5)}; box-shadow: inset 0 0 0 3px #3b82f6;"
				>
					<div
						class="absolute top-0.5 left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500"
					>
						<svg
							class="h-2 w-2 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="3.5"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
						</svg>
					</div>
				</div>
				<span>Mes dispos</span>
			</div>
		{/if}
		<!-- Others -->
		<div class="flex items-center gap-2">
			<div class="flex gap-px">
				{#each [0.2, 0.5, 0.8, 1] as r (r)}
					<div
						class="h-4 w-4 first:rounded-l-sm last:rounded-r-sm"
						style="background-color: {heatmapColor(r)};"
					></div>
				{/each}
			</div>
			<span>Disponibilité du groupe</span>
		</div>
		<!-- Calendar status -->
		{#if initialCalendarEvents.length > 0}
			<div class="flex items-center gap-2">
				<div class="rounded bg-amber-400 px-1.5 py-0.5 text-[9px] font-semibold text-white">
					Agenda
				</div>
				<span
					>{initialCalendarEvents.length} événement{initialCalendarEvents.length > 1 ? 's' : ''} Google
					Calendar</span
				>
			</div>
		{:else if calendarError === 'auth_expired' || calendarError === 'no_token'}
			<a
				href="/auth/google?redirectTo={$page.url.pathname}"
				class="flex items-center gap-1.5 text-zinc-400 underline underline-offset-2 hover:text-zinc-600"
				title="Reconnectez-vous pour voir vos événements Google Calendar"
			>
				<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
					/>
				</svg>
				Connecter Google Calendar
			</a>
		{:else if calendarError === 'api_error'}
			<span class="text-zinc-300" title="Erreur lors du chargement du calendrier"
				>Agenda indisponible</span
			>
		{/if}
	</div>

	<!-- Grid -->
	<div class="mb-8 overflow-hidden rounded-xl">
		<div class="overflow-x-auto">
			<table class="w-full" style="min-width: max-content; border-collapse: collapse;">
				<thead>
					<tr class="bg-white">
						<!-- Empty corner cell -->
						<th
							class="sticky left-0 z-10 border-r border-b border-zinc-200 bg-white"
							style="min-width: 64px;"
						></th>
						{#each dates as date (date)}
							{@const parts = formatDateParts(date)}
							{@const dayEvents = getAllDayEvents(date)}
							<th
								class="border-r border-b border-zinc-200 bg-white px-2 py-2 text-center"
								style="min-width: 80px;"
							>
								<span
									class="block text-[10px] font-semibold tracking-widest text-zinc-400 uppercase"
									>{parts.day}</span
								>
								<span class="block text-sm leading-tight font-bold text-zinc-900"
									>{parts.num} {parts.month}</span
								>
								{#if dayEvents.length > 0}
									<div class="mt-1.5 flex flex-col gap-0.5">
										{#each dayEvents as ev (ev.id)}
											<div
												role="note"
												class="cursor-default truncate rounded bg-amber-400/90 px-1 py-px text-[9px] leading-tight font-semibold text-white"
												onmouseenter={(e) => showTooltip(e, [ev])}
												onmousemove={moveTooltip}
												onmouseleave={hideTooltip}
											>
												{ev.summary}
											</div>
										{/each}
									</div>
								{/if}
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each hours as hour (hour)}
						<tr class="group/row">
							<!-- Time label: shows the range "10h → 11h" -->
							<td
								class="sticky left-0 z-10 border-r border-b border-zinc-200 bg-white select-none"
								style="width: 64px; min-width: 64px; height: 52px; border-radius: 6px;"
							>
								<div class="flex h-full flex-col items-end justify-between px-3 py-1.5">
									<span class="text-xs leading-none font-semibold text-zinc-600"
										>{formatHour(hour)}</span
									>
									<span class="text-[10px] leading-none text-zinc-300">{formatHour(hour + 1)}</span>
								</div>
							</td>

							{#each dates as date (date)}
								{@const conv = getConvergence(date, hour)}
								{@const mine = isMySlot(date, hour)}
								{@const slotEvents = getSlotCalendarEvents(date, hour)}
								{@const hoveredHasSlot = hoveredEmail
									? (effectiveResponses[hoveredEmail]?.slots[date]?.includes(hour) ?? false)
									: false}
								<td
									class="group/cell relative border-r border-b border-zinc-100 select-none bg-white"
									class:cursor-pointer={!!user}
									class:cursor-default={!user}
									style="height: 52px; min-width: 80px;"
									onclick={() => toggleSlot(date, hour)}
									onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleSlot(date, hour)}
									role="button"
									tabindex={user ? 0 : -1}
									aria-pressed={mine}
								>
									<!-- Heatmap fill — le bg-white du <td> crée le gap autour -->
									<div
										class="pointer-events-none absolute"
										style="inset: 3px; border-radius: 4px; background-color: {heatmapColor(conv.ratio)};"
									></div>

									<!-- Hover tint -->
									<div
										class="pointer-events-none absolute bg-white opacity-0 transition-opacity duration-75 group-hover/cell:opacity-15"
										style="inset: 3px; border-radius: 4px;"
									></div>

									<!-- Participant highlight overlay -->
									{#if hoveredEmail}
										<div
											class="pointer-events-none absolute transition-opacity duration-75"
											style="inset: 3px; border-radius: 4px; background-color: {hoveredHasSlot
												? 'transparent'
												: 'rgba(255,255,255,0.72)'}"
										></div>
									{/if}

									<!-- Selection ring -->
									{#if hoveredHasSlot || mine}
										<div
											class="pointer-events-none absolute"
											style="inset: 2px; border-radius: 5px; border: 3px solid {hoveredHasSlot
												? '#7c3aed'
												: '#3b82f6'};"
										></div>
									{/if}

									<!-- My slot: filled blue dot top-left -->
									{#if mine}
										<div
											class="pointer-events-none absolute top-1.5 left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 shadow-sm"
										>
											<svg
												class="h-2.5 w-2.5 text-white"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="3.5"
											>
												<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
											</svg>
										</div>
									{/if}

									<!-- Calendar events: small badge top-right -->
									{#if slotEvents.length > 0}
										<div
											role="presentation"
											class="absolute top-1 right-1 flex flex-col items-end gap-0.5"
											onmouseenter={(e) => {
												e.stopPropagation();
												showTooltip(e, slotEvents);
											}}
											onmousemove={(e) => {
												e.stopPropagation();
												moveTooltip(e);
											}}
											onmouseleave={hideTooltip}
										>
											{#each slotEvents.slice(0, 1) as ev (ev.id)}
												<div
													class="max-w-[56px] truncate rounded bg-amber-400 px-1 py-px text-[9px] leading-tight font-semibold text-white shadow-sm"
												>
													{ev.summary}
												</div>
											{/each}
											{#if slotEvents.length > 1}
												<div
													class="rounded bg-amber-400/80 px-1 py-px text-[9px] leading-tight font-semibold text-white"
												>
													+{slotEvents.length - 1}
												</div>
											{/if}
										</div>
									{/if}

									<!-- Convergence count: centered -->
									{#if conv.total > 1 && conv.count > 0}
										<div
											class="pointer-events-none absolute inset-0 flex items-center justify-center"
										>
											<span
												class="text-[11px] leading-none font-semibold tabular-nums"
												style="color: {conv.ratio > 0.55
													? 'rgba(255,255,255,0.9)'
													: 'rgba(39,39,42,0.65)'};"
											>
												{conv.count}/{conv.total}
											</span>
										</div>
									{/if}
								</td>
							{/each}
						</tr>
					{/each}

					<!-- Final time boundary -->
					<tr>
						<td
							class="sticky left-0 z-10 border-r border-zinc-200 bg-white px-3 py-1 text-right"
							style="width: 64px; min-width: 64px; border-radius: 6px;"
						>
							<span class="text-xs font-semibold text-zinc-600">{formatHour(creneau.hour_end)}</span
							>
						</td>
						{#each dates as date2 (date2)}
							<td class="bg-white" style="height: 8px; min-width: 80px; border-radius: 6px;"></td>
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
							role="presentation"
							class="inline-flex h-7 cursor-default items-center gap-1.5 rounded-full border px-3 text-xs transition-all duration-100"
							class:border-violet-400={hoveredEmail === email}
							class:bg-violet-50={hoveredEmail === email}
							class:border-zinc-200={hoveredEmail !== email}
							class:bg-white={hoveredEmail !== email}
							onmouseenter={() => (hoveredEmail = email)}
							onmouseleave={() => (hoveredEmail = null)}
						>
							<span class="font-medium text-zinc-700">{resp.name}</span>
							{#if user && email === user.email}
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
							class="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5"
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

<!-- Fixed tooltip for calendar event badges -->
{#if tooltipData}
	<div
		class="pointer-events-none fixed z-50 max-w-[220px] rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-lg"
		style="left: {tooltipPos.x + 12}px; top: {tooltipPos.y - 8}px; transform: translateY(-100%);"
	>
		{#each tooltipData.lines as line, i (i)}
			{#if i % 2 === 0}
				<p class="text-xs font-semibold text-zinc-900 {i > 0 ? 'mt-1.5' : ''}">{line}</p>
			{:else}
				<p class="text-[11px] text-zinc-400">{line}</p>
			{/if}
		{/each}
	</div>
{/if}
