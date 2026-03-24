import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { saveCreneau } from '$lib/server/data';
import { generateSlug, nextMonday, nextFriday } from '$lib/utils';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/');
	}
	return {
		defaultStart: nextMonday(),
		defaultEnd: nextFriday()
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Non autorisé' });
		}

		const formData = await request.formData();
		const title = (formData.get('title') as string)?.trim();
		const dateStart = formData.get('date_start') as string;
		const dateEnd = formData.get('date_end') as string;
		const hourStart = parseInt(formData.get('hour_start') as string, 10);
		const hourEnd = parseInt(formData.get('hour_end') as string, 10);
		const includeWeekends = formData.get('include_weekends') === 'on';

		if (!title) {
			return fail(400, { error: 'Le titre est requis' });
		}
		if (!dateStart || !dateEnd) {
			return fail(400, { error: 'Les dates sont requises' });
		}
		if (dateStart > dateEnd) {
			return fail(400, { error: 'La date de fin doit être après la date de début' });
		}
		if (isNaN(hourStart) || isNaN(hourEnd) || hourStart >= hourEnd) {
			return fail(400, { error: 'Les heures sont invalides' });
		}

		const slug = generateSlug(title);

		saveCreneau({
			id: slug,
			title,
			created_by: locals.user.email,
			created_at: new Date().toISOString(),
			date_start: dateStart,
			date_end: dateEnd,
			hour_start: hourStart,
			hour_end: hourEnd,
			include_weekends: includeWeekends,
			responses: {}
		});

		redirect(302, `/c/${slug}`);
	}
};
