import './load-env.mjs'
import fs from 'node:fs/promises'
import pg from 'pg'

const { Client } = pg

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required. Put it in .env.')
  const dbDir = new URL('../db/', import.meta.url)
  const names = (await fs.readdir(dbDir)).filter((name) => /^\d+_.*\.sql$/.test(name)).sort()
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  try {
    await client.connect()
    await client.query('CREATE TABLE IF NOT EXISTS "_migrations" ("name" text PRIMARY KEY, "appliedAt" timestamp NOT NULL DEFAULT now())')
    const existingTables = await client.query(`SELECT to_regclass('"User"') AS user_table`)
    const hasStage1Tables = Boolean(existingTables.rows[0]?.user_table)

    for (const name of names) {
      const already = await client.query('SELECT 1 FROM "_migrations" WHERE "name"=$1 LIMIT 1', [name])
      if (already.rowCount) { console.log(`${name} artıq tətbiq olunub.`); continue }
      if (name === '0001_stage1.sql' && hasStage1Tables) {
        await client.query('INSERT INTO "_migrations" ("name") VALUES ($1)', [name])
        console.log(`${name} mövcud verilənlər bazasına görə qeyd olundu.`)
        continue
      }
      const sql = await fs.readFile(new URL(name, dbDir), 'utf8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO "_migrations" ("name") VALUES ($1)', [name])
        await client.query('COMMIT')
        console.log(`${name} uğurla tətbiq edildi.`)
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    }
    console.log('Bütün verilənlər bazası dəyişiklikləri uğurla tamamlandı.')
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Database migration xətası:', error instanceof Error ? error.message : error)
  process.exit(1)
})
