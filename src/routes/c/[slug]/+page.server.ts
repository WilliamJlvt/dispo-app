import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCreneau } from '$lib/server/data';
import { getCalendarEvents } from '$lib/server/calendar';
import type { CalendarEvent } from '$lib/types';

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.user) {
    redirect(302, '/');
  }

  const creneau = getCreneau(params.slug);
  if (!creneau) {
    error(404, 'Créneau introuvable');
  }

  let calendarEvents: CalendarEvent[] = [];
  if (locals.user.accessToken) {
    calendarEvents = await getCalendarEvents(
      locals.user.accessToken,
      creneau.date_start,
      creneau.date_end
    );
  }

  return {
    creneau,
    calendarEvents,
    user: locals.user
  };
};
