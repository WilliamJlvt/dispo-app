import type { Handle } from '@sveltejs/kit';
import { verifySession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('session');

  if (token) {
    const user = await verifySession(token);
    event.locals.user = user;
  } else {
    event.locals.user = null;
  }

  return resolve(event);
};
