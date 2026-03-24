import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGoogle, generateState, generateCodeVerifier } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies }) => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const scopes = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/calendar.readonly'
  ];

  const url = await getGoogle().createAuthorizationURL(state, codeVerifier, scopes);

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

  redirect(302, url.toString());
};
