"use client";

import { QuizActionBar } from "@/app/components/QuizActionBar";
import { QuizSettingsDialog } from "@/app/components/QuizSettingsDialog";
import { formatQuizDate } from "@/lib/quiz-utils";
import {
  type EditableQuizSettings,
  pickEditableQuizSettings,
} from "@/lib/quiz-types";
import { trpc } from "@/lib/trpc";
import { ShareOutlined } from "@mui/icons-material";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useState } from "react";

export function QuizzesPage() {
  const utils = trpc.useUtils();
  const { data: quizzes, isLoading, error } = trpc.quiz.listMine.useQuery();

  const deleteQuiz = trpc.quiz.delete.useMutation({
    onSuccess: () => utils.quiz.listMine.invalidate(),
  });
  const setShared = trpc.quiz.setShared.useMutation({
    onSuccess: () => utils.quiz.listMine.invalidate(),
  });
  const updateSettings = trpc.quiz.updateSettings.useMutation({
    onSuccess: () => utils.quiz.listMine.invalidate(),
  });

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [settingsTarget, setSettingsTarget] = useState<{
    id: string;
    title: string;
    settings: EditableQuizSettings;
  } | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const handleCopyLink = async (quizId: string) => {
    const url = `${window.location.origin}/quiz/${quizId}`;

    try {
      await navigator.clipboard.writeText(url);
      setSnackbar("Link copied to clipboard");
    } catch {
      setSnackbar("Could not copy link");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteQuiz.mutateAsync({ id: deleteTarget.id });
      setDeleteTarget(null);
      setSnackbar("Quiz deleted");
    } catch (err) {
      setSnackbar(err instanceof Error ? err.message : "Failed to delete quiz");
    }
  };

  const handleSaveSettings = async (value: {
    title: string;
    settings: EditableQuizSettings;
  }) => {
    if (!settingsTarget) return;

    try {
      await updateSettings.mutateAsync({
        id: settingsTarget.id,
        title: value.title,
        settings: value.settings,
      });
      setSettingsTarget(null);
      setSnackbar("Quiz settings updated");
    } catch (err) {
      setSnackbar(
        err instanceof Error ? err.message : "Failed to update settings",
      );
    }
  };

  const handleShareToggle = async (quizId: string, isShared: boolean) => {
    try {
      await setShared.mutateAsync({ id: quizId, isShared });
      setSnackbar(isShared ? "Quiz is now shared" : "Quiz is now private");
    } catch (err) {
      setSnackbar(
        err instanceof Error ? err.message : "Failed to update sharing",
      );
    }
  };

  if (isLoading) {
    return (
      <Box className="flex min-h-[70vh] items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error.message}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>
              My Quizzes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage, share, and play your generated quizzes.
            </Typography>
          </Box>
          <Button component={Link} href="/" variant="contained">
            Create new quiz
          </Button>
        </Stack>

        {!quizzes?.length ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              No quizzes yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload a PDF on the home page to generate your first quiz.
            </Typography>
            <Button component={Link} href="/" variant="contained">
              Create a quiz
            </Button>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {quizzes.map((quiz) => (
              <Paper key={quiz.id} variant="outlined" sx={{ p: 2.5 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{
                    justifyContent: "space-between",
                    alignItems: { sm: "center" },
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center", mb: 0.5 }}
                    >
                      <Typography variant="h6" component="h2">
                        {quiz.title}
                      </Typography>
                      {quiz.isShared && (
                        <Chip
                          icon={<ShareOutlined />}
                          label="Shared"
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {quiz.questionCount} questions
                      {quiz.sourceFileName ? ` · ${quiz.sourceFileName}` : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Created {formatQuizDate(quiz.createdAt)}
                    </Typography>
                  </Box>

                  <QuizActionBar
                    playHref={`/quiz/${quiz.id}`}
                    deleteLabel="Delete quiz"
                    onSettings={() =>
                      setSettingsTarget({
                        id: quiz.id,
                        title: quiz.title,
                        settings: pickEditableQuizSettings(quiz.settings),
                      })
                    }
                    onDelete={() =>
                      setDeleteTarget({ id: quiz.id, title: quiz.title })
                    }
                    share={{
                      isShared: quiz.isShared,
                      pending: setShared.isPending,
                      onToggle: () =>
                        void handleShareToggle(quiz.id, !quiz.isShared),
                      onCopyLink: () => void handleCopyLink(quiz.id),
                    }}
                  />
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>

      <QuizSettingsDialog
        key={settingsTarget?.id ?? "settings-closed"}
        open={settingsTarget !== null}
        initialTitle={settingsTarget?.title ?? ""}
        initialSettings={settingsTarget?.settings ?? null}
        pending={updateSettings.isPending}
        onClose={() => setSettingsTarget(null)}
        onSave={(value) => void handleSaveSettings(value)}
      />

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
      >
        <DialogTitle>Delete quiz?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            &ldquo;{deleteTarget?.title}&rdquo; and all its questions will be
            permanently deleted. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void handleDelete()}
            disabled={deleteQuiz.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbar !== null}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
      />
    </Container>
  );
}
