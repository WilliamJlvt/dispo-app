import type { LayoutServerLoad } from './$types';
import { isAdmin } from '$lib/server/data';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user,
		isAdmin: !!locals.user && isAdmin(locals.user.email)
	};
};
