import prisma from "@/lib/prisma";
import { protectedProcedure, router } from "@/server/trpc";
import { z } from "zod";

export const userRouter = router({
  getUser: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.id },
      });
      return user;
    }),
});
