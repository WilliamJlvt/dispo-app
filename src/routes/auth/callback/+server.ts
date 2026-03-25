import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGoogle, createSession } from '$lib/server/auth';
import { getConfig } from '$lib/server/data';
import { OAuth2RequestError } from 'arctic';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('oauth_state');
	const codeVerifier = cookies.get('oauth_code_verifier');

	cookies.delete('oauth_state', { path: '/' });
	cookies.delete('oauth_code_verifier', { path: '/' });
	const redirectTo = cookies.get('oauth_redirect') ?? '/';
	cookies.delete('oauth_redirect', { path: '/' });

	if (!code || !state || state !== storedState || !codeVerifier) {
		redirect(302, '/?error=oauth_error');
	}

	try {
		const tokens = await getGoogle().validateAuthorizationCode(code, codeVerifier);

		const accessToken = tokens.accessToken;
		const refreshToken = tokens.refreshToken ?? undefined;

		const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
			headers: { Authorization: `Bearer ${accessToken}` }
		});
		const userInfo = await userInfoRes.json();
		const email: string = userInfo.email;
		const name: string = userInfo.name ?? '';
		const picture: string = userInfo.picture ?? '';

		const config = getConfig();
		const isAllowed = config.allowed_emails.some((pattern) => {
			if (pattern === email) return true;
			if (pattern.startsWith('*@')) {
				const domain = pattern.slice(2);
				return email.endsWith('@' + domain);
			}
			return false;
		});
		if (!isAllowed) redirect(302, '/?error=unauthorized');

		const sessionToken = await createSession({ email, name, picture, accessToken, refreshToken });

		cookies.set('session', sessionToken, {
			path: '/',
			httpOnly: true,
			secure: false,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		redirect(302, redirectTo);
	} catch (err) {
		if (err instanceof OAuth2RequestError) {
			redirect(302, '/?error=oauth_error');
		}
		throw err;
	}
};
