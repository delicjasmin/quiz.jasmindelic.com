"use client";

import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { Loading } from "./Loading";

type QuizGenerationProgressProps = {
  pageRangeLabel: string;
  questionCount: number;
};

export function QuizGenerationProgress({
  pageRangeLabel,
  questionCount,
}: QuizGenerationProgressProps) {
  const [message, setMessage] = useState("Sending your document...");
  const [progress, setProgress] = useState(5);

  useEffect(() => {
    const stages: { at: number; progress: number; message: string }[] = [
      { at: 0, progress: 10, message: "Sending your document..." },
      { at: 700, progress: 25, message: "Parsing the PDF..." },
      {
        at: 1800,
        progress: 42,
        message: `Extracting text from ${pageRangeLabel}...`,
      },
      {
        at: 3200,
        progress: 58,
        message: `Generating ${questionCount} questions with AI...`,
      },
      {
        at: 7000,
        progress: 72,
        message: "Waiting for AI response...",
      },
      {
        at: 14000,
        progress: 84,
        message: "Reviewing generated questions...",
      },
      { at: 20000, progress: 92, message: "Saving your quiz..." },
      { at: 26000, progress: 96, message: "Almost ready..." },
    ];

    const timeouts = stages.map(({ at, progress, message }) =>
      setTimeout(() => {
        setProgress(progress);
        setMessage(message);
      }, at),
    );

    const creep = setInterval(() => {
      setProgress((current) => (current >= 97 ? current : current + 0.35));
    }, 400);

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(creep);
    };
  }, [pageRangeLabel, questionCount]);

  return (
    <Box className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-4">
      <Loading size={120} />
      <Typography variant="h6">Generating your quiz...</Typography>
      <Box sx={{ width: "100%", maxWidth: 420 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            "& .MuiLinearProgress-bar": {
              transition: "transform 0.6s ease",
            },
          }}
        />
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1.5, textAlign: "center", minHeight: "1.5em" }}
        >
          {message}
        </Typography>
      </Box>
    </Box>
  );
}
