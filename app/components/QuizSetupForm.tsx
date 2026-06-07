"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useRef, useState } from "react";
import { Description, FileUpload, InfoRounded } from "@mui/icons-material";

type Difficulty = "easy" | "medium" | "hard";
type QuestionType = "multiple-choice" | "true-false" | "mixed";
type AnswerReveal = "immediate" | "end" | "never";

export type QuizSettings = {
  pdfFile: File | null;
  questionCount: number;
  timerEnabled: boolean;
  timerMinutes: number;
  difficulty: Difficulty;
  questionType: QuestionType;
  answerReveal: AnswerReveal;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
};

const defaultSettings: Omit<QuizSettings, "pdfFile"> = {
  questionCount: 10,
  timerEnabled: false,
  timerMinutes: 15,
  difficulty: "medium",
  questionType: "mixed",
  answerReveal: "end",
  shuffleQuestions: true,
  shuffleAnswers: true,
};

export default function QuizSetupForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);

  const updateSetting = <K extends keyof typeof defaultSettings>(
    key: K,
    value: (typeof defaultSettings)[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const MAX_SIZE_MB = 10;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  const handleFile = (file: File | null) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      setPdfFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError(`The file size exceeds the ${MAX_SIZE_MB}MB limit.`);
      setPdfFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setError(null);
    setPdfFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  };

  const handleStartQuiz = () => {
    const quizConfig: QuizSettings = { pdfFile, ...settings };
    console.log("Quiz config:", quizConfig);
    // TODO: navigate to quiz session with config
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box className="min-h-[90vh]">
      <Container maxWidth="lg" className="py-4 sm:py-5">
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper
              elevation={0}
              sx={{ p: 3, height: "100%", border: 1, borderColor: "divider" }}
            >
              <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                Source Material
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2.5 }}
              >
                Upload a PDF to generate questions from its content.
              </Typography>

              <Box
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    fileInputRef.current?.click();
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-3 py-6 transition-colors"
                sx={{
                  borderColor: dragActive
                    ? "primary.main"
                    : pdfFile
                      ? "success.main"
                      : "divider",
                  bgcolor: dragActive
                    ? "action.hover"
                    : pdfFile
                      ? "success.50"
                      : "background.default",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  hidden
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />

                {pdfFile ? (
                  <>
                    <Box
                      className="mb-2 flex h-14 w-14 items-center justify-center rounded-full"
                      sx={{
                        bgcolor: "action.hover",
                        color: "text.secondary",
                      }}
                    >
                      <Description fontSize="large" />
                    </Box>
                    <Typography sx={{ fontWeight: 600, textAlign: "center" }}>
                      {pdfFile.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {formatFileSize(pdfFile.size)}
                    </Typography>
                    <Button
                      size="small"
                      color="inherit"
                      sx={{ mt: 2 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPdfFile(null);
                        setError(null);

                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                    >
                      Remove file
                    </Button>
                  </>
                ) : (
                  <>
                    <Box
                      className="mb-2 flex h-14 w-14 items-center justify-center rounded-full"
                      sx={{
                        bgcolor: "action.hover",
                        color: "text.secondary",
                      }}
                    >
                      <FileUpload fontSize="large" />
                    </Box>
                    <Typography sx={{ fontWeight: 600, textAlign: "center" }}>
                      Drop your PDF here or click to browse
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      PDF files only. 10MB size limit
                    </Typography>
                  </>
                )}

                {error && (
                  <Typography
                    color="error"
                    variant="body2"
                    className="mt-2 text-center"
                  >
                    {error}
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper
              elevation={0}
              sx={{ p: 3, height: "100%", border: 1, borderColor: "divider" }}
            >
              <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                Quiz Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure how your quiz is generated and played.
              </Typography>

              <Stack spacing={3}>
                <Box>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between", mb: 1 }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Number of questions
                    </Typography>
                    <Typography
                      variant="body2"
                      color="primary.main"
                      sx={{ fontWeight: 600 }}
                    >
                      {settings.questionCount}
                    </Typography>
                  </Stack>
                  <Slider
                    value={settings.questionCount}
                    min={5}
                    max={50}
                    step={1}
                    marks={[
                      { value: 5, label: "5" },
                      { value: 50, label: "50" },
                    ]}
                    onChange={(_, value) =>
                      updateSetting("questionCount", value as number)
                    }
                    valueLabelDisplay="auto"
                  />
                </Box>

                <Paper
                  variant="outlined"
                  className="flex items-center gap-2 p-4"
                >
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
                    className="h-10 whitespace-nowrap"
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
                          Math.max(1, Math.min(120, Number(e.target.value))),
                        )
                      }
                    />
                  )}
                </Paper>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                    Difficulty
                  </Typography>
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    size="small"
                    value={settings.difficulty}
                    onChange={(_, value: Difficulty | null) => {
                      if (value) updateSetting("difficulty", value);
                    }}
                  >
                    <ToggleButton value="easy">Easy</ToggleButton>
                    <ToggleButton value="medium">Medium</ToggleButton>
                    <ToggleButton value="hard">Hard</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <FormControl fullWidth size="small">
                  <InputLabel id="question-type-label">
                    Question type
                  </InputLabel>
                  <Select
                    labelId="question-type-label"
                    label="Question type"
                    value={settings.questionType}
                    onChange={(e) =>
                      updateSetting(
                        "questionType",
                        e.target.value as QuestionType,
                      )
                    }
                  >
                    <MenuItem value="multiple-choice">Multiple choice</MenuItem>
                    <MenuItem value="true-false">True / False</MenuItem>
                    <MenuItem value="mixed">Mixed</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel id="answer-reveal-label">
                    Show correct answers
                  </InputLabel>
                  <Select
                    labelId="answer-reveal-label"
                    label="Show correct answers"
                    value={settings.answerReveal}
                    onChange={(e) =>
                      updateSetting(
                        "answerReveal",
                        e.target.value as AnswerReveal,
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
            </Paper>
          </Grid>
        </Grid>

        <Stack spacing={1.5} sx={{ alignItems: "center", mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            disabled={!pdfFile}
            onClick={handleStartQuiz}
            className="flex w-full flex-col gap-0.5 lg:w-80"
          >
            Start Quiz
            {!pdfFile && (
              <Typography variant="caption" color="textDisabled">
                <InfoRounded fontSize="small" className="mr-1" />
                Upload a PDF to enable the quiz.
              </Typography>
            )}
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
