import { redirect, type Handle } from '@sveltejs/kit';
import { verifySession } from '$lib/server/auth';

const PROTECTED_ROUTES = ['/nouveau', '/admin', '/c/'];

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('session');

	if (token) {
		const user = await verifySession(token);
		if (!user) {
			// Token invalide ou expiré — on nettoie
			event.cookies.delete('session', { path: '/' });
		}
		event.locals.user = user;
	} else {
		event.locals.user = null;
	}

	const path = event.url.pathname;
	const needsAuth = PROTECTED_ROUTES.some((r) => path.startsWith(r));

	if (needsAuth && !event.locals.user) {
		redirect(302, '/');
	}

	return resolve(event);
};
