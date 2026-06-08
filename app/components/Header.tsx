"use client";

import { signOut, useSession } from "@/lib/auth-client";
import { useColorScheme } from "@mui/material";
import Button from "@mui/material/Button";
import Image from "next/image";
import Link from "next/link";
import { ChangeEvent } from "react";
import { ThemeSwitch } from "../theme";

export function Header() {
  const { mode, setMode, systemMode } = useColorScheme();
  const { data: session, isPending } = useSession();

  const isDark =
    mode === "dark" ||
    (mode === "system" && systemMode === "dark") ||
    mode == null;

  const handleToggle = (event: ChangeEvent<HTMLInputElement, Element>) => {
    setMode(event.target.checked ? "dark" : "light");
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="flex h-12 w-full items-center border-b px-4">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Quiz Generator" width={32} height={32} />

          <h1 className="text-lg font-semibold text-nowrap sm:text-xl">
            Quiz Generator
          </h1>
        </Link>

        <div className="flex h-[34px] shrink-0 items-center gap-2 sm:gap-3">
          <ThemeSwitch checked={isDark} onChange={handleToggle} />

          {isPending ? (
            <Button
              size="small"
              variant="outlined"
              disabled
              tabIndex={-1}
              aria-hidden
              sx={{ visibility: "hidden" }}
            >
              Log in
            </Button>
          ) : session ? (
            <>
              <span className="hidden text-sm text-zinc-400 sm:inline">
                {session.user.name}
              </span>
              <Button size="small" variant="outlined" onClick={handleSignOut}>
                Log out
              </Button>
            </>
          ) : (
            <Button
              component={Link}
              href="/login"
              size="small"
              variant="outlined"
            >
              Log in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
