"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function AuthSessionSync() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const knownUserId = useRef<string | undefined | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isPending) return;

    const userId = session?.user?.id;

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      knownUserId.current = userId;
      return;
    }

    if (knownUserId.current !== userId) {
      knownUserId.current = userId;
      router.refresh();
    }
  }, [session?.user?.id, isPending, router]);

  return null;
}
