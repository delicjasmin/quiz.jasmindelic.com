"use client";

import { QuizSettingsEditor } from "@/app/components/QuizSettingsEditor";
import { formatQuizDate } from "@/lib/quiz-utils";
import {
  type EditableQuizSettings,
  pickEditableQuizSettings,
} from "@/lib/quiz-types";
import { trpc } from "@/lib/trpc";
import {
  DeleteOutlined,
  Link as LinkIcon,
  PlayArrow,
  SettingsOutlined,
  ShareOutlined,
} from "@mui/icons-material";
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
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
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

  const handleSaveSettings = async () => {
    if (!settingsTarget) return;

    try {
      await updateSettings.mutateAsync({
        id: settingsTarget.id,
        settings: settingsTarget.settings,
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
                  sx={{ justifyContent: "space-between" }}
                >
                  <Box sx={{ flex: 1 }}>
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

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center", flexShrink: 0 }}
                  >
                    <Tooltip title="Play quiz">
                      <Button
                        component={Link}
                        href={`/quiz/${quiz.id}`}
                        variant="contained"
                        size="small"
                        startIcon={<PlayArrow />}
                      >
                        Play
                      </Button>
                    </Tooltip>

                    <Tooltip title="Edit settings">
                      <IconButton
                        size="small"
                        onClick={() =>
                          setSettingsTarget({
                            id: quiz.id,
                            title: quiz.title,
                            settings: pickEditableQuizSettings(quiz.settings),
                          })
                        }
                      >
                        <SettingsOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Copy share link">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => void handleCopyLink(quiz.id)}
                          disabled={!quiz.isShared}
                        >
                          <LinkIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ alignItems: "center" }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Share
                      </Typography>
                      <Switch
                        size="small"
                        checked={quiz.isShared}
                        disabled={setShared.isPending}
                        onChange={(e) =>
                          void handleShareToggle(quiz.id, e.target.checked)
                        }
                      />
                    </Stack>

                    <Tooltip title="Delete quiz">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          setDeleteTarget({ id: quiz.id, title: quiz.title })
                        }
                      >
                        <DeleteOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>

      <Dialog
        open={settingsTarget !== null}
        onClose={() => setSettingsTarget(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Quiz settings</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Update play settings for &ldquo;{settingsTarget?.title}&rdquo;.
            Generation settings like difficulty and question count cannot be
            changed without creating a new quiz.
          </DialogContentText>
          {settingsTarget && (
            <QuizSettingsEditor
              settings={settingsTarget.settings}
              onChange={(settings) =>
                setSettingsTarget((prev) =>
                  prev ? { ...prev, settings } : null,
                )
              }
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => void handleSaveSettings()}
            disabled={updateSettings.isPending}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

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
        open={snackbar !== null}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
      />
    </Container>
  );
}
