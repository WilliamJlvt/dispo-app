import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getConfig, saveConfig, listCrenaux, deleteCreneau, getCreneau, isAdmin } from '$lib/server/data';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || !isAdmin(locals.user.email)) {
		redirect(302, '/');
	}

	const config = getConfig();
	const crenaux = listCrenaux();

	return {
		allowedEmails: config.allowed_emails,
		adminEmails: config.admin_emails ?? [],
		crenaux,
		user: locals.user
	};
};

export const actions: Actions = {
	saveEmails: async ({ request, locals }) => {
		if (!locals.user || !isAdmin(locals.user.email)) {
			return fail(403, { error: 'Non autorisé' });
		}

		const formData = await request.formData();
		const raw = (formData.get('emails') as string) ?? '';
		const emails = raw
			.split('\n')
			.map((e) => e.trim())
			.filter((e) => e.length > 0 && e.includes('@'));

		const config = getConfig();
		config.allowed_emails = emails;
		saveConfig(config);

		return { success: true, target: 'emails' };
	},

	saveAdmins: async ({ request, locals }) => {
		if (!locals.user || !isAdmin(locals.user.email)) {
			return fail(403, { error: 'Non autorisé' });
		}

		const formData = await request.formData();
		const raw = (formData.get('admins') as string) ?? '';
		const admins = raw
			.split('\n')
			.map((e) => e.trim())
			.filter((e) => e.length > 0 && e.includes('@'));

		const config = getConfig();
		config.admin_emails = admins;
		saveConfig(config);

		return { success: true, target: 'admins' };
	},

	deleteCreneau: async ({ request, locals }) => {
		if (!locals.user || !isAdmin(locals.user.email)) {
			return fail(403, { error: 'Non autorisé' });
		}

		const formData = await request.formData();
		const slug = formData.get('slug') as string;

		if (!slug) {
			return fail(400, { error: 'Slug manquant' });
		}

		const creneau = getCreneau(slug);
		if (!creneau) {
			return fail(404, { error: 'Créneau introuvable' });
		}

		if (creneau.created_by !== locals.user.email) {
			return fail(403, { error: 'Vous ne pouvez supprimer que vos propres créneaux' });
		}

		deleteCreneau(slug);
		return { deleted: true };
	}
};
