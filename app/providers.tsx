"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import { Header } from "./components/Header";
import { TRPCProvider } from "./trpc-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <TRPCProvider>
          <CssBaseline />
          <Header />
          {children}
        </TRPCProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
