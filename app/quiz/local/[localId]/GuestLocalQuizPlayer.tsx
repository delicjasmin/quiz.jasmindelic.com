"use client";

import { getGuestQuiz } from "@/lib/guest-quizzes";
import type { PersistedQuizSettings } from "@/lib/quiz-types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useMemo } from "react";
import { QuizPlayerCore, type PlayQuiz } from "../../QuizPlayerCore";

export function GuestLocalQuizPlayer({ localId }: { localId: string }) {
  const playQuiz: PlayQuiz | null = useMemo(() => {
    const quiz = getGuestQuiz(localId);
    if (!quiz) return null;

    return {
      id: quiz.localId,
      title: quiz.title,
      sourceFileName: quiz.sourceFileName,
      settings: quiz.settings as PersistedQuizSettings,
      isOwner: false,
      isShared: false,
      questions: quiz.questions,
    };
  }, [localId]);

  if (!playQuiz) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Quiz not found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This quiz is only available in the browser where it was created. Sign
            in to access saved quizzes across devices.
          </Typography>
          <StackedActions />
        </Paper>
      </Container>
    );
  }

  return <QuizPlayerCore quiz={playQuiz} guestMode />;
}

function StackedActions() {
  return (
    <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
      <Button component={Link} href="/quizzes" variant="outlined">
        My Quizzes
      </Button>
      <Button component={Link} href="/" variant="contained">
        Create a quiz
      </Button>
      <Button component={Link} href="/login" variant="outlined">
        Sign in with Google
      </Button>
    </Box>
  );
}
