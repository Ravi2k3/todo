/**
 * One-time migration to add multi-user support.
 *
 * Usage:
 *   npx tsx scripts/migrate-multiuser.ts <friend-username> <friend-password>
 *
 * Reads AUTH_PASSWORD_HASH from .env.local for the primary (ravi) account.
 * The friend's password is hashed and inserted as a new user.
 *
 * Existing tasks and push subscriptions are assigned to the primary user.
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { hash } from "bcryptjs";

config({ path: ".env.local" });

const BCRYPT_ROUNDS = 12;

async function migrate(): Promise<void> {
  const databaseUrl: string | undefined = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not set in .env.local");
  }

  const existingHash: string | undefined = process.env["AUTH_PASSWORD_HASH"];
  if (!existingHash) {
    throw new Error("AUTH_PASSWORD_HASH not set in .env.local (needed for primary user migration)");
  }

  const friendUsername: string | undefined = process.argv[2];
  const friendPassword: string | undefined = process.argv[3];

  if (!friendUsername || !friendPassword) {
    console.error("Usage: npx tsx scripts/migrate-multiuser.ts <friend-username> <friend-password>");
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log("Creating users table...");
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  console.log("Creating primary user (ravi)...");
  await sql`
    INSERT INTO users (username, password_hash)
    VALUES ('ravi', ${existingHash})
    ON CONFLICT (username) DO NOTHING
  `;

  console.log(`Creating user (${friendUsername})...`);
  const friendHash: string = await hash(friendPassword, BCRYPT_ROUNDS);
  await sql`
    INSERT INTO users (username, password_hash)
    VALUES (${friendUsername}, ${friendHash})
    ON CONFLICT (username) DO NOTHING
  `;

  // Get primary user ID
  const primaryResult = await sql`SELECT id FROM users WHERE username = 'ravi'`;
  const primaryUserId: number = primaryResult[0].id as number;
  console.log(`Primary user ID: ${primaryUserId}`);

  console.log("Adding user_id column to tasks...");
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)`;
  await sql`UPDATE tasks SET user_id = ${primaryUserId} WHERE user_id IS NULL`;
  await sql`ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL`;

  console.log("Adding user_id column to push_subscriptions...");
  await sql`ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)`;
  await sql`UPDATE push_subscriptions SET user_id = ${primaryUserId} WHERE user_id IS NULL`;
  await sql`ALTER TABLE push_subscriptions ALTER COLUMN user_id SET NOT NULL`;

  const allUsers = await sql`SELECT id, username FROM users ORDER BY id`;
  console.log("\nUsers created:");
  for (const u of allUsers) {
    console.log(`  - ${u.username} (id: ${u.id})`);
  }

  console.log("\nMigration complete! You can now remove AUTH_PASSWORD_HASH from .env.local.");
}

migrate().catch((err: unknown) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
