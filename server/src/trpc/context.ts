import type { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";
import { verifySupabaseToken } from "../auth/verify";

export async function createContext({ req }: CreateHTTPContextOptions) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return { user: null };

  const payload = await verifySupabaseToken(token);
  if (!payload) return { user: null };

  return { user: { id: payload.sub, email: payload.email } };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
