import { quizRouter } from "./routers/quiz";
import { router } from "./trpc";

export const appRouter = router({
  quiz: quizRouter,
});
export type AppRouter = typeof appRouter;
