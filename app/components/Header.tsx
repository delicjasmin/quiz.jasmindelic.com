"use client";

import { signOut, useSession } from "@/lib/auth-client";
import { AccountCircle, Menu as MenuIcon } from "@mui/icons-material";
import { ListItemIcon, useColorScheme } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import { ThemeSwitch } from "../theme";

function HeaderActions({
  session,
  isPending,
  onSignOut,
  onNavigate,
}: {
  session: ReturnType<typeof useSession>["data"];
  isPending: boolean;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  if (isPending) {
    return (
      <Button
        size="small"
        variant="outlined"
        disabled
        tabIndex={-1}
        aria-hidden
        sx={{ visibility: "hidden" }}
      >
        Sign in
      </Button>
    );
  }

  if (session) {
    return (
      <>
        <Button
          component={Link}
          href="/quizzes"
          size="small"
          variant="text"
          onClick={onNavigate}
        >
          My Quizzes
        </Button>
        <span className="hidden py-1.5 text-sm text-zinc-400 md:inline">
          <AccountCircle fontSize="small" />
          <span className="ml-1">{session.user.name}</span>
        </span>
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            onNavigate?.();
            void onSignOut();
          }}
        >
          Log out
        </Button>
      </>
    );
  }

  return (
    <>
      <Button
        component={Link}
        href="/quizzes"
        size="small"
        variant="text"
        onClick={onNavigate}
      >
        My Quizzes
      </Button>
      <Button
        component={Link}
        href="/login"
        size="small"
        variant="outlined"
        onClick={onNavigate}
      >
        Sign in
      </Button>
    </>
  );
}

export function Header() {
  const router = useRouter();
  const { mode, setMode, systemMode } = useColorScheme();
  const { data: session, isPending } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDark =
    mode === "dark" ||
    (mode === "system" && systemMode === "dark") ||
    mode == null;

  const handleToggle = (event: ChangeEvent<HTMLInputElement, Element>) => {
    setMode(event.target.checked ? "dark" : "light");
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
    router.refresh();
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="flex h-12 w-full items-center border-b px-4">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Quiz Generator" width={32} height={32} />

          <h1 className="text-lg font-semibold text-nowrap sm:text-xl">
            AI Quiz Generator
          </h1>
        </Link>

        <Box
          sx={{
            display: { xs: "none", sm: "flex" },
            height: 34,
            flexShrink: 0,
            alignItems: "center",
            gap: { sm: 1.5 },
          }}
        >
          <ThemeSwitch checked={isDark} onChange={handleToggle} />
          <HeaderActions
            session={session}
            isPending={isPending}
            onSignOut={handleSignOut}
          />
        </Box>

        <IconButton
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          sx={{ display: { xs: "inline-flex", sm: "none" } }}
        >
          <MenuIcon />
        </IconButton>
      </div>

      <Drawer
        anchor="right"
        open={menuOpen}
        onClose={closeMenu}
        sx={{ "& .MuiDrawer-paper": { width: 280 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Menu
          </Typography>
        </Box>
        <Divider />
        <List disablePadding>
          {!isPending && session && (
            <ListItem sx={{ py: 1.5, gap: 1 }}>
              <ListItemIcon>
                <AccountCircle fontSize="large" />
              </ListItemIcon>
              <ListItemText
                primary={session.user.name}
                secondary={session.user.email}
                slotProps={{
                  secondary: {
                    sx: { overflow: "hidden", textOverflow: "ellipsis" },
                  },
                }}
              />
            </ListItem>
          )}
          {!isPending && (
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                href="/quizzes"
                onClick={closeMenu}
              >
                <ListItemText primary="My Quizzes" />
              </ListItemButton>
            </ListItem>
          )}
          <ListItem sx={{ py: 1.5 }}>
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <ListItemText primary="Dark mode" />
              <ThemeSwitch checked={isDark} onChange={handleToggle} />
            </Stack>
          </ListItem>
        </List>
        <Divider />
        <Box sx={{ p: 2 }}>
          {!isPending && session ? (
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                closeMenu();
                void handleSignOut();
              }}
            >
              Log out
            </Button>
          ) : (
            <Button
              component={Link}
              href="/login"
              fullWidth
              variant="outlined"
              onClick={closeMenu}
            >
              Sign in
            </Button>
          )}
        </Box>
      </Drawer>
    </header>
  );
}
