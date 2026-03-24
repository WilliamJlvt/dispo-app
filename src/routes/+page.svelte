<script lang="ts">
  import type { PageData } from './$types';
  import { formatDate } from '$lib/utils';

  let { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
  <title>Créneaux - Planification collaborative</title>
</svelte:head>

{#if data.error === 'unauthorized'}
  <div class="max-w-5xl mx-auto px-4 pt-6">
    <div class="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm">
      Votre adresse email n'est pas autorisée à accéder à cette application.
      Contactez l'administrateur pour obtenir l'accès.
    </div>
  </div>
{/if}

{#if !data.user}
  <!-- Landing page for unauthenticated users -->
  <div class="max-w-2xl mx-auto px-4 py-20 text-center">
    <h1 class="text-4xl font-bold text-[#0d1b2a] mb-4">Créneaux</h1>
    <p class="text-lg text-slate-500 mb-10">
      Trouvez le meilleur créneau pour vos réunions en un coup d'oeil.
      Chacun indique ses disponibilités, la carte thermique fait le reste.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center mb-16">
      <a
        href="/auth/google"
        class="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Se connecter avec Google
      </a>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
      <div class="bg-slate-50 rounded-xl p-5 border border-slate-200">
        <div class="text-2xl mb-2">📅</div>
        <h3 class="font-semibold text-[#0d1b2a] mb-1">Créez un créneau</h3>
        <p class="text-sm text-slate-500">
          Définissez une plage de dates et d'heures pour votre événement.
        </p>
      </div>
      <div class="bg-slate-50 rounded-xl p-5 border border-slate-200">
        <div class="text-2xl mb-2">🗓️</div>
        <h3 class="font-semibold text-[#0d1b2a] mb-1">Indiquez vos dispo</h3>
        <p class="text-sm text-slate-500">
          Cliquez sur les cases pour indiquer quand vous êtes disponible.
        </p>
      </div>
      <div class="bg-slate-50 rounded-xl p-5 border border-slate-200">
        <div class="text-2xl mb-2">🌡️</div>
        <h3 class="font-semibold text-[#0d1b2a] mb-1">Visualisez la convergence</h3>
        <p class="text-sm text-slate-500">
          La carte thermique révèle instantanément les meilleurs créneaux.
        </p>
      </div>
    </div>
  </div>
{:else}
  <!-- Authenticated home -->
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-[#0d1b2a]">Mes créneaux</h1>
      <a
        href="/nouveau"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        + Nouveau créneau
      </a>
    </div>

    {#if data.crenaux.length === 0}
      <div class="text-center py-16 text-slate-400">
        <p class="text-lg mb-4">Aucun créneau pour l'instant.</p>
        <a
          href="/nouveau"
          class="text-blue-600 hover:text-blue-700 font-medium"
        >
          Créez votre premier créneau
        </a>
      </div>
    {:else}
      <div class="grid gap-3">
        {#each data.crenaux as creneau}
          <a
            href="/c/{creneau.id}"
            class="block bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm rounded-xl p-4 transition-all"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <h2 class="font-semibold text-[#0d1b2a] truncate">{creneau.title}</h2>
                <p class="text-sm text-slate-500 mt-0.5">
                  {formatDate(creneau.date_start)} &rarr; {formatDate(creneau.date_end)}
                  &middot; {creneau.hour_start}h&ndash;{creneau.hour_end}h
                </p>
              </div>
              <div class="flex-shrink-0 text-right">
                <span class="text-sm text-slate-400">
                  {Object.keys(creneau.responses).length} réponse{Object.keys(creneau.responses).length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
{/if}
