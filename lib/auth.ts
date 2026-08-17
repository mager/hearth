import bcrypt from "bcryptjs";
import { getSql } from "./db";

export type DbUser = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
};

const BCRYPT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id, name, email, password_hash, created_at
    FROM users
    WHERE email = ${email.trim().toLowerCase()}
    LIMIT 1`) as DbUser[];
  return rows[0] ?? null;
}

export async function createUser(name: string, email: string, password: string): Promise<DbUser> {
  const sql = getSql();
  const passwordHash = await hashPassword(password);
  const rows = (await sql`
    INSERT INTO users (name, email, password_hash)
    VALUES (${name.trim()}, ${email.trim().toLowerCase()}, ${passwordHash})
    RETURNING id, name, email, password_hash, created_at`) as DbUser[];
  return rows[0];
}
