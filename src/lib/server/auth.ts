import { Google, generateState, generateCodeVerifier } from 'arctic';
import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import type { SessionUser } from '$lib/types';

export { generateState, generateCodeVerifier };

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!
);

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'change-me-32-chars-minimum-pls!!'
);

export async function createSession(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    picture: user.picture,
    accessToken: user.accessToken ?? ''
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      email: payload.email as string,
      name: payload.name as string,
      picture: payload.picture as string,
      accessToken: (payload.accessToken as string) || undefined
    };
  } catch {
    return null;
  }
}

export function decodeIdToken(idToken: string): {
  email: string;
  name: string;
  picture: string;
} {
  const payload = decodeJwt(idToken);
  return {
    email: (payload.email as string) ?? '',
    name: (payload.name as string) ?? '',
    picture: (payload.picture as string) ?? ''
  };
}
