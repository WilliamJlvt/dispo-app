import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getCreneau, saveCreneau } from '$lib/server/data';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) redirect(302, '/');

	const creneau = getCreneau(params.slug);
	if (!creneau) error(404, 'Créneau introuvable');
	if (creneau.created_by !== locals.user.email) error(403, 'Accès refusé');

	return { creneau };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		if (!locals.user) redirect(302, '/');

		const creneau = getCreneau(params.slug);
		if (!creneau) error(404, 'Créneau introuvable');
		if (creneau.created_by !== locals.user.email) error(403, 'Accès refusé');

		const data = await request.formData();
		const title = (data.get('title') as string)?.trim();
		const date_start = data.get('date_start') as string;
		const date_end = data.get('date_end') as string;
		const hour_start = parseInt(data.get('hour_start') as string, 10);
		const hour_end = parseInt(data.get('hour_end') as string, 10);
		const include_weekends = data.get('include_weekends') === 'on';

		if (!title || !date_start || !date_end) {
			return { error: 'Tous les champs obligatoires doivent être remplis.' };
		}
		if (date_end < date_start) {
			return { error: 'La date de fin doit être après la date de début.' };
		}
		if (hour_end <= hour_start) {
			return { error: "L'heure de fin doit être après l'heure de début." };
		}

		saveCreneau({
			...creneau,
			title,
			date_start,
			date_end,
			hour_start,
			hour_end,
			include_weekends
		});
		redirect(303, `/c/${params.slug}`);
	}
};
