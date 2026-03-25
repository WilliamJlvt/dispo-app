<script lang="ts">
	import type { PageData } from './$types';
	import { formatDate } from '$lib/utils';
	import logo from '$lib/assets/logo.svg';

	let { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
	<title>Créneaux</title>
</svelte:head>

{#if data.error === 'unauthorized'}
	<div class="mx-auto max-w-5xl px-4 pt-6">
		<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			Votre adresse email n'est pas autorisée. Contactez l'administrateur.
		</div>
	</div>
{/if}

{#if !data.user}
	<div class="mx-auto max-w-xl px-4 py-24 text-center">
		<div class="mb-8">
			<div class="mb-6 flex items-center justify-center gap-3">
				<img src={logo} alt="" class="h-14 w-auto" />
				<span class="text-4xl font-bold tracking-tight text-zinc-950">Créneaux</span>
			</div>
			<p class="text-base leading-relaxed text-zinc-500">
				Planification collaborative par disponibilités.<br />
				Chacun coche ses créneaux libres, la heatmap révèle les meilleurs moments.
			</p>
		</div>

		<a
			href="/auth/google"
			class="inline-flex items-center justify-center gap-2.5 rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
		>
			<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
				<path
					d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					fill="#4285F4"
				/>
				<path
					d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					fill="#34A853"
				/>
				<path
					d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					fill="#FBBC05"
				/>
				<path
					d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					fill="#EA4335"
				/>
			</svg>
			Continuer avec Google
		</a>

		<div class="mt-16 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
			{#each [{ icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', title: 'Créez un créneau', desc: 'Définissez une plage de dates et la fenêtre horaire.' }, { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Cochez vos dispo', desc: 'Cliquez sur les cases pour indiquer vos disponibilités.' }, { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Convergence live', desc: 'La heatmap révèle en temps réel les meilleurs créneaux.' }] as item (item.title)}
				<div class="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
					<div
						class="mb-3 flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white shadow-sm"
					>
						<svg
							class="h-4 w-4 text-zinc-700"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d={item.icon} />
						</svg>
					</div>
					<h3 class="mb-1 text-sm font-semibold text-zinc-950">{item.title}</h3>
					<p class="text-xs leading-relaxed text-zinc-500">{item.desc}</p>
				</div>
			{/each}
		</div>
	</div>
{:else}
	<div class="mx-auto max-w-5xl px-4 py-8">
		<div class="mb-6 flex items-center justify-between">
			<div>
				<h1 class="text-xl font-semibold text-zinc-950">Créneaux</h1>
				<p class="mt-0.5 text-sm text-zinc-500">
					{data.crenaux.length} créneau{data.crenaux.length !== 1 ? 'x' : ''}
				</p>
			</div>
			<a
				href="/nouveau"
				class="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
			>
				<svg
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2.5"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				Nouveau
			</a>
		</div>

		{#if data.crenaux.length === 0}
			<div class="rounded-lg border border-dashed border-zinc-300 py-16 text-center">
				<p class="mb-3 text-sm text-zinc-500">Vous n'avez pas encore créé de créneau.</p>
				<a
					href="/nouveau"
					class="text-sm font-medium text-zinc-950 underline underline-offset-4 hover:text-zinc-600"
				>
					Créer mon premier créneau
				</a>
			</div>
		{:else}
			<div class="divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200">
				{#each data.crenaux as c (c.id)}
					<a
						href="/c/{c.id}"
						class="group flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-zinc-50"
					>
						<div class="min-w-0">
							<p class="truncate text-sm font-medium text-zinc-950 group-hover:text-zinc-700">
								{c.title}
							</p>
							<p class="mt-0.5 text-xs text-zinc-400">
								{formatDate(c.date_start)} → {formatDate(c.date_end)}
								· {c.hour_start}h–{c.hour_end}h
							</p>
						</div>
						<div class="flex flex-shrink-0 items-center gap-3">
							<span class="text-xs text-zinc-400">
								{Object.keys(c.responses).length} réponse{Object.keys(c.responses).length !== 1
									? 's'
									: ''}
							</span>
							<svg
								class="h-4 w-4 text-zinc-300 group-hover:text-zinc-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
							</svg>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
{/if}
