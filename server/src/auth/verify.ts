import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
);

export async function verifySupabaseToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWKS);
    return payload as { sub: string; email?: string };
  } catch {
    return null;
  }
}
