import prisma from "@/lib/prisma";
import type { PersistedQuizSettings } from "@/lib/quiz-types";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";

type QuizPageProps = {
  params: Promise<{ id: string }>;
};

export default async function QuizPage({ params }: QuizPageProps) {
  const { id } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!quiz) {
    notFound();
  }

  const settings = quiz.settings as PersistedQuizSettings;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
            {quiz.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generated from {quiz.sourceFileName ?? "uploaded PDF"} · pages{" "}
            {settings.pageStart}-{settings.pageEnd} · {quiz.questions.length}{" "}
            questions
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ flexWrap: "wrap" }}
          >
            <Chip label={`Difficulty: ${settings.difficulty}`} size="small" />
            <Chip label={`Type: ${settings.questionType}`} size="small" />
            <Chip
              label={`Answers: ${settings.answerReveal}`}
              size="small"
            />
          </Stack>
        </Paper>

        <Stack spacing={2}>
          {quiz.questions.map((question, index) => (
            <Paper key={question.id} variant="outlined" sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Question {index + 1} · {question.type}
              </Typography>
              <Typography sx={{ mt: 1, fontWeight: 600 }}>
                {question.question}
              </Typography>

              {Array.isArray(question.options) && question.options.length > 0 && (
                <Stack component="ul" sx={{ mt: 1.5, pl: 2.5 }} spacing={0.5}>
                  {(question.options as string[]).map((option) => (
                    <Typography key={option} component="li" variant="body2">
                      {option}
                    </Typography>
                  ))}
                </Stack>
              )}

              {question.explanation && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1.5 }}
                >
                  {question.explanation}
                </Typography>
              )}
            </Paper>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}
