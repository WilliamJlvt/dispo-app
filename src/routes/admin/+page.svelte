<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { formatDate } from '$lib/utils';
  import { enhance } from '$app/forms';

  let { data, form } = $props<{ data: PageData; form: ActionData }>();

  let emailsText = $state((data.allowedEmails ?? []).join('\n'));
  let confirmDelete = $state<string | null>(null);
</script>

<svelte:head>
  <title>Administration — Créneaux</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-10">
  <div class="mb-6">
    <a href="/" class="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-950">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Retour
    </a>
  </div>

  <h1 class="text-xl font-semibold text-zinc-950 mb-8">Administration</h1>

  <!-- Emails autorisés -->
  <section class="mb-10">
    <div class="mb-4">
      <h2 class="text-sm font-semibold text-zinc-950">Emails autorisés</h2>
      <p class="text-xs text-zinc-500 mt-0.5">Un email par ligne. Supporte les wildcards : <code class="font-mono bg-zinc-100 px-1 rounded">*@domaine.com</code></p>
    </div>

    {#if form?.success}
      <div class="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
        Sauvegardé.
      </div>
    {/if}
    {#if form?.error}
      <div class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
        {form.error}
      </div>
    {/if}

    <form method="POST" action="?/saveEmails" use:enhance>
      <textarea
        name="emails"
        bind:value={emailsText}
        rows="5"
        placeholder="user@example.com&#10;*@domaine.com"
        class="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-mono text-zinc-950
               placeholder-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-1 resize-y"
      ></textarea>
      <div class="mt-3 flex justify-end">
        <button
          type="submit"
          class="h-8 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium px-4 rounded-md shadow-sm"
        >
          Sauvegarder
        </button>
      </div>
    </form>
  </section>

  <!-- Liste des créneaux -->
  <section>
    <h2 class="text-sm font-semibold text-zinc-950 mb-4">
      Créneaux <span class="text-zinc-400 font-normal">({data.crenaux.length})</span>
    </h2>

    {#if data.crenaux.length === 0}
      <p class="text-sm text-zinc-400">Aucun créneau.</p>
    {:else}
      <div class="rounded-lg border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
        {#each data.crenaux as creneau}
          <div class="flex items-center justify-between gap-4 px-4 py-3">
            <div class="min-w-0">
              <a
                href="/c/{creneau.id}"
                class="text-sm font-medium text-zinc-950 hover:text-zinc-600 underline-offset-4 hover:underline truncate block"
              >
                {creneau.title}
              </a>
              <p class="text-xs text-zinc-400 mt-0.5">
                {formatDate(creneau.date_start)} → {formatDate(creneau.date_end)}
                · {creneau.created_by}
                · {Object.keys(creneau.responses).length} rép.
              </p>
            </div>

            {#if creneau.created_by === data.user.email}
              {#if confirmDelete === creneau.id}
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span class="text-xs text-zinc-500">Confirmer ?</span>
                  <form method="POST" action="?/deleteCreneau" use:enhance={() => {
                    return async ({ result, update }) => { confirmDelete = null; await update(); };
                  }}>
                    <input type="hidden" name="slug" value={creneau.id} />
                    <button
                      type="submit"
                      class="h-7 text-xs bg-red-600 hover:bg-red-700 text-white px-3 rounded-md"
                    >
                      Supprimer
                    </button>
                  </form>
                  <button
                    onclick={() => (confirmDelete = null)}
                    class="h-7 text-xs text-zinc-600 border border-zinc-200 hover:bg-zinc-50 px-3 rounded-md"
                  >
                    Annuler
                  </button>
                </div>
              {:else}
                <button
                  onclick={() => (confirmDelete = creneau.id)}
                  class="flex-shrink-0 h-7 text-xs text-red-500 hover:text-red-700 border border-zinc-200 hover:border-red-300 px-3 rounded-md"
                >
                  Supprimer
                </button>
              {/if}
            {:else}
              <span class="text-xs text-zinc-300 flex-shrink-0">Non créateur</span>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>
