// Stub for @better-auth/kysely-adapter — we use the Prisma adapter, so Kysely
// code never runs. Bypasses broken DEFAULT_MIGRATION_* imports with kysely 0.29.
// Remove once better-auth ships the fix (better-auth/better-auth#9810).

export function getKyselyDatabaseType() {
  return null;
}

export async function createKyselyAdapter() {
  return { kysely: null, databaseType: null, transaction: undefined };
}
