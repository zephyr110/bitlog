import { createClient, type Client } from "@libsql/client"

let client: Client | null = null

export function getDb(): Client | null {
  if (client) return client
  const url = process.env.TURSO_DATABASE_URL
  if (!url) return null
  client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  return client
}
