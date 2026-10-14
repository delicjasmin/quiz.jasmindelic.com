import { auth } from "@/lib/auth";
import { parseGuestId } from "@/lib/guest-id";
import prisma from "@/lib/prisma";
import { extractClientIp, hashIp } from "@/lib/usage-quota";
import { initTRPC, TRPCError } from "@trpc/server";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({
    headers: opts.headers,
  });
  const guestId = parseGuestId(opts.headers);
  const ipHash = hashIp(extractClientIp(opts.headers));

  return {
    guestId,
    ipHash,
    prisma,
    session,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});
