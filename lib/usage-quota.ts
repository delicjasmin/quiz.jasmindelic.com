import type { PrismaClient } from "@/lib/generated/prisma/client";
import {
  AUTH_DAILY_LIMIT,
  AUTH_MONTHLY_LIMIT,
  GUEST_DAILY_LIMIT,
  GUEST_LIFETIME_LIMIT,
  IP_AUTH_DAILY_LIMIT,
  IP_GUEST_DAILY_LIMIT,
  PDF_INFO_HOURLY_LIMIT,
} from "@/lib/usage-limits";
import { TRPCError } from "@trpc/server";
import { createHash } from "crypto";

export {
  AUTH_DAILY_LIMIT,
  AUTH_MONTHLY_LIMIT,
  GUEST_DAILY_LIMIT,
  GUEST_LIFETIME_LIMIT,
} from "@/lib/usage-limits";
export { parseGuestId } from "@/lib/guest-id";

export const USAGE_ACTIONS = {
  QUIZ_GENERATE: "quiz_generate",
  PDF_INFO: "pdf_info",
} as const;

export type UsageAction = (typeof USAGE_ACTIONS)[keyof typeof USAGE_ACTIONS];
export type UsageTier = "guest" | "authenticated";

export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(`${ip}:${process.env.BETTER_AUTH_SECRET ?? "dev"}`)
    .digest("hex");
}

export function extractClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return headers.get("x-real-ip") ?? "unknown";
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

async function countEvents(
  prisma: PrismaClient,
  where: {
    action: UsageAction;
    userId?: string;
    guestId?: string;
    ipHash?: string;
    createdAt?: { gte: Date };
  },
): Promise<number> {
  return prisma.usageEvent.count({ where });
}

function tooManyRequests(message: string): never {
  throw new TRPCError({ code: "TOO_MANY_REQUESTS", message });
}

export async function assertCanGenerate(params: {
  prisma: PrismaClient;
  tier: UsageTier;
  userId?: string;
  guestId: string | null;
  ipHash: string;
}): Promise<void> {
  const { prisma, tier, userId, guestId, ipHash } = params;
  const action = USAGE_ACTIONS.QUIZ_GENERATE;
  const dayAgo = daysAgo(1);

  if (tier === "guest") {
    if (!guestId) {
      tooManyRequests(
        "Could not identify your session. Please refresh and try again.",
      );
    }

    const [lifetime, daily, ipDaily] = await Promise.all([
      countEvents(prisma, { action, guestId }),
      countEvents(prisma, { action, guestId, createdAt: { gte: dayAgo } }),
      countEvents(prisma, { action, ipHash, createdAt: { gte: dayAgo } }),
    ]);

    if (lifetime >= GUEST_LIFETIME_LIMIT) {
      tooManyRequests(
        `You've used all ${GUEST_LIFETIME_LIMIT} free quizzes. Sign in with Google to generate more and save them permanently.`,
      );
    }

    if (daily >= GUEST_DAILY_LIMIT) {
      tooManyRequests(
        "You can generate 1 free quiz per day. Sign in with Google for higher limits, or try again tomorrow.",
      );
    }

    if (ipDaily >= IP_GUEST_DAILY_LIMIT) {
      tooManyRequests(
        "Too many quiz generations from this network today. Please try again tomorrow or sign in with Google.",
      );
    }

    return;
  }

  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const monthStart = startOfMonth();
  const [monthly, daily, ipDaily] = await Promise.all([
    countEvents(prisma, {
      action,
      userId,
      createdAt: { gte: monthStart },
    }),
    countEvents(prisma, { action, userId, createdAt: { gte: dayAgo } }),
    countEvents(prisma, { action, ipHash, createdAt: { gte: dayAgo } }),
  ]);

  if (monthly >= AUTH_MONTHLY_LIMIT) {
    tooManyRequests(
      `You've reached your monthly limit of ${AUTH_MONTHLY_LIMIT} quizzes. Please try again next month.`,
    );
  }

  if (daily >= AUTH_DAILY_LIMIT) {
    tooManyRequests(
      `You can generate up to ${AUTH_DAILY_LIMIT} quizzes per day. Please try again tomorrow.`,
    );
  }

  if (ipDaily >= IP_AUTH_DAILY_LIMIT) {
    tooManyRequests(
      "Too many quiz generations from this network today. Please try again tomorrow.",
    );
  }
}

export async function assertCanGetPdfInfo(params: {
  prisma: PrismaClient;
  guestId: string | null;
  ipHash: string;
}): Promise<void> {
  const { prisma, guestId, ipHash } = params;
  const action = USAGE_ACTIONS.PDF_INFO;
  const hourAgo = hoursAgo(1);

  if (guestId) {
    const guestCount = await countEvents(prisma, {
      action,
      guestId,
      createdAt: { gte: hourAgo },
    });

    if (guestCount >= PDF_INFO_HOURLY_LIMIT) {
      tooManyRequests(
        "Too many PDF uploads in a short time. Please wait a bit and try again.",
      );
    }
  }

  const ipCount = await countEvents(prisma, {
    action,
    ipHash,
    createdAt: { gte: hourAgo },
  });

  if (ipCount >= PDF_INFO_HOURLY_LIMIT) {
    tooManyRequests(
      "Too many PDF uploads in a short time. Please wait a bit and try again.",
    );
  }
}

export async function recordUsageEvent(params: {
  prisma: PrismaClient;
  action: UsageAction;
  userId?: string;
  guestId?: string | null;
  ipHash: string;
}): Promise<void> {
  await params.prisma.usageEvent.create({
    data: {
      action: params.action,
      userId: params.userId,
      guestId: params.guestId ?? undefined,
      ipHash: params.ipHash,
    },
  });
}

export async function getUsageQuota(params: {
  prisma: PrismaClient;
  tier: UsageTier;
  userId?: string;
  guestId: string | null;
}): Promise<{
  tier: UsageTier;
  lifetimeRemaining: number | null;
  dailyRemaining: number;
  monthlyRemaining: number | null;
}> {
  const { prisma, tier, userId, guestId } = params;
  const action = USAGE_ACTIONS.QUIZ_GENERATE;
  const dayAgo = daysAgo(1);

  if (tier === "guest") {
    if (!guestId) {
      return {
        tier,
        lifetimeRemaining: GUEST_LIFETIME_LIMIT,
        dailyRemaining: GUEST_DAILY_LIMIT,
        monthlyRemaining: null,
      };
    }

    const [lifetime, daily] = await Promise.all([
      countEvents(prisma, { action, guestId }),
      countEvents(prisma, { action, guestId, createdAt: { gte: dayAgo } }),
    ]);

    return {
      tier,
      lifetimeRemaining: Math.max(0, GUEST_LIFETIME_LIMIT - lifetime),
      dailyRemaining: Math.max(0, GUEST_DAILY_LIMIT - daily),
      monthlyRemaining: null,
    };
  }

  if (!userId) {
    return {
      tier,
      lifetimeRemaining: null,
      dailyRemaining: AUTH_DAILY_LIMIT,
      monthlyRemaining: AUTH_MONTHLY_LIMIT,
    };
  }

  const monthStart = startOfMonth();
  const [monthly, daily] = await Promise.all([
    countEvents(prisma, {
      action,
      userId,
      createdAt: { gte: monthStart },
    }),
    countEvents(prisma, { action, userId, createdAt: { gte: dayAgo } }),
  ]);

  return {
    tier,
    lifetimeRemaining: null,
    dailyRemaining: Math.max(0, AUTH_DAILY_LIMIT - daily),
    monthlyRemaining: Math.max(0, AUTH_MONTHLY_LIMIT - monthly),
  };
}
