import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("✖ DATABASE_URL environment variable is required.");
  process.exit(1);
}

const email = (process.env.SEED_EMAIL ?? "andrew.mager@gmail.com").trim().toLowerCase();
const name = (process.env.SEED_NAME ?? "Mager").trim();
const password = process.env.SEED_PASSWORD ?? "test123";

const sql = neon(DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

await sql`
  CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    price TEXT NOT NULL DEFAULT '',
    beds TEXT NOT NULL DEFAULT '',
    baths TEXT NOT NULL DEFAULT '',
    backyard TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'Other',
    status TEXT NOT NULL DEFAULT 'New',
    neighborhood TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    tone TEXT NOT NULL DEFAULT 'blue',
    lat DOUBLE PRECISION NOT NULL DEFAULT 0,
    lng DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

await sql`CREATE INDEX IF NOT EXISTS listings_user_id_idx ON listings (user_id)`;

const passwordHash = await bcrypt.hash(password, 12);
const rows = await sql`
  INSERT INTO users (name, email, password_hash)
  VALUES (${name}, ${email}, ${passwordHash})
  ON CONFLICT (email) DO UPDATE
    SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
  RETURNING id, email`;

console.log(`✔ Tables ready (users, listings)`);
console.log(`✔ Seeded user ${rows[0].email} (id ${rows[0].id})`);
if (password === "test123") console.log("⚠ Default password 'test123' in use — rotate it after first sign-in.");
