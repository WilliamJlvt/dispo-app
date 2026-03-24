import type { PageServerLoad } from './$types';
import { listCrenaux } from '$lib/server/data';

export const load: PageServerLoad = async ({ locals, url }) => {
  const error = url.searchParams.get('error');
  const crenaux = locals.user ? listCrenaux() : [];

  return {
    user: locals.user,
    crenaux,
    error
  };
};
