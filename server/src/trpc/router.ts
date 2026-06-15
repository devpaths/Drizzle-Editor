import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { schemas } from "../db/schema";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create();

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { user: ctx.user } });
});

const protectedProcedure = t.procedure.use(isAuthed);

export const appRouter = t.router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select({
        id: schemas.id,
        name: schemas.name,
        updatedAt: schemas.updatedAt,
      })
      .from(schemas)
      .where(eq(schemas.userId, ctx.user.id))
      .orderBy(schemas.updatedAt);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [row] = await db
        .select()
        .from(schemas)
        .where(and(eq(schemas.id, input.id), eq(schemas.userId, ctx.user.id)));
      return row ?? null;
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const [row] = await db
        .insert(schemas)
        .values({
          userId: ctx.user.id,
          name: input.name,
          model: { tables: [], relations: [] },
        })
        .returning();
      return row;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), model: z.any() }))
    .mutation(async ({ input, ctx }) => {
      const [row] = await db
        .update(schemas)
        .set({ model: input.model, updatedAt: new Date() })
        .where(and(eq(schemas.id, input.id), eq(schemas.userId, ctx.user.id)))
        .returning();
      return row;
    }),

  rename: protectedProcedure
    .input(z.object({ id: z.string().uuid(), name: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const [row] = await db
        .update(schemas)
        .set({ name: input.name, updatedAt: new Date() })
        .where(and(eq(schemas.id, input.id), eq(schemas.userId, ctx.user.id)))
        .returning();
      return row;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await db
        .delete(schemas)
        .where(and(eq(schemas.id, input.id), eq(schemas.userId, ctx.user.id)));
      return { success: true };
    }),
});

export type AppRouter = typeof appRouter;
