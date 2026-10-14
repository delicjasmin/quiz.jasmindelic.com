"use client";

import {
  MAX_QUIZ_TITLE_LENGTH,
  type EditableQuizSettings,
} from "@/lib/quiz-types";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import { QuizSettingsEditor } from "./QuizSettingsEditor";

type QuizSettingsDialogProps = {
  open: boolean;
  initialTitle: string;
  initialSettings: EditableQuizSettings | null;
  pending?: boolean;
  onClose: () => void;
  onSave: (value: { title: string; settings: EditableQuizSettings }) => void;
};

export function QuizSettingsDialog({
  open,
  initialTitle,
  initialSettings,
  pending = false,
  onClose,
  onSave,
}: QuizSettingsDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={pending ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      {initialSettings ? (
        <SettingsForm
          initialTitle={initialTitle}
          initialSettings={initialSettings}
          pending={pending}
          onClose={onClose}
          onSave={onSave}
        />
      ) : null}
    </Dialog>
  );
}

function SettingsForm({
  initialTitle,
  initialSettings,
  pending,
  onClose,
  onSave,
}: {
  initialTitle: string;
  initialSettings: EditableQuizSettings;
  pending: boolean;
  onClose: () => void;
  onSave: QuizSettingsDialogProps["onSave"];
}) {
  const [title, setTitle] = useState(initialTitle);
  const [settings, setSettings] = useState(initialSettings);
  const trimmed = title.trim();

  return (
    <>
      <DialogTitle>Quiz settings</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Rename the quiz and change how it plays. Difficulty, question count,
          and pages stay as they were when the quiz was created.
        </DialogContentText>
        <TextField
          autoFocus
          fullWidth
          label="Quiz name"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          slotProps={{ htmlInput: { maxLength: MAX_QUIZ_TITLE_LENGTH } }}
          helperText={`${trimmed.length}/${MAX_QUIZ_TITLE_LENGTH}`}
          sx={{ mb: 2.5 }}
        />
        <QuizSettingsEditor settings={settings} onChange={setSettings} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => onSave({ title: trimmed, settings })}
          disabled={pending || trimmed.length === 0}
        >
          Save
        </Button>
      </DialogActions>
    </>
  );
}
