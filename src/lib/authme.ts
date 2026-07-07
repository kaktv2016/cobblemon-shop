import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "crypto";

// ============================================================================
// AuthMe Database Client (separate DB: cobblemondivided)
// ============================================================================

const globalForAuthme = global as unknown as { authmeDb: PrismaClient };

export const authmeDb =
  globalForAuthme.authmeDb ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.AUTHME_DATABASE_URL || process.env.DATABASE_URL!,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForAuthme.authmeDb = authmeDb;
}

// ============================================================================
// AuthMe Password Hashing (SHA256 format)
// Format: $SHA$<salt>$<SHA256(SHA256(password) + salt)>
// ============================================================================

function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Hash a password using AuthMe's default SHA256 algorithm.
 * Produces: $SHA$<16-char-hex-salt>$<sha256(sha256(password)+salt)>
 */
export function authmeHash(password: string): string {
  const salt = randomBytes(8).toString("hex"); // 16 hex chars
  const inner = sha256(password);
  const outer = sha256(inner + salt);
  return `$SHA$${salt}$${outer}`;
}

/**
 * Verify a password against an AuthMe hash string.
 * Supports: $SHA$<salt>$<hash> (AuthMe default)
 */
export function authmeVerify(password: string, stored: string): boolean {
  if (!stored.startsWith("$SHA$")) {
    // Unsupported hash format
    return false;
  }

  const parts = stored.split("$");
  // parts = ["", "SHA", "<salt>", "<hash>"]
  if (parts.length !== 4) return false;

  const salt = parts[2];
  const expectedHash = parts[3];
  const inner = sha256(password);
  const actual = sha256(inner + salt);

  return actual === expectedHash;
}

// ============================================================================
// AuthMe Database Operations
// ============================================================================

export interface AuthmePlayer {
  id: number;
  username: string;
  realname: string;
  password: string;
  email: string | null;
  ip: string | null;
  lastlogin: bigint | null;
  regdate: bigint;
  regip: string | null;
}

/**
 * Find an AuthMe player by username (case-insensitive, stored lowercase).
 */
export async function findAuthmePlayer(
  username: string
): Promise<AuthmePlayer | null> {
  const results = await authmeDb.$queryRawUnsafe<AuthmePlayer[]>(
    "SELECT id, username, realname, password, email, ip, lastlogin, regdate, regip FROM authme WHERE LOWER(username) = LOWER(?)",
    username.toLowerCase()
  );
  return results[0] ?? null;
}

/**
 * Find an AuthMe player by email.
 */
export async function findAuthmePlayerByEmail(
  email: string
): Promise<AuthmePlayer | null> {
  const results = await authmeDb.$queryRawUnsafe<AuthmePlayer[]>(
    "SELECT id, username, realname, password, email, ip, lastlogin, regdate, regip FROM authme WHERE LOWER(email) = LOWER(?)",
    email.toLowerCase()
  );
  return results[0] ?? null;
}

/**
 * Create a new AuthMe player record.
 * This allows the player to log in to the Minecraft server with the same credentials.
 */
export async function createAuthmePlayer(
  username: string,
  password: string,
  email: string,
  ip?: string
): Promise<void> {
  const hashedPassword = authmeHash(password);
  const now = Date.now();

  await authmeDb.$executeRawUnsafe(
    `INSERT INTO authme (username, realname, password, email, ip, regdate, regip, x, y, z, world, isLogged, hasSession)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 'world', 0, 0)`,
    username.toLowerCase(),
    username, // realname keeps original casing
    hashedPassword,
    email.toLowerCase(),
    ip || null,
    now,
    ip || null
  );
}

/**
 * Update the last login timestamp for an AuthMe player.
 */
export async function updateAuthmeLastLogin(
  username: string,
  ip?: string
): Promise<void> {
  const now = Date.now();
  await authmeDb.$executeRawUnsafe(
    "UPDATE authme SET lastlogin = ?, ip = ? WHERE LOWER(username) = LOWER(?)",
    now,
    ip || null,
    username.toLowerCase()
  );
}
