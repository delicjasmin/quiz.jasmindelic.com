"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { SubmitEvent, useState } from "react";
import { signIn, signUp } from "@/lib/auth-client";

type AuthMode = "login" | "register";

export function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (mode === "register") {
        const name = formData.get("name") as string;
        const res = await signUp.email({ name, email, password });

        if (res.error) {
          setError(res.error.message ?? "Could not create account.");
          return;
        }
      } else {
        const res = await signIn.email({ email, password });

        if (res.error) {
          setError(res.error.message ?? "Invalid email or password.");
          return;
        }
      }

      router.push("/");
      router.refresh();
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
              {mode === "login" ? "Welcome back" : "Create an account"}
            </Typography>
            <Typography variant="body2" color="text.secondary" className="mt-1">
              {mode === "login"
                ? "Sign in to save and manage your quizzes."
                : "Register to generate and share quizzes from your PDFs."}
            </Typography>
          </Box>

          <Tabs
            value={mode}
            onChange={(_, value: AuthMode) => {
              setMode(value);
              setError(null);
            }}
            variant="fullWidth"
          >
            <Tab label="Log in" value="login" />
            <Tab label="Register" value="register" />
          </Tabs>

          {error && <Alert severity="error">{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {mode === "register" && (
                <TextField
                  name="name"
                  label="Full name"
                  required
                  fullWidth
                  autoComplete="name"
                />
              )}

              <TextField
                name="email"
                label="Email"
                type="email"
                required
                fullWidth
                autoComplete="email"
              />

              <TextField
                name="password"
                label="Password"
                type="password"
                required
                fullWidth
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                slotProps={{ htmlInput: { minLength: 8 } }}
                helperText="At least 8 characters"
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                fullWidth
              >
                {loading
                  ? "Please wait…"
                  : mode === "login"
                    ? "Log in"
                    : "Create account"}
              </Button>
            </Stack>
          </Box>

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
