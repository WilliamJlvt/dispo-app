<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { formatDate } from '$lib/utils';
  import { enhance } from '$app/forms';

  let { data, form } = $props<{ data: PageData; form: ActionData }>();

  let emailsText = $state((data.allowedEmails ?? []).join('\n'));
  let confirmDelete = $state<string | null>(null);
</script>

<svelte:head>
  <title>Administration - Créneaux</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-8">
  <div class="mb-6">
    <a href="/" class="text-sm text-slate-500 hover:text-slate-700 transition-colors">
      &larr; Retour
    </a>
  </div>

  <h1 class="text-2xl font-bold text-[#0d1b2a] mb-8">Administration</h1>

  <!-- Allowed emails section -->
  <section class="mb-10">
    <h2 class="text-lg font-semibold text-[#0d1b2a] mb-1">Emails autorisés</h2>
    <p class="text-sm text-slate-500 mb-4">
      Un email par ligne. Seuls ces utilisateurs peuvent se connecter via Google OAuth.
    </p>

    {#if form?.success}
      <div class="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
        Emails sauvegardés.
      </div>
    {/if}
    {#if form?.error}
      <div class="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
        {form.error}
      </div>
    {/if}

    <form method="POST" action="?/saveEmails" use:enhance>
      <textarea
        name="emails"
        bind:value={emailsText}
        rows="6"
        placeholder="user@example.com&#10;other@example.com"
        class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono text-slate-900
               placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
               resize-y transition"
      ></textarea>
      <div class="mt-3 flex justify-end">
        <button
          type="submit"
          class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Sauvegarder
        </button>
      </div>
    </form>
  </section>

  <!-- Créneaux list section -->
  <section>
    <h2 class="text-lg font-semibold text-[#0d1b2a] mb-4">
      Tous les créneaux ({data.crenaux.length})
    </h2>

    {#if data.crenaux.length === 0}
      <p class="text-sm text-slate-400">Aucun créneau.</p>
    {:else}
      <div class="grid gap-3">
        {#each data.crenaux as creneau}
          <div class="border border-slate-200 rounded-xl p-4">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <a
                  href="/c/{creneau.id}"
                  class="font-medium text-[#0d1b2a] hover:text-blue-600 transition-colors truncate block"
                >
                  {creneau.title}
                </a>
                <p class="text-xs text-slate-500 mt-0.5">
                  {formatDate(creneau.date_start)} &rarr; {formatDate(creneau.date_end)}
                  &middot; créé par <span class="font-medium">{creneau.created_by}</span>
                  &middot; {Object.keys(creneau.responses).length} réponse{Object.keys(creneau.responses).length !== 1 ? 's' : ''}
                </p>
                <p class="text-xs text-slate-400 mt-0.5 font-mono">{creneau.id}</p>
              </div>

              {#if creneau.created_by === data.user.email}
                {#if confirmDelete === creneau.id}
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="text-xs text-slate-600">Confirmer ?</span>
                    <form method="POST" action="?/deleteCreneau" use:enhance={() => {
                      return async ({ result, update }) => {
                        confirmDelete = null;
                        await update();
                      };
                    }}>
                      <input type="hidden" name="slug" value={creneau.id} />
                      <button
                        type="submit"
                        class="text-xs bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded transition-colors"
                      >
                        Supprimer
                      </button>
                    </form>
                    <button
                      onclick={() => (confirmDelete = null)}
                      class="text-xs text-slate-500 hover:text-slate-700 px-2.5 py-1 rounded border border-slate-200 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                {:else}
                  <button
                    onclick={() => (confirmDelete = creneau.id)}
                    class="flex-shrink-0 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2.5 py-1 rounded transition-colors"
                  >
                    Supprimer
                  </button>
                {/if}
              {:else}
                <span class="text-xs text-slate-300 flex-shrink-0">Pas le créateur</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>
