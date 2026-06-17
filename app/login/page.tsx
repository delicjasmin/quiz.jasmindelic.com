import { auth } from "@/lib/auth";
import { NOINDEX_ROBOTS } from "@/lib/seo";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Login } from "./page-client-component";

export const metadata: Metadata = {
  title: "Sign in",
  robots: NOINDEX_ROBOTS,
};

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/");
  }

  return <Login />;
}
