/**
 * Add a new user with a default password and force-change-on-first-login.
 *
 * Usage:
 *   npx tsx scripts/add-user.ts <username> [password]
 *
 * If no password is provided, defaults to "changeme123".
 * The user will be required to change their password on first login.
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { hash } from "bcryptjs";

config({ path: ".env.local" });

const BCRYPT_ROUNDS = 12;
const DEFAULT_PASSWORD = "changeme123";

async function addUser(): Promise<void> {
  const databaseUrl: string | undefined = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not set in .env.local");
  }

  const username: string | undefined = process.argv[2];
  const password: string = process.argv[3] ?? DEFAULT_PASSWORD;

  if (!username) {
    console.error("Usage: npx tsx scripts/add-user.ts <username> [password]");
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  const passwordHash: string = await hash(password, BCRYPT_ROUNDS);

  console.log(`Creating user "${username}" with must_change_password=true...`);

  await sql`
    INSERT INTO users (username, password_hash, must_change_password)
    VALUES (${username.trim().toLowerCase()}, ${passwordHash}, true)
    ON CONFLICT (username) DO UPDATE
    SET password_hash = ${passwordHash}, must_change_password = true
  `;

  const result = await sql`SELECT id, username FROM users WHERE username = ${username.trim().toLowerCase()}`;
  console.log(`User created: ${result[0].username} (id: ${result[0].id})`);
  console.log(`Default password: ${password}`);
  console.log("User will be required to change password on first login.");
}

addUser().catch((err: unknown) => {
  console.error("Failed to add user:", err);
  process.exit(1);
});
