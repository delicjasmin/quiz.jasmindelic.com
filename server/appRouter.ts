import { quizRouter } from "./routers/quiz";
import { userRouter } from "./routers/user";
import { router } from "./trpc";

export const appRouter = router({
  user: userRouter,
  quiz: quizRouter,
});
export type AppRouter = typeof appRouter;
