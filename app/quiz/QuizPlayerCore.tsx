"use client";

import { shuffleArray } from "@/lib/quiz-utils";
import {
  formatQuizPageRange,
  type PersistedQuizSettings,
} from "@/lib/quiz-types";
import { CheckCircleOutlined, HighlightOff } from "@mui/icons-material";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export type PlayQuestion = {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
  correctAnswer: string | boolean;
  explanation: string | null;
  order: number;
};

export type PlayQuiz = {
  id: string;
  title: string;
  sourceFileName: string | null;
  settings: PersistedQuizSettings;
  isOwner: boolean;
  isShared: boolean;
  questions: PlayQuestion[];
};

type QuestionFeedback = {
  isCorrect: boolean;
  selectedAnswer: string | boolean;
};

type PlayPhase = "lobby" | "playing" | "finished";

function isAnswerCorrect(
  question: PlayQuestion,
  answer: string | boolean,
): boolean {
  if (question.type === "true-false") {
    const normalized =
      typeof answer === "boolean"
        ? answer
        : answer.toString().toLowerCase() === "true";
    return normalized === question.correctAnswer;
  }

  return answer === question.correctAnswer;
}

function formatAnswer(answer: string | boolean): string {
  if (typeof answer === "boolean") {
    return answer ? "True" : "False";
  }

  return answer;
}

function prepareQuestions(
  questions: PlayQuestion[],
  settings: PersistedQuizSettings,
): PlayQuestion[] {
  const ordered = settings.shuffleQuestions
    ? shuffleArray(questions)
    : [...questions].sort((a, b) => a.order - b.order);

  return ordered.map((question) => {
    if (
      question.type !== "multiple-choice" ||
      !settings.shuffleAnswers ||
      !question.options
    ) {
      return question;
    }

    return {
      ...question,
      options: shuffleArray(question.options),
    };
  });
}

type QuizPlayerCoreProps = {
  quiz: PlayQuiz;
  guestMode?: boolean;
};

export function QuizPlayerCore({ quiz, guestMode = false }: QuizPlayerCoreProps) {
  const settings = quiz.settings;

  const [phase, setPhase] = useState<PlayPhase>("lobby");
  const [questions, setQuestions] = useState<PlayQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, QuestionFeedback>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  const score = useMemo(() => {
    if (!questions.length) return 0;

    return questions.reduce((count, question) => {
      const answer = answers[question.id];
      if (answer === undefined) return count;
      return count + (isAnswerCorrect(question, answer) ? 1 : 0);
    }, 0);
  }, [answers, questions]);

  const finishQuiz = useCallback(() => {
    setPhase("finished");
    setSecondsLeft(null);
  }, []);

  const startQuiz = useCallback(() => {
    setQuestions(prepareQuestions(quiz.questions, quiz.settings));
    setCurrentIndex(0);
    setAnswers({});
    setFeedback({});
    setPhase("playing");

    if (quiz.settings.timerEnabled) {
      setSecondsLeft(quiz.settings.timerMinutes * 60);
    } else {
      setSecondsLeft(null);
    }
  }, [quiz]);

  useEffect(() => {
    if (phase !== "playing" || secondsLeft === null || secondsLeft <= 0) return;

    const timer = window.setTimeout(() => {
      if (secondsLeft <= 1) {
        finishQuiz();
      } else {
        setSecondsLeft(secondsLeft - 1);
      }
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [phase, secondsLeft, finishQuiz]);

  const handleSelectAnswer = (answer: string | boolean) => {
    if (!currentQuestion || phase !== "playing") return;
    if (answers[currentQuestion.id] !== undefined) return;

    const isCorrect = isAnswerCorrect(currentQuestion, answer);

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));

    if (settings.answerReveal === "immediate") {
      setFeedback((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          isCorrect,
          selectedAnswer: answer,
        },
      }));
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    finishQuiz();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (phase === "lobby") {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          {guestMode && (
            <Alert severity="info">
              This quiz is saved only in this browser.{" "}
              <Link href="/login">Sign in with Google</Link> to save it to your
              account permanently.
            </Alert>
          )}

          <Box>
            <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
              {quiz.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {quiz.sourceFileName ?? "Uploaded PDF"} · pages{" "}
              {formatQuizPageRange(settings)} · {quiz.questions.length}{" "}
              questions
            </Typography>
          </Box>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Quiz settings
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                <Chip label={`Difficulty: ${settings.difficulty}`} size="small" />
                <Chip label={`Type: ${settings.questionType}`} size="small" />
                <Chip
                  label={`Answers: ${settings.answerReveal}`}
                  size="small"
                />
                {settings.timerEnabled && (
                  <Chip
                    label={`Timer: ${settings.timerMinutes} min`}
                    size="small"
                  />
                )}
                {settings.shuffleQuestions && (
                  <Chip label="Shuffled questions" size="small" />
                )}
                {settings.shuffleAnswers && (
                  <Chip label="Shuffled answers" size="small" />
                )}
              </Stack>
            </Stack>
          </Paper>

          <Stack direction="row" spacing={2}>
            <Button variant="contained" size="large" onClick={startQuiz}>
              Start Quiz
            </Button>
            {quiz.isOwner && (
              <Button component={Link} href="/quizzes" variant="outlined">
                My Quizzes
              </Button>
            )}
            {guestMode && (
              <Button component={Link} href="/login" variant="outlined">
                Sign in to save
              </Button>
            )}
          </Stack>
        </Stack>
      </Container>
    );
  }

  if (phase === "finished") {
    const showReview = settings.answerReveal !== "never";
    const showExplanations = settings.answerReveal === "end";

    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Quiz complete
            </Typography>
            <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700 }}>
              {score} / {totalQuestions}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {Math.round((score / totalQuestions) * 100)}% correct
            </Typography>
            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: "center", mt: 3, flexWrap: "wrap" }}
            >
              <Button variant="contained" onClick={startQuiz}>
                Try again
              </Button>
              {quiz.isOwner && (
                <Button component={Link} href="/quizzes" variant="outlined">
                  My Quizzes
                </Button>
              )}
              {guestMode && (
                <Button component={Link} href="/login" variant="outlined">
                  Sign in to save
                </Button>
              )}
            </Stack>
          </Paper>

          {showReview && (
            <Stack spacing={2}>
              <Typography variant="h6">Review</Typography>
              {questions.map((question, index) => {
                const answer = answers[question.id];
                const correct =
                  answer !== undefined && isAnswerCorrect(question, answer);

                return (
                  <Paper key={question.id} variant="outlined" sx={{ p: 2.5 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center" }}
                    >
                      {correct ? (
                        <CheckCircleOutlined color="success" fontSize="small" />
                      ) : (
                        <HighlightOff color="error" fontSize="small" />
                      )}
                      <Typography variant="subtitle2" color="text.secondary">
                        Question {index + 1}
                      </Typography>
                    </Stack>
                    <Typography sx={{ mt: 1, fontWeight: 600 }}>
                      {question.question}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Your answer:{" "}
                      {answer !== undefined
                        ? formatAnswer(answer)
                        : "No answer"}
                    </Typography>
                    {settings.answerReveal !== "never" && (
                      <Typography variant="body2" color="text.secondary">
                        Correct answer: {formatAnswer(question.correctAnswer)}
                      </Typography>
                    )}
                    {showExplanations && question.explanation && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        {question.explanation}
                      </Typography>
                    )}
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Container>
    );
  }

  const currentFeedback = currentQuestion
    ? feedback[currentQuestion.id]
    : undefined;
  const hasAnsweredCurrent = currentQuestion
    ? answers[currentQuestion.id] !== undefined
    : false;
  const showImmediateFeedback =
    settings.answerReveal === "immediate" && currentFeedback;
  const canAdvance =
    hasAnsweredCurrent &&
    (settings.answerReveal !== "immediate" || currentFeedback);

  const options =
    currentQuestion?.type === "true-false"
      ? ["True", "False"]
      : (currentQuestion?.options ?? []);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Question {currentIndex + 1} of {totalQuestions}
            </Typography>
            {secondsLeft !== null && (
              <Chip
                label={formatTime(secondsLeft)}
                color={secondsLeft <= 60 ? "warning" : "default"}
                size="small"
              />
            )}
          </Stack>
          <LinearProgress
            variant="determinate"
            value={((currentIndex + 1) / totalQuestions) * 100}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            {answeredCount} answered
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            {currentQuestion?.question}
          </Typography>

          <Stack spacing={1.5}>
            {options.map((option) => {
              const optionValue =
                currentQuestion?.type === "true-false"
                  ? option.toLowerCase() === "true"
                  : option;
              const isSelected =
                currentQuestion &&
                answers[currentQuestion.id] !== undefined &&
                (currentQuestion.type === "true-false"
                  ? answers[currentQuestion.id] === optionValue
                  : answers[currentQuestion.id] === option);

              return (
                <Button
                  key={option}
                  variant={isSelected ? "contained" : "outlined"}
                  onClick={() => handleSelectAnswer(optionValue)}
                  disabled={hasAnsweredCurrent}
                  sx={{
                    justifyContent: "flex-start",
                    textAlign: "left",
                    py: 1.5,
                  }}
                >
                  {option}
                </Button>
              );
            })}
          </Stack>

          {showImmediateFeedback && currentQuestion && (
            <Box sx={{ mt: 3 }}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", mb: 1 }}
              >
                {currentFeedback.isCorrect ? (
                  <CheckCircleOutlined color="success" />
                ) : (
                  <HighlightOff color="error" />
                )}
                <Typography sx={{ fontWeight: 600 }}>
                  {currentFeedback.isCorrect ? "Correct!" : "Incorrect"}
                </Typography>
              </Stack>
              {!currentFeedback.isCorrect && (
                <Typography variant="body2" color="text.secondary">
                  Correct answer: {formatAnswer(currentQuestion.correctAnswer)}
                </Typography>
              )}
              {currentQuestion.explanation && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {currentQuestion.explanation}
                </Typography>
              )}
            </Box>
          )}
        </Paper>

        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Button
            variant="outlined"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => prev - 1)}
          >
            Previous
          </Button>
          <Button
            variant="contained"
            disabled={!canAdvance}
            onClick={handleNext}
          >
            {currentIndex === totalQuestions - 1 ? "Finish" : "Next"}
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
