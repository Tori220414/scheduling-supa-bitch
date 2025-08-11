// Server-only Postgres connection using the 'pg' library.
// Uses POSTGRES_URL (or POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING) with SSL.
//
// Note: Supabase recommends SSL for client connections. If your connection string
// doesn't include sslmode, we enforce SSL via the config here. See docs [^3].

import { Pool, type PoolClient } from "pg"

declare global {
  // Allow global caching of the pool in dev to avoid exhausting connections on HMR.
  // eslint-disable-next-line no-var
  var __pgPool__: Pool | undefined
}

function getConnectionString() {
  // Prefer the pooled URL if present; otherwise fall back to POSTGRES_URL.
  return process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING || ""
}

function createPool() {
  const connectionString = getConnectionString()
  if (!connectionString) {
    throw new Error(
      "Missing Postgres connection string. Set POSTGRES_URL (or POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING).",
    )
  }

  // Let ?sslmode=require in the URL take effect if present; otherwise enforce SSL.
  const needsExplicitSSL = !/sslmode=/i.test(connectionString)
  const pool = new Pool({
    connectionString,
    ssl: needsExplicitSSL
      ? {
          // In most managed environments, it's fine to skip CA validation.
          // For stricter verification, use the downloaded root cert and pass 'ca'.
          rejectUnauthorized: false,
        }
      : undefined,
    max: 4, // keep modest to prevent exhausting Supabase pool
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  })
  return pool
}

export function getPool(): Pool {
  if (!global.__pgPool__) {
    global.__pgPool__ = createPool()
  }
  return global.__pgPool__
}

export async function withClient<T>(fn: (client: PoolClient) => Promise<T>) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}
