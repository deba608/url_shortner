#!/usr/bin/env node
/**
 * prestart.js — runs before `node server.js` on every deploy.
 *
 * Applies any pending Prisma migrations with `prisma migrate deploy`. This is the
 * safe production path: it only runs migration files that haven't been applied
 * yet and NEVER drops data. If a migration fails, we abort the boot (non-zero
 * exit) so the platform doesn't start the server against a half-migrated schema.
 *
 * NOTE (one-time baseline): this project previously deployed via
 * `db push --accept-data-loss`, so a live database may already contain the schema
 * without matching rows in Prisma's `_prisma_migrations` table. Before the first
 * deploy on this flow, baseline each already-applied migration once:
 *   npx prisma migrate resolve --applied <migration_name>
 * See README ("Database migrations") for the full list.
 */
const { execSync } = require("child_process");

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit" }); // throws on non-zero → aborts boot
}

try {
  run("npx prisma migrate deploy");
  console.log("\n✅ prestart complete — starting server...");
} catch (err) {
  console.error(`\n❌ prestart failed: migrations did not apply cleanly (exit ${err.status}).`);
  console.error("Aborting startup to avoid running against an inconsistent schema.");
  process.exit(1);
}
