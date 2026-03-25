import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCreneau } from '$lib/server/data';
import { getCalendarEvents } from '$lib/server/calendar';
import type { CalendarEvent } from '$lib/types'; // needed for the array type below

export const load: PageServerLoad = async ({ params, locals, url }) => {
	if (!locals.user) {
		redirect(302, `/auth/google?redirectTo=/c/${params.slug}`);
	}

	const creneau = getCreneau(params.slug);
	if (!creneau) {
		error(404, 'Créneau introuvable');
	}

	let calendarEvents: CalendarEvent[] = [];
	let calendarError: string | undefined;

	if (locals.user.accessToken || locals.user.refreshToken) {
		const result = await getCalendarEvents(
			locals.user.accessToken,
			creneau.date_start,
			creneau.date_end,
			locals.user.refreshToken
		);
		calendarEvents = result.events;
		calendarError = result.error;
	} else {
		calendarError = 'no_token';
	}

	return {
		creneau,
		calendarEvents,
		calendarError,
		user: locals.user,
		origin: url.origin
	};
};
