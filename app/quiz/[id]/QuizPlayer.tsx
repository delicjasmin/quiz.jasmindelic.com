"use client";

import { QuizActionBar } from "@/app/components/QuizActionBar";
import { QuizSettingsDialog } from "@/app/components/QuizSettingsDialog";
import {
  pickEditableQuizSettings,
  type EditableQuizSettings,
} from "@/lib/quiz-types";
import { trpc } from "@/lib/trpc";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { QuizPlayerCore } from "../QuizPlayerCore";

export function QuizPlayer({ quizId }: { quizId: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.quiz.getForPlay.useQuery({
    id: quizId,
  });
  const updateSettings = trpc.quiz.updateSettings.useMutation();
  const setShared = trpc.quiz.setShared.useMutation();
  const deleteQuiz = trpc.quiz.delete.useMutation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const refreshQuiz = async () => {
    await Promise.all([
      utils.quiz.getForPlay.invalidate({ id: quizId }),
      utils.quiz.listMine.invalidate(),
    ]);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/quiz/${quizId}`,
      );
      setSnackbar("Link copied to clipboard");
    } catch {
      setSnackbar("Could not copy link");
    }
  };

  const handleSaveSettings = async (value: {
    title: string;
    settings: EditableQuizSettings;
  }) => {
    try {
      await updateSettings.mutateAsync({ id: quizId, ...value });
      setSettingsOpen(false);
      setSnackbar("Quiz settings updated");
      await refreshQuiz();
    } catch (err) {
      setSnackbar(
        err instanceof Error ? err.message : "Failed to update settings",
      );
    }
  };

  const handleShareToggle = async () => {
    if (!data) return;

    try {
      await setShared.mutateAsync({ id: quizId, isShared: !data.isShared });
      setSnackbar(data.isShared ? "Quiz is now private" : "Quiz is now shared");
      await refreshQuiz();
    } catch (err) {
      setSnackbar(
        err instanceof Error ? err.message : "Failed to update sharing",
      );
    }
  };

  const handleDelete = async () => {
    try {
      await deleteQuiz.mutateAsync({ id: quizId });
      await utils.quiz.listMine.invalidate();
      router.push("/quizzes");
    } catch (err) {
      setSnackbar(err instanceof Error ? err.message : "Failed to delete quiz");
    }
  };

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

  const ownerActions = data.isOwner ? (
    <QuizActionBar
      deleteLabel="Delete quiz"
      onSettings={() => setSettingsOpen(true)}
      onDelete={() => setDeleteOpen(true)}
      share={{
        isShared: data.isShared,
        pending: setShared.isPending,
        onToggle: () => void handleShareToggle(),
        onCopyLink: () => void handleCopyLink(),
      }}
    />
  ) : null;

  return (
    <>
      <QuizPlayerCore quiz={data} ownerActions={ownerActions} />

      <QuizSettingsDialog
        key={settingsOpen ? data.title : "settings-closed"}
        open={settingsOpen}
        initialTitle={data.title}
        initialSettings={
          settingsOpen ? pickEditableQuizSettings(data.settings) : null
        }
        pending={updateSettings.isPending}
        onClose={() => setSettingsOpen(false)}
        onSave={(value) => void handleSaveSettings(value)}
      />

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete quiz?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            &ldquo;{data.title}&rdquo; and all its questions will be permanently
            deleted. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
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
    </>
  );
}
