import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGoogle, generateState, generateCodeVerifier } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();

	// Store redirect destination (relative paths only, for security)
	const redirectTo = url.searchParams.get('redirectTo');
	if (redirectTo?.startsWith('/')) {
		cookies.set('oauth_redirect', redirectTo, {
			path: '/',
			httpOnly: true,
			secure: false,
			sameSite: 'lax',
			maxAge: 60 * 10
		});
	}

	const authUrl = await getGoogle().createAuthorizationURL(state, codeVerifier, {
		scopes: ['email', 'profile', 'https://www.googleapis.com/auth/calendar.readonly']
	});
	authUrl.searchParams.set('access_type', 'offline');
	authUrl.searchParams.set('prompt', 'consent');

	cookies.set('oauth_state', state, {
		path: '/',
		httpOnly: true,
		secure: false,
		sameSite: 'lax',
		maxAge: 60 * 10
	});

	cookies.set('oauth_code_verifier', codeVerifier, {
		path: '/',
		httpOnly: true,
		secure: false,
		sameSite: 'lax',
		maxAge: 60 * 10
	});

	redirect(302, authUrl.toString());
};
