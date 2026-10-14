"use client";

import { clearGuestQuizzes, getGuestQuizzes } from "@/lib/guest-quizzes";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function GuestQuizMigrator() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: session } = useSession();
  const linkGuestUsage = trpc.quiz.linkGuestUsage.useMutation();
  const importGuestQuizzes = trpc.quiz.importGuestQuizzes.useMutation();
  const hasMigrated = useRef(false);

  useEffect(() => {
    if (!session?.user || hasMigrated.current) return;

    hasMigrated.current = true;

    const pending = getGuestQuizzes();

    void linkGuestUsage
      .mutateAsync()
      .then(() => utils.quiz.getQuota.invalidate())
      .then(() => {
        if (pending.length === 0) return;

        return importGuestQuizzes.mutateAsync({
          quizzes: pending.map((quiz) => ({
            localId: quiz.localId,
            title: quiz.title,
            sourceFileName: quiz.sourceFileName,
            settings: quiz.settings,
            questions: quiz.questions.map((question) => ({
              type: question.type,
              question: question.question,
              options:
                question.type === "true-false" ? undefined : question.options,
              correctAnswer: question.correctAnswer,
              explanation: question.explanation,
            })),
          })),
        });
      })
      .then((result) => {
        if (!result) return;

        clearGuestQuizzes();
        router.push("/quizzes");
        router.refresh();
      })
      .catch(() => {
        hasMigrated.current = false;
      });
  }, [session?.user, linkGuestUsage, importGuestQuizzes, router, utils]);

  return null;
}
