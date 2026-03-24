<script lang="ts">
  import type { PageData, ActionData } from './$types';

  let { data, form } = $props<{ data: PageData; form: ActionData }>();

  let title = $state('');
  let dateStart = $state(data.defaultStart);
  let dateEnd = $state(data.defaultEnd);
  let hourStart = $state(10);
  let hourEnd = $state(20);
  let includeWeekends = $state(false);

  const hourOptions = Array.from({ length: 25 }, (_, i) => i);
</script>

<svelte:head>
  <title>Nouveau créneau - Créneaux</title>
</svelte:head>

<div class="max-w-xl mx-auto px-4 py-8">
  <div class="mb-6">
    <a href="/" class="text-sm text-slate-500 hover:text-slate-700 transition-colors">
      &larr; Retour
    </a>
  </div>

  <h1 class="text-2xl font-bold text-[#0d1b2a] mb-6">Nouveau créneau</h1>

  {#if form?.error}
    <div class="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
      {form.error}
    </div>
  {/if}

  <form method="POST" class="space-y-5">
    <!-- Title -->
    <div>
      <label for="title" class="block text-sm font-medium text-slate-700 mb-1">
        Titre <span class="text-red-500">*</span>
      </label>
      <input
        id="title"
        name="title"
        type="text"
        required
        bind:value={title}
        placeholder="Ex: Réunion équipe produit"
        class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 placeholder-slate-400
               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
    </div>

    <!-- Date range -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="date_start" class="block text-sm font-medium text-slate-700 mb-1">
          Date de début <span class="text-red-500">*</span>
        </label>
        <input
          id="date_start"
          name="date_start"
          type="date"
          required
          bind:value={dateStart}
          class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>
      <div>
        <label for="date_end" class="block text-sm font-medium text-slate-700 mb-1">
          Date de fin <span class="text-red-500">*</span>
        </label>
        <input
          id="date_end"
          name="date_end"
          type="date"
          required
          bind:value={dateEnd}
          class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>
    </div>

    <!-- Hours -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="hour_start" class="block text-sm font-medium text-slate-700 mb-1">
          Heure de début
        </label>
        <select
          id="hour_start"
          name="hour_start"
          bind:value={hourStart}
          class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        >
          {#each hourOptions as h}
            <option value={h}>{h}h00</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="hour_end" class="block text-sm font-medium text-slate-700 mb-1">
          Heure de fin
        </label>
        <select
          id="hour_end"
          name="hour_end"
          bind:value={hourEnd}
          class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        >
          {#each hourOptions as h}
            <option value={h}>{h}h00</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Weekend toggle -->
    <div class="flex items-center gap-3">
      <input
        id="include_weekends"
        name="include_weekends"
        type="checkbox"
        bind:checked={includeWeekends}
        class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
      <label for="include_weekends" class="text-sm text-slate-700">
        Inclure les week-ends
      </label>
    </div>

    <!-- Preview -->
    {#if dateStart && dateEnd}
      <div class="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-600">
        Créneaux de <strong>{hourStart}h</strong> à <strong>{hourEnd}h</strong>
        par tranche d'1 heure, du <strong>{dateStart}</strong> au <strong>{dateEnd}</strong>
        {#if !includeWeekends} (jours ouvrés seulement){/if}.
      </div>
    {/if}

    <button
      type="submit"
      class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
    >
      Créer le créneau
    </button>
  </form>
</div>
