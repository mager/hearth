import { neon, Pool } from "@neondatabase/serverless";

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set.");
  return url;
}

let pool: Pool | undefined;

/** Shared Neon connection pool (WebSocket), reused across warm invocations. */
export function getPool(): Pool {
  pool ??= new Pool({ connectionString: databaseUrl() });
  return pool;
}

/** One-shot serverless query client (HTTP fetch). Good for simple queries. */
export function getSql(): ReturnType<typeof neon> {
  return neon(databaseUrl());
}
