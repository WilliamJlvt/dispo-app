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
    formatHour
  } from '$lib/utils';

  let { data } = $props<{ data: PageData }>();

  const dates = getDatesInRange(
    data.creneau.date_start,
    data.creneau.date_end,
    data.creneau.include_weekends
  );
  const hours = getHours(data.creneau.hour_start, data.creneau.hour_end);

  let serverResponses = $state<Record<string, UserResponse>>(data.creneau.responses);
  let mySlots = $state<Record<string, number[]>>(
    data.creneau.responses[data.user.email]?.slots ?? {}
  );
  let saving = $state(false);
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let copied = $state(false);

  // Effective responses: server data merged with current user's live selections
  let effectiveResponses = $derived<Record<string, UserResponse>>({
    ...serverResponses,
    [data.user.email]: {
      name: data.user.name,
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
    return (data.calendarEvents as CalendarEvent[]).some((ev) =>
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
      await fetch(`/api/crenaux/${data.creneau.id}`, {
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
    const es = new EventSource(`/c/${data.creneau.id}/stream`);
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
  <title>{data.creneau.title} - Créneaux</title>
</svelte:head>

<div class="max-w-5xl mx-auto px-4 py-6">
  <!-- Header -->
  <div class="mb-6">
    <a href="/" class="text-sm text-slate-500 hover:text-slate-700 transition-colors">
      &larr; Retour
    </a>
  </div>

  <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
    <div>
      <h1 class="text-2xl font-bold text-[#0d1b2a]">{data.creneau.title}</h1>
      <p class="text-sm text-slate-500 mt-1">
        {formatDate(data.creneau.date_start)} &rarr; {formatDate(data.creneau.date_end)}
        &middot; {data.creneau.hour_start}h&ndash;{data.creneau.hour_end}h
        &middot; {participants.length} participant{participants.length !== 1 ? 's' : ''}
      </p>
    </div>
    <div class="flex items-center gap-2 flex-shrink-0">
      {#if saving}
        <span class="text-xs text-slate-400 animate-pulse">Sauvegarde...</span>
      {:else}
        <span class="text-xs text-slate-300">Sauvegardé</span>
      {/if}
      <button
        onclick={copyLink}
        class="text-sm border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900
               px-3 py-1.5 rounded-lg transition-colors"
      >
        {copied ? 'Copié !' : 'Copier le lien'}
      </button>
    </div>
  </div>

  <!-- Legend -->
  <div class="flex flex-wrap items-center gap-4 mb-4 text-xs text-slate-500">
    <div class="flex items-center gap-1.5">
      <div class="w-4 h-4 rounded border-2 border-blue-500 bg-white"></div>
      <span>Votre sélection</span>
    </div>
    <div class="flex items-center gap-1.5">
      <div class="w-4 h-4 rounded relative bg-slate-100 border border-slate-200">
        <div class="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-orange-400"></div>
      </div>
      <span>Événement Google Calendar</span>
    </div>
    <div class="flex items-center gap-2">
      <div
        class="w-4 h-4 rounded border border-slate-200"
        style="background-color: #f8fafc"
      ></div>
      <span>0%</span>
      <div
        class="w-4 h-4 rounded"
        style="background-color: rgb(119,133,149)"
      ></div>
      <span>50%</span>
      <div
        class="w-4 h-4 rounded"
        style="background-color: #0d1b2a"
      ></div>
      <span>100%</span>
    </div>
  </div>

  <!-- Grid -->
  <div class="border border-slate-200 rounded-xl overflow-hidden mb-8">
    <div class="overflow-x-auto">
      <table class="border-collapse" style="min-width: max-content;">
        <thead>
          <tr>
            <!-- Sticky hour column header -->
            <th
              class="sticky left-0 z-10 bg-white border-b border-r border-slate-200 px-3 py-2 text-xs font-medium text-slate-400 text-left"
              style="min-width: 52px;"
            >
              Heure
            </th>
            {#each dates as date}
              <th
                class="border-b border-r border-slate-200 px-2 py-2 text-xs font-medium text-slate-600 text-center whitespace-nowrap"
                style="min-width: 80px;"
              >
                {formatDate(date)}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each hours as hour}
            <tr>
              <!-- Sticky hour label -->
              <td
                class="sticky left-0 z-10 bg-white border-b border-r border-slate-200 px-3 text-xs font-medium text-slate-500 text-right"
                style="min-width: 52px; min-height: 44px;"
              >
                {formatHour(hour)}
              </td>
              {#each dates as date}
                {@const conv = getConvergence(date, hour)}
                {@const mine = isMySlot(date, hour)}
                {@const hasEvent = hasCalendarEvent(date, hour)}
                <td
                  class="border-b border-r border-slate-200 relative cursor-pointer select-none
                         transition-all duration-100"
                  style="min-width: 80px; min-height: 44px; background-color: {heatmapColor(conv.ratio)};"
                  onclick={() => toggleSlot(date, hour)}
                  onkeydown={(e) => e.key === 'Enter' || e.key === ' ' ? toggleSlot(date, hour) : null}
                  role="button"
                  tabindex="0"
                  aria-label="{formatDate(date)} {formatHour(hour)} - {conv.count}/{conv.total}"
                  aria-pressed={mine}
                >
                  <!-- Blue ring if current user selected this slot -->
                  {#if mine}
                    <div
                      class="absolute inset-0.5 rounded ring-2 ring-blue-500 ring-inset pointer-events-none"
                    ></div>
                  {/if}
                  <!-- Orange dot if Google Calendar event -->
                  {#if hasEvent}
                    <div
                      class="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-400 pointer-events-none"
                    ></div>
                  {/if}
                  <!-- Convergence count -->
                  {#if conv.total > 0}
                    <div
                      class="absolute inset-0 flex items-center justify-center text-xs font-medium pointer-events-none {textColor(conv.ratio)}"
                    >
                      {conv.count}/{conv.total}
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

  <!-- Participants -->
  {#if participants.length > 0}
    <div class="mb-8">
      <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Participants ({participants.length})
      </h2>
      <div class="flex flex-wrap gap-2">
        {#each participants as email}
          {@const resp = effectiveResponses[email]}
          <div class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <span class="text-sm text-slate-700">{resp.name}</span>
            {#if email === data.user.email}
              <span class="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Vous</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Best slots -->
  {#if bestSlots.length > 0}
    <div>
      <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Meilleurs créneaux
      </h2>
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {#each bestSlots as slot, i}
          <div
            class="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <span
                class="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                style="background-color: {heatmapColor(slot.ratio)}; color: {slot.ratio > 0.55 ? 'white' : '#475569'}"
              >
                {i + 1}
              </span>
              <div>
                <div class="text-sm font-medium text-slate-800">
                  {formatDate(slot.date)}
                </div>
                <div class="text-xs text-slate-500">
                  {formatHour(slot.hour)}&ndash;{formatHour(slot.hour + 1)}
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-semibold text-slate-800">
                {slot.count}/{slot.total}
              </div>
              <div class="text-xs text-slate-400">
                {Math.round(slot.ratio * 100)}%
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="text-sm text-slate-400 text-center py-4">
      Cliquez sur les cellules pour indiquer vos disponibilités.
    </div>
  {/if}
</div>
