<script lang="ts">
  import '../app.css';
  import type { LayoutData } from './$types';

  let { data, children } = $props<{ data: LayoutData; children: any }>();
</script>

<div class="min-h-screen flex flex-col bg-white">
  <header class="bg-[#0d1b2a] text-white">
    <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href="/" class="text-xl font-semibold tracking-tight hover:opacity-80 transition-opacity">
        Créneaux
      </a>
      <nav class="flex items-center gap-4">
        {#if data.user}
          <a href="/nouveau" class="text-sm text-slate-300 hover:text-white transition-colors">
            + Nouveau
          </a>
          <a href="/admin" class="text-sm text-slate-300 hover:text-white transition-colors">
            Admin
          </a>
          <div class="flex items-center gap-2">
            {#if data.user.picture}
              <img
                src={data.user.picture}
                alt={data.user.name}
                class="w-7 h-7 rounded-full object-cover"
              />
            {/if}
            <span class="text-sm text-slate-300 hidden sm:inline">{data.user.name}</span>
          </div>
          <form method="POST" action="/auth/logout">
            <button
              type="submit"
              class="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Déconnexion
            </button>
          </form>
        {:else}
          <a
            href="/auth/google"
            class="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors"
          >
            Connexion
          </a>
        {/if}
      </nav>
    </div>
  </header>

  <main class="flex-1">
    {@render children()}
  </main>

  <footer class="bg-slate-50 border-t border-slate-200 py-4">
    <div class="max-w-5xl mx-auto px-4 text-center text-sm text-slate-400">
      Créneaux &mdash; Planification collaborative
    </div>
  </footer>
</div>
