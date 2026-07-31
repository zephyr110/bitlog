import { createClient } from "@libsql/client"
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
const r = await db.execute("SELECT slug, date, title FROM posts WHERE draft = 0 ORDER BY date DESC LIMIT 5")
for (const row of r.rows) {
  const d = row.date
  console.log(`date="${d}" | type=${typeof d} | new Date=${new Date(d).toISOString()} | slice(5)="${d?.slice?.(5)}" | ${row.title}`)
}
db.close()
