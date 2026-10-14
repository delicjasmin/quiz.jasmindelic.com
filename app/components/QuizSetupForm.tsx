"use client";

import { useSession } from "@/lib/auth-client";
import { createGuestLocalId, saveGuestQuiz } from "@/lib/guest-quizzes";
import { parsePageRangeSpec } from "@/lib/page-range";
import { extractPdfText, readPdfPageCount } from "@/lib/pdf-browser";
import {
  GUEST_MAX_PAGES,
  GUEST_MAX_QUESTIONS,
  MAX_PDF_BYTES,
  MAX_PDF_MB,
} from "@/lib/pdf-limits";
import { trpc } from "@/lib/trpc";
import { GUEST_LIFETIME_LIMIT } from "@/lib/usage-limits";
import { toUserFacingError } from "@/lib/user-facing-errors";
import {
  Description,
  ErrorOutlined,
  FileUpload,
  InfoRounded,
} from "@mui/icons-material";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { QuizGenerationProgress } from "./QuizGenerationProgress";

type Difficulty = "easy" | "medium" | "hard";
type QuestionType = "multiple-choice" | "true-false" | "mixed";
type AnswerReveal = "immediate" | "end" | "never";

type QuizFormSettings = {
  questionCount: number;
  timerEnabled: boolean;
  timerMinutes: number;
  difficulty: Difficulty;
  questionType: QuestionType;
  answerReveal: AnswerReveal;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  pageRange: string;
};

const MIN_QUESTION_COUNT = 5;
const MAX_QUESTION_COUNT = 50;
const QUESTION_COUNT_PRESETS = [5, 10, 15, 20, 30] as const;

const defaultSettings: QuizFormSettings = {
  questionCount: 10,
  timerEnabled: false,
  timerMinutes: 15,
  difficulty: "medium",
  questionType: "mixed",
  answerReveal: "immediate",
  shuffleQuestions: true,
  shuffleAnswers: true,
  pageRange: "",
};

export default function QuizSetupForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session, isPending: isSessionPending } = useSession();

  const [error, setError] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [customizePageRange, setCustomizePageRange] = useState(false);
  const [pageRangeLabel, setPageRangeLabel] = useState("all pages");

  const { data: quota } = trpc.quiz.getQuota.useQuery(undefined, {
    enabled: !isSessionPending,
  });

  const getPdfInfo = trpc.quiz.getPdfInfo.useMutation();
  const generateQuiz = trpc.quiz.generate.useMutation();
  const generateGuest = trpc.quiz.generateGuest.useMutation();

  const updateSetting = <K extends keyof QuizFormSettings>(
    key: K,
    value: QuizFormSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const isGuest = !session;
  const maxQuestionCount = isGuest ? GUEST_MAX_QUESTIONS : MAX_QUESTION_COUNT;
  const questionCountPresets = isGuest
    ? QUESTION_COUNT_PRESETS.filter((count) => count <= GUEST_MAX_QUESTIONS)
    : QUESTION_COUNT_PRESETS;

  const isGenerating = generateQuiz.isPending || generateGuest.isPending;
  const isBusy = isReadingPdf || isGenerating;

  const loadPdfMetadata = async (file: File) => {
    setIsReadingPdf(true);
    setError(null);

    try {
      const nextPageCount = await readPdfPageCount(file);
      await getPdfInfo.mutateAsync({ byteSize: file.size });

      setPdfFile(file);
      setPageCount(nextPageCount);
      setCustomizePageRange(false);
      setSettings((prev) => ({
        ...prev,
        pageRange: "",
      }));
    } catch (err) {
      setPdfFile(null);
      setPageCount(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setError(
        err instanceof Error ? err.message : "Failed to read the PDF file.",
      );
    } finally {
      setIsReadingPdf(false);
    }
  };

  const handleFile = (file: File | null) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      setPdfFile(null);
      setPageCount(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    if (file.size > MAX_PDF_BYTES) {
      setError(`The file size exceeds the ${MAX_PDF_MB}MB limit.`);
      setPdfFile(null);
      setPageCount(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    void loadPdfMetadata(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  };

  const handleStartQuiz = async () => {
    if (!pdfFile || !pageCount) {
      setError("Upload a PDF before starting the quiz.");
      return;
    }

    const pageRangeSpec = customizePageRange
      ? settings.pageRange.trim()
      : `1-${pageCount}`;

    let selectedPages: number[];
    try {
      selectedPages = parsePageRangeSpec(pageRangeSpec, pageCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid page range.");
      return;
    }

    if (isGuest && selectedPages.length > GUEST_MAX_PAGES) {
      setError(
        `Free quizzes are limited to ${GUEST_MAX_PAGES} pages. Sign in with Google to use more pages or choose a smaller page range.`,
      );
      return;
    }

    setPageRangeLabel(
      customizePageRange ? pageRangeSpec : `all ${pageCount} pages`,
    );

    setError(null);
    setGenerationError(null);
    setIsReadingPdf(true);

    let sourceText: string;
    try {
      sourceText = await extractPdfText(pdfFile, selectedPages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to read the PDF file.",
      );
      return;
    } finally {
      setIsReadingPdf(false);
    }

    const quizSettings = {
      questionCount: Math.min(settings.questionCount, maxQuestionCount),
      timerEnabled: settings.timerEnabled,
      timerMinutes: settings.timerMinutes,
      difficulty: isGuest ? ("medium" as const) : settings.difficulty,
      questionType: settings.questionType,
      answerReveal: settings.answerReveal,
      shuffleQuestions: settings.shuffleQuestions,
      shuffleAnswers: settings.shuffleAnswers,
      pageRange: pageRangeSpec,
      pageStart: selectedPages[0],
      pageEnd: selectedPages[selectedPages.length - 1],
    };

    try {
      if (session) {
        const result = await generateQuiz.mutateAsync({
          sourceText,
          pageCount,
          fileName: pdfFile.name,
          settings: quizSettings,
        });

        router.push(`/quiz/${result.quizId}`);
        return;
      }

      const localId = createGuestLocalId();
      const result = await generateGuest.mutateAsync({
        sourceText,
        pageCount,
        fileName: pdfFile.name,
        settings: quizSettings,
        localId,
      });

      saveGuestQuiz(result);
      router.push(`/quiz/local/${result.localId}`);
    } catch (err) {
      setGenerationError(
        toUserFacingError(
          err,
          "Could not generate your quiz. Please try again.",
        ),
      );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isGenerating) {
    return (
      <QuizGenerationProgress
        pageRangeLabel={pageRangeLabel}
        questionCount={settings.questionCount}
      />
    );
  }

  if (generationError) {
    return (
      <Box className="flex min-h-[80vh] flex-col items-center justify-center gap-3 px-4">
        <ErrorOutlined color="error" sx={{ fontSize: 64 }} />
        <Typography variant="h6">Couldn&apos;t generate your quiz</Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", maxWidth: 420 }}
        >
          {generationError}
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ mt: 2 }}
        >
          <Button
            variant="contained"
            onClick={() => {
              setGenerationError(null);
              void handleStartQuiz();
            }}
          >
            Try again
          </Button>
          <Button variant="outlined" onClick={() => setGenerationError(null)}>
            Back to settings
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box className="min-h-[90vh]">
      <Container maxWidth="lg" className="pt-4 pb-20">
        {!isSessionPending && !session && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Try up to {GUEST_LIFETIME_LIMIT} free quizzes (max{" "}
            {GUEST_MAX_QUESTIONS} questions, {GUEST_MAX_PAGES} pages).{" "}
            <Link href="/login">Sign in with Google</Link> to save permanently
            and unlock full settings.
            {quota?.lifetimeRemaining != null && (
              <>
                {" "}
                {quota.lifetimeRemaining} of {GUEST_LIFETIME_LIMIT} free quizzes
                remaining.
              </>
            )}
          </Alert>
        )}

        {!isSessionPending && session && quota && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {quota.monthlyRemaining ?? 0} of 30 quizzes remaining this month ·{" "}
            {quota.dailyRemaining} remaining today.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

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
                  disabled={isBusy}
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />

                {isReadingPdf ? (
                  <>
                    <CircularProgress size={36} sx={{ mb: 2 }} />
                    <Typography sx={{ fontWeight: 600, textAlign: "center" }}>
                      Reading PDF...
                    </Typography>
                  </>
                ) : pdfFile ? (
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
                      {pageCount ? ` · ${pageCount} pages` : ""}
                    </Typography>
                    <Button
                      size="small"
                      color="inherit"
                      sx={{ mt: 2 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPdfFile(null);
                        setPageCount(null);
                        setCustomizePageRange(false);
                        setSettings((prev) => ({ ...prev, pageRange: "" }));
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
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={customizePageRange}
                        disabled={!pageCount || isBusy}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          setCustomizePageRange(enabled);

                          if (enabled && pageCount && !settings.pageRange) {
                            updateSetting("pageRange", `1-${pageCount}`);
                          }
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Customize page range
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    {pageCount
                      ? customizePageRange
                        ? `Choose specific pages from 1-${pageCount}.`
                        : `Using all ${pageCount} pages as source material.`
                      : "Upload a PDF to choose which pages to use."}
                  </Typography>
                  <Collapse
                    in={customizePageRange}
                    timeout="auto"
                    unmountOnExit
                  >
                    <Box sx={{ pt: 1.5 }}>
                      <TextField
                        fullWidth
                        label="Pages"
                        size="small"
                        disabled={!pageCount || isBusy}
                        placeholder="1, 2, 5-10"
                        value={settings.pageRange}
                        onChange={(e) =>
                          updateSetting("pageRange", e.target.value)
                        }
                        helperText={
                          pageCount
                            ? `Comma-separated pages and ranges (1-${pageCount}).`
                            : undefined
                        }
                      />
                    </Box>
                  </Collapse>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, mb: 1.5 }}
                    >
                      Number of questions
                    </Typography>
                    <ToggleButtonGroup
                      exclusive
                      fullWidth
                      size="small"
                      value={
                        (QUESTION_COUNT_PRESETS as readonly number[]).includes(
                          settings.questionCount,
                        )
                          ? settings.questionCount
                          : null
                      }
                      onChange={(_, value: number | null) => {
                        if (value !== null)
                          updateSetting("questionCount", value);
                      }}
                      sx={{ mb: 1.5 }}
                    >
                      {questionCountPresets.map((count) => (
                        <ToggleButton key={count} value={count}>
                          {count}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                    <TextField
                      fullWidth
                      type="number"
                      label="Custom count"
                      size="small"
                      disabled={isBusy}
                      slotProps={{
                        htmlInput: {
                          min: MIN_QUESTION_COUNT,
                          max: maxQuestionCount,
                        },
                      }}
                      value={settings.questionCount}
                      onChange={(e) =>
                        updateSetting(
                          "questionCount",
                          Math.max(
                            MIN_QUESTION_COUNT,
                            Math.min(
                              maxQuestionCount,
                              Number(e.target.value) || MIN_QUESTION_COUNT,
                            ),
                          ),
                        )
                      }
                      helperText={`Between ${MIN_QUESTION_COUNT} and ${maxQuestionCount} questions.`}
                    />
                  </Box>
                </Paper>

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
                    disabled={isGuest || isBusy}
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

        <Stack spacing={1.5} sx={{ alignItems: "center", mt: 6 }}>
          <Button
            variant="contained"
            size="large"
            disabled={!pdfFile || isBusy}
            onClick={() => void handleStartQuiz()}
            className="flex w-full flex-col gap-0.5 lg:w-80"
          >
            Generate Quiz
            {!pdfFile && (
              <Typography variant="caption" color="textDisabled">
                <InfoRounded fontSize="small" className="mr-1" />
                Upload a PDF to enable the quiz.
              </Typography>
            )}
            {pdfFile && isGuest && (
              <Typography variant="caption" color="textDisabled">
                <InfoRounded fontSize="small" className="mr-1" />
                Saved locally until you sign in to your account.
              </Typography>
            )}
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
