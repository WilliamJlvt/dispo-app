<script lang="ts">
  import '../app.css';
  import type { LayoutData } from './$types';

  let { data, children } = $props<{ data: LayoutData; children: any }>();
</script>

<div class="min-h-screen flex flex-col bg-white text-zinc-950">
  <header class="border-b border-zinc-200 bg-white sticky top-0 z-50">
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
      <a href="/" class="font-semibold text-sm tracking-tight hover:text-zinc-600">
        Créneaux
      </a>
      <nav class="flex items-center gap-1">
        {#if data.user}
          <a
            href="/nouveau"
            class="text-sm text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 px-3 py-1.5 rounded-md font-medium"
          >
            Nouveau
          </a>
          <a
            href="/admin"
            class="text-sm text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 px-3 py-1.5 rounded-md font-medium"
          >
            Admin
          </a>
          <div class="w-px h-4 bg-zinc-200 mx-1"></div>
          <div class="flex items-center gap-2 pl-1">
            {#if data.user.picture}
              <img
                src={data.user.picture}
                alt={data.user.name}
                class="w-7 h-7 rounded-full object-cover border border-zinc-200"
              />
            {/if}
            <span class="text-sm text-zinc-600 hidden sm:inline">{data.user.name}</span>
          </div>
          <a
            href="/auth/logout"
            class="text-sm text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 px-3 py-1.5 rounded-md ml-1"
          >
            Déconnexion
          </a>
        {:else}
          <a
            href="/auth/google"
            class="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium px-4 py-2 rounded-md"
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
</div>
