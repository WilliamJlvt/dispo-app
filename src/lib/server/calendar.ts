import { google as googleApis } from 'googleapis';
import { env } from '$env/dynamic/private';
import type { CalendarEvent } from '$lib/types';

/**
 * Fetches events from the user's primary Google Calendar for the given date range.
 * Uses the refresh token to obtain a fresh access token automatically.
 * Returns [] silently on any error (calendar access is optional/non-blocking).
 */
export async function getCalendarEvents(
	accessToken: string | undefined,
	dateStart: string,
	dateEnd: string,
	refreshToken?: string
): Promise<{ events: CalendarEvent[]; error?: string }> {
	if (!accessToken && !refreshToken) {
		return { events: [], error: 'no_token' };
	}

	try {
		const auth = new googleApis.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
		auth.setCredentials({
			access_token: accessToken,
			refresh_token: refreshToken
		});

		const calendar = googleApis.calendar({ version: 'v3', auth });

		// timeMax is exclusive, so add 1 day to dateEnd
		const timeMin = new Date(dateStart + 'T00:00:00').toISOString();
		const endDate = new Date(dateEnd + 'T00:00:00');
		endDate.setDate(endDate.getDate() + 1);
		const timeMax = endDate.toISOString();

		const res = await calendar.events.list({
			calendarId: 'primary',
			timeMin,
			timeMax,
			singleEvents: true,
			orderBy: 'startTime',
			maxResults: 250
		});

		const items = res.data.items ?? [];
		const events: CalendarEvent[] = [];

		for (const item of items) {
			const startRaw = item.start?.dateTime ?? item.start?.date;
			const endRaw = item.end?.dateTime ?? item.end?.date;
			if (!startRaw || !endRaw) continue;

			// For all-day events (date only), treat as full day
			const start = startRaw.includes('T') ? startRaw : startRaw + 'T00:00:00';
			const end = endRaw.includes('T') ? endRaw : endRaw + 'T23:59:59';

			events.push({
				id: item.id ?? '',
				summary: item.summary ?? '(Sans titre)',
				start,
				end
			});
		}

		console.log(`[calendar] ${events.length} events fetched (${dateStart} → ${dateEnd})`);
		return { events };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[calendar] fetch failed:', message);

		// Distinguish token expiry from other errors
		const isAuthError =
			message.includes('invalid_grant') ||
			message.includes('Token has been expired') ||
			message.includes('Invalid Credentials') ||
			message.includes('unauthorized');

		return { events: [], error: isAuthError ? 'auth_expired' : 'api_error' };
	}
}
