"use client";

import { trpc } from "@/lib/trpc";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { QuizPlayerCore } from "../QuizPlayerCore";

export function QuizPlayer({ quizId }: { quizId: string }) {
  const { data, isLoading, error } = trpc.quiz.getForPlay.useQuery({ id: quizId });

  if (isLoading) {
    return (
      <Box className="flex min-h-[70vh] items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Quiz unavailable
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {error?.message ??
              "This quiz does not exist or you do not have access to it."}
          </Typography>
          <Button component={Link} href="/" variant="contained">
            Go home
          </Button>
        </Paper>
      </Container>
    );
  }

  return <QuizPlayerCore quiz={data} />;
}
