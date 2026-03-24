import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCreneau, saveCreneau, deleteCreneau } from '$lib/server/data';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const creneau = getCreneau(params.slug);
	if (!creneau) {
		return new Response('Not Found', { status: 404 });
	}

	let body: { slots: Record<string, number[]> };
	try {
		body = await request.json();
	} catch {
		return new Response('Bad Request', { status: 400 });
	}

	const { email, name } = locals.user;

	// Update this user's response
	creneau.responses[email] = {
		name,
		updated_at: new Date().toISOString(),
		slots: body.slots ?? {}
	};

	saveCreneau(creneau);

	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const creneau = getCreneau(params.slug);
	if (!creneau) {
		return new Response('Not Found', { status: 404 });
	}

	// Only the creator can delete
	if (creneau.created_by !== locals.user.email) {
		return new Response('Forbidden', { status: 403 });
	}

	deleteCreneau(params.slug);
	return json({ ok: true });
};
