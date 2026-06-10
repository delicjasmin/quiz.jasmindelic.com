"use client";

import { signIn } from "@/lib/auth-client";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useState } from "react";

export function Login() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await signIn.social({
        provider: "google",
        callbackURL: "/",
      });

      if (res.error) {
        setError(res.error.message ?? "Could not sign in with Google.");
      }
    } catch {
      setError("Could not sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" className="py-8 sm:py-12">
      <Paper elevation={0} className="border p-6 sm:p-8">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
              Sign in
            </Typography>
            <Typography variant="body2" color="text.secondary" className="mt-1">
              Sign in to save quizzes permanently and sync across devices.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Button
            variant="contained"
            size="large"
            disabled={loading}
            fullWidth
            onClick={() => void handleGoogleSignIn()}
          >
            {loading ? "Redirecting…" : "Continue with Google"}
          </Button>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center" }}
          >
            <Link component={NextLink} href="/" underline="hover">
              Back to home
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
