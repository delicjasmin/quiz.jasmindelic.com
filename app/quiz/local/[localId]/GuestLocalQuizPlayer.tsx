"use client";

import { QuizActionBar } from "@/app/components/QuizActionBar";
import { QuizSettingsDialog } from "@/app/components/QuizSettingsDialog";
import {
  getGuestQuizzes,
  getGuestQuizzesServerSnapshot,
  removeGuestQuiz,
  subscribeGuestQuizzes,
  updateGuestQuiz,
} from "@/lib/guest-quizzes";
import {
  pickEditableQuizSettings,
  type EditableQuizSettings,
} from "@/lib/quiz-types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { QuizPlayerCore, type PlayQuiz } from "../../QuizPlayerCore";

export function GuestLocalQuizPlayer({ localId }: { localId: string }) {
  const router = useRouter();
  const guestQuizzes = useSyncExternalStore(
    subscribeGuestQuizzes,
    getGuestQuizzes,
    getGuestQuizzesServerSnapshot,
  );
  const guestQuiz =
    guestQuizzes.find((quiz) => quiz.localId === localId) ?? null;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleSaveSettings = (value: {
    title: string;
    settings: EditableQuizSettings;
  }) => {
    updateGuestQuiz(localId, value);
    setSettingsOpen(false);
  };

  const handleDelete = () => {
    removeGuestQuiz(localId);
    router.push("/quizzes");
  };

  if (!guestQuiz) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Quiz not found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This quiz is only available in the browser where it was created.
            Sign in to access saved quizzes across devices.
          </Typography>
          <StackedActions />
        </Paper>
      </Container>
    );
  }

  const playQuiz: PlayQuiz = {
    id: guestQuiz.localId,
    title: guestQuiz.title,
    sourceFileName: guestQuiz.sourceFileName,
    settings: guestQuiz.settings,
    isOwner: true,
    isShared: false,
    questions: guestQuiz.questions,
  };

  return (
    <>
      <QuizPlayerCore
        quiz={playQuiz}
        guestMode
        ownerActions={
          <QuizActionBar
            deleteLabel="Remove from this browser"
            onSettings={() => setSettingsOpen(true)}
            onDelete={() => setDeleteOpen(true)}
          />
        }
      />

      <QuizSettingsDialog
        key={settingsOpen ? guestQuiz.title : "settings-closed"}
        open={settingsOpen}
        initialTitle={guestQuiz.title}
        initialSettings={
          settingsOpen ? pickEditableQuizSettings(guestQuiz.settings) : null
        }
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveSettings}
      />

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Remove quiz?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            &ldquo;{guestQuiz.title}&rdquo; will be removed from this browser.
            Sign in first if you want to keep it permanently.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function StackedActions() {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
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
