import { useColorScheme } from "@mui/material";
import { ChangeEvent } from "react";
import { ThemeSwitch } from "../theme";

export function Header() {
  const { mode, setMode, systemMode } = useColorScheme();

  const isDark =
    mode === "dark" || (mode === "system" && systemMode === "dark");

  const handleToggle = (event: ChangeEvent<HTMLInputElement, Element>) => {
    setMode(event.target.checked ? "dark" : "light");
  };

  return (
    <header className="h-12 w-full border-b px-4 py-1.5">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-nowrap sm:text-xl">
            Quiz Generator
          </h1>
        </div>

        {mode && <ThemeSwitch checked={isDark} onChange={handleToggle} />}
      </div>
    </header>
  );
}
