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
  const dates = $derived(getDatesInRange(creneau.date_start, creneau.date_end, creneau.include_weekends));
  const hours = $derived(getHours(creneau.hour_start, creneau.hour_end));

  let serverResponses = $state<Record<string, UserResponse>>({ ...data.creneau.responses });
  let mySlots = $state<Record<string, number[]>>(
    { ...(data.creneau.responses[data.user.email]?.slots ?? {}) }
  );
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

  function hasCalendarEvent(date: string, hour: number): boolean {
    return (initialCalendarEvents as CalendarEvent[]).some((ev) =>
      eventOverlapsSlot(ev, date, hour)
    );
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

  // Text color helper: dark text on light backgrounds, white on dark
  function textColor(ratio: number): string {
    return ratio > 0.55 ? 'text-white' : 'text-slate-700';
  }
</script>

<svelte:head>
  <title>{creneau.title} - Créneaux</title>
</svelte:head>

<div class="max-w-5xl mx-auto px-4 py-8">
  <!-- Header -->
  <div class="mb-6">
    <a href="/" class="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-950">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Retour
    </a>
  </div>

  <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
    <div>
      <h1 class="text-xl font-semibold text-zinc-950">{creneau.title}</h1>
      <p class="text-sm text-zinc-500 mt-1">
        {formatDate(creneau.date_start)} → {formatDate(creneau.date_end)}
        · {creneau.hour_start}h–{creneau.hour_end}h
        · <span class="text-zinc-700 font-medium">{participants.length}</span> participant{participants.length !== 1 ? 's' : ''}
      </p>
    </div>
    <div class="flex items-center gap-3 flex-shrink-0">
      {#if saving}
        <span class="text-xs text-zinc-400 animate-pulse">Sauvegarde…</span>
      {:else}
        <span class="text-xs text-zinc-300">Sauvegardé</span>
      {/if}
      {#if user.email === creneau.created_by}
        <a
          href="/c/{creneau.id}/modifier"
          class="h-8 text-sm border border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-950 px-3 rounded-md inline-flex items-center"
        >
          Modifier
        </a>
      {/if}
      <button
        onclick={copyLink}
        class="h-8 text-sm border border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-950 px-3 rounded-md"
      >
        {copied ? 'Copié !' : 'Copier le lien'}
      </button>
    </div>
  </div>

  <!-- Legend -->
  <div class="flex flex-wrap items-center gap-4 mb-4 text-xs text-zinc-400">
    <div class="flex items-center gap-1.5">
      <div class="w-3.5 h-3.5 rounded-sm ring-2 ring-blue-500 bg-white"></div>
      <span>Votre sélection</span>
    </div>
    <div class="flex items-center gap-1.5">
      <div class="w-3.5 h-3.5 rounded-sm bg-zinc-100 border border-zinc-200 relative">
        <div class="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-orange-400"></div>
      </div>
      <span>Agenda Google</span>
    </div>
    <div class="flex items-center gap-1.5">
      <div class="flex gap-0.5">
        {#each [0, 0.33, 0.66, 1] as r}
          <div class="w-3.5 h-3.5 rounded-sm" style="background-color: {heatmapColor(r)}; border: 1px solid rgba(0,0,0,0.06)"></div>
        {/each}
      </div>
      <span>0 → 100% disponibles</span>
    </div>
  </div>

  <!-- Grid -->
  <div class="rounded-xl border border-zinc-200 overflow-hidden mb-8 shadow-sm">
    <div class="overflow-x-auto">
      <table class="border-collapse w-full" style="min-width: max-content;">
        <thead>
          <tr class="bg-zinc-50">
            <th
              class="sticky left-0 z-10 bg-zinc-50 border-b border-r border-zinc-200 px-3 py-3"
              style="min-width: 56px;"
            ></th>
            {#each dates as date}
              {@const parts = formatDateParts(date)}
              <th
                class="border-b border-r border-zinc-200 px-2 py-2.5 text-center whitespace-nowrap"
                style="min-width: 84px;"
              >
                <span class="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider">{parts.day}</span>
                <span class="block text-sm font-semibold text-zinc-950 leading-tight">{parts.num} {parts.month}</span>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each hours as hour, hi}
            <tr>
              <td
                class="sticky left-0 z-10 bg-white border-r border-zinc-200 px-3 text-right align-middle"
                class:border-b={hi < hours.length - 1}
                style="min-width: 56px; height: 52px; border-bottom-color: rgb(228 228 231);"
              >
                <span class="text-xs font-medium text-zinc-400">{formatHour(hour)}</span>
              </td>
              {#each dates as date, di}
                {@const conv = getConvergence(date, hour)}
                {@const mine = isMySlot(date, hour)}
                {@const hasEvent = hasCalendarEvent(date, hour)}
                <!-- svelte-ignore a11y_interactive_supports_focus -->
                <td
                  class="relative cursor-pointer select-none group"
                  class:border-b={hi < hours.length - 1}
                  class:border-r={di < dates.length - 1}
                  style="height: 52px; min-width: 84px; background-color: {heatmapColor(conv.ratio)}; border-color: rgba(0,0,0,0.07);"
                  onclick={() => toggleSlot(date, hour)}
                  onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleSlot(date, hour)}
                  role="button"
                  tabindex="0"
                  aria-pressed={mine}
                >
                  <!-- Hover overlay -->
                  <div class="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"></div>

                  <!-- Selection ring -->
                  {#if mine}
                    <div class="absolute inset-[3px] rounded-md ring-2 ring-blue-500 pointer-events-none"></div>
                  {/if}

                  <!-- Calendar dot -->
                  {#if hasEvent}
                    <div class="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-white pointer-events-none"></div>
                  {/if}

                  <!-- Count (only when at least 1 person available) -->
                  {#if conv.count > 0}
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span class="text-[11px] font-semibold tabular-nums {conv.ratio > 0.55 ? 'text-white/90' : 'text-zinc-600'}">
                        {conv.count}<span class="opacity-50">/{conv.total}</span>
                      </span>
                    </div>
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Participants + Best slots -->
  <div class="grid gap-6 sm:grid-cols-2">
    <!-- Participants -->
    {#if participants.length > 0}
      <div>
        <h2 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Participants · {participants.length}
        </h2>
        <div class="flex flex-wrap gap-1.5">
          {#each participants as email}
            {@const resp = effectiveResponses[email]}
            <div class="inline-flex items-center gap-1.5 h-7 rounded-full border border-zinc-200 bg-white px-3 text-xs">
              <span class="text-zinc-700 font-medium">{resp.name}</span>
              {#if email === user.email}
                <span class="text-[10px] bg-zinc-900 text-white px-1.5 py-0.5 rounded-full">vous</span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Best slots -->
    <div>
      <h2 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
        Meilleurs créneaux
      </h2>
      {#if bestSlots.length > 0}
        <div class="space-y-1.5">
          {#each bestSlots as slot, i}
            <div class="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5">
              <div
                class="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style="background-color: {heatmapColor(slot.ratio)}; color: {slot.ratio > 0.55 ? 'white' : '#52525b'}"
              >
                {i + 1}
              </div>
              <div class="flex-1 min-w-0">
                <span class="text-sm font-medium text-zinc-950">{formatDate(slot.date)}</span>
                <span class="text-xs text-zinc-400 ml-2">{formatHour(slot.hour)}–{formatHour(slot.hour + 1)}</span>
              </div>
              <div class="text-right flex-shrink-0">
                <span class="text-sm font-semibold text-zinc-950">{slot.count}/{slot.total}</span>
                <span class="text-xs text-zinc-400 ml-1">{Math.round(slot.ratio * 100)}%</span>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-sm text-zinc-400">Cliquez sur des cellules pour indiquer vos disponibilités.</p>
      {/if}
    </div>
  </div>
</div>
