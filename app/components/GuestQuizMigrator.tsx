"use client";

import { clearGuestQuizzes, guestQuizzesForImport } from "@/lib/guest-quizzes";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function GuestQuizMigrator() {
  const router = useRouter();
  const { data: session } = useSession();
  const importGuestQuizzes = trpc.quiz.importGuestQuizzes.useMutation();
  const hasImported = useRef(false);

  useEffect(() => {
    if (!session?.user || hasImported.current) return;

    const pending = guestQuizzesForImport();
    if (pending.length === 0) return;

    hasImported.current = true;

    void importGuestQuizzes
      .mutateAsync({
        quizzes: pending.map((quiz) => ({
          localId: quiz.localId,
          title: quiz.title,
          sourceFileName: quiz.sourceFileName,
          settings: quiz.settings,
          questions: quiz.questions.map((question) => ({
            type: question.type as "multiple-choice" | "true-false",
            question: question.question,
            options:
              question.type === "true-false" ? undefined : question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
          })),
        })),
      })
      .then(() => {
        clearGuestQuizzes();
        router.push("/quizzes");
        router.refresh();
      })
      .catch(() => {
        hasImported.current = false;
      });
  }, [session?.user, importGuestQuizzes, router]);

  return null;
}
