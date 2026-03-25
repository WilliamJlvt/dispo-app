import type { PageServerLoad } from './$types';
import { listCrenaux } from '$lib/server/data';

export const load: PageServerLoad = async ({ locals, url }) => {
	const error = url.searchParams.get('error');
	// Only show creneaux created by the logged-in user
	const crenaux = locals.user
		? listCrenaux().filter((c) => c.created_by === locals.user!.email)
		: [];

	return {
		user: locals.user,
		crenaux,
		error
	};
};
