"use client";

import type { EditableQuizSettings } from "@/lib/quiz-types";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";

type QuizSettingsEditorProps = {
  settings: EditableQuizSettings;
  onChange: (settings: EditableQuizSettings) => void;
};

export function QuizSettingsEditor({
  settings,
  onChange,
}: QuizSettingsEditorProps) {
  const updateSetting = <K extends keyof EditableQuizSettings>(
    key: K,
    value: EditableQuizSettings[K],
  ) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.timerEnabled}
                onChange={(e) =>
                  updateSetting("timerEnabled", e.target.checked)
                }
              />
            }
            label="Enable timer"
          />
          {settings.timerEnabled && (
            <TextField
              fullWidth
              type="number"
              label="Time limit (minutes)"
              size="small"
              slotProps={{ htmlInput: { min: 1, max: 120 } }}
              value={settings.timerMinutes}
              onChange={(e) =>
                updateSetting(
                  "timerMinutes",
                  Math.max(1, Math.min(120, Number(e.target.value) || 1)),
                )
              }
            />
          )}
        </Stack>
      </Paper>

      <FormControl fullWidth size="small">
        <InputLabel id="answer-reveal-label">Show correct answers</InputLabel>
        <Select
          labelId="answer-reveal-label"
          label="Show correct answers"
          value={settings.answerReveal}
          onChange={(e) =>
            updateSetting(
              "answerReveal",
              e.target.value as EditableQuizSettings["answerReveal"],
            )
          }
        >
          <MenuItem value="immediate">After each question</MenuItem>
          <MenuItem value="end">At the end of the quiz</MenuItem>
          <MenuItem value="never">Never (score only)</MenuItem>
        </Select>
      </FormControl>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={0.5}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.shuffleQuestions}
                onChange={(e) =>
                  updateSetting("shuffleQuestions", e.target.checked)
                }
              />
            }
            label="Shuffle question order"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.shuffleAnswers}
                onChange={(e) =>
                  updateSetting("shuffleAnswers", e.target.checked)
                }
              />
            }
            label="Shuffle answer options"
          />
        </Stack>
      </Paper>
    </Stack>
  );
}
