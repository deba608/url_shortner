#!/usr/bin/env node
/**
 * prestart.js — runs before `node server.js` on every deploy.
 *
 * 1. Marks the known-failed migration as rolled-back (safe to re-run if already resolved).
 * 2. Pushes the current schema.prisma to the database, creating / altering tables as needed.
 *
 * Using `db push --accept-data-loss` is intentional for this project:
 * the schema evolved via push (not migrate) so the migration history is not
 * the source of truth for production.
 */
const { execSync } = require("child_process");

function run(cmd) {
  console.log(`\n> ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (err) {
    // Non-zero exit is acceptable for resolve (migration may already be resolved)
    console.warn(`Command exited with code ${err.status}. Continuing...`);
  }
}

// Step 1: Clear any failed migration records so db push is not blocked.
run(
  "npx prisma migrate resolve --rolled-back 20260617150519_add_name_and_avatar"
);

// Step 2: Sync the live database schema to schema.prisma.
run("npx prisma db push --accept-data-loss");

console.log("\n✅ prestart complete — starting server...");
