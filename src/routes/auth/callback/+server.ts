import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { google, createSession, decodeIdToken } from '$lib/server/auth';
import { getConfig } from '$lib/server/data';
import { OAuth2RequestError } from 'arctic';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('oauth_state');
  const codeVerifier = cookies.get('oauth_code_verifier');

  // Clean up OAuth cookies
  cookies.delete('oauth_state', { path: '/' });
  cookies.delete('oauth_code_verifier', { path: '/' });

  if (!code || !state || state !== storedState || !codeVerifier) {
    redirect(302, '/?error=oauth_error');
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);

    // Arctic v1: tokens object has accessToken() and idToken() methods
    const accessToken = tokens.accessToken();
    const idToken = tokens.idToken();

    const { email, name, picture } = decodeIdToken(idToken);

    // Check whitelist
    const config = getConfig();
    if (!config.allowed_emails.includes(email)) {
      redirect(302, '/?error=unauthorized');
    }

    const sessionToken = await createSession({
      email,
      name,
      picture,
      accessToken
    });

    cookies.set('session', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    redirect(302, '/');
  } catch (err) {
    if (err instanceof OAuth2RequestError) {
      redirect(302, '/?error=oauth_error');
    }
    throw err;
  }
};
