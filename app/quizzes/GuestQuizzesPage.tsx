"use client";

import { QuizActionBar } from "@/app/components/QuizActionBar";
import { QuizSettingsDialog } from "@/app/components/QuizSettingsDialog";
import {
  getGuestQuizzesServerSnapshot,
  getGuestQuizzes,
  removeGuestQuiz,
  subscribeGuestQuizzes,
  updateGuestQuiz,
} from "@/lib/guest-quizzes";
import { formatQuizDate } from "@/lib/quiz-utils";
import {
  pickEditableQuizSettings,
  type EditableQuizSettings,
} from "@/lib/quiz-types";
import { GUEST_LIFETIME_LIMIT } from "@/lib/usage-limits";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

export function GuestQuizzesPage() {
  const quizzes = useSyncExternalStore(
    subscribeGuestQuizzes,
    getGuestQuizzes,
    getGuestQuizzesServerSnapshot,
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    localId: string;
    title: string;
  } | null>(null);
  const [settingsTarget, setSettingsTarget] = useState<{
    localId: string;
    title: string;
    settings: EditableQuizSettings;
  } | null>(null);

  const handleSaveSettings = (value: {
    title: string;
    settings: EditableQuizSettings;
  }) => {
    if (!settingsTarget) return;

    updateGuestQuiz(settingsTarget.localId, value);
    setSettingsTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    removeGuestQuiz(deleteTarget.localId);
    setDeleteTarget(null);
  };

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
              Quizzes saved in this browser. Sign in to keep them permanently
              and sync across devices.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button component={Link} href="/login" variant="outlined">
              Sign in to save
            </Button>
            <Button component={Link} href="/" variant="contained">
              Create new quiz
            </Button>
          </Stack>
        </Stack>

        <Alert severity="info">
          Up to {GUEST_LIFETIME_LIMIT} quizzes are stored locally in this
          browser. Older quizzes are removed when you create new ones.
        </Alert>

        {!quizzes.length ? (
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
              <Paper key={quiz.localId} variant="outlined" sx={{ p: 2.5 }}>
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
                      <Chip
                        label="This browser only"
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {quiz.questions.length} questions
                      {quiz.sourceFileName ? ` · ${quiz.sourceFileName}` : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Created {formatQuizDate(quiz.createdAt)}
                    </Typography>
                  </Box>

                  <QuizActionBar
                    playHref={`/quiz/local/${quiz.localId}`}
                    deleteLabel="Remove from this browser"
                    onSettings={() =>
                      setSettingsTarget({
                        localId: quiz.localId,
                        title: quiz.title,
                        settings: pickEditableQuizSettings(quiz.settings),
                      })
                    }
                    onDelete={() =>
                      setDeleteTarget({
                        localId: quiz.localId,
                        title: quiz.title,
                      })
                    }
                  />
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>

      <QuizSettingsDialog
        key={settingsTarget?.localId ?? "settings-closed"}
        open={settingsTarget !== null}
        initialTitle={settingsTarget?.title ?? ""}
        initialSettings={settingsTarget?.settings ?? null}
        onClose={() => setSettingsTarget(null)}
        onSave={handleSaveSettings}
      />

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
      >
        <DialogTitle>Remove quiz?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            &ldquo;{deleteTarget?.title}&rdquo; will be removed from this
            browser. Sign in first if you want to keep it permanently.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
