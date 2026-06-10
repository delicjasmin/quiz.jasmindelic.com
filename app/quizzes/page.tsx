import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { GuestQuizzesPage } from "./GuestQuizzesPage";
import { QuizzesPage } from "./QuizzesPage";

export default async function MyQuizzesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return <GuestQuizzesPage />;
  }

  return <QuizzesPage />;
}
