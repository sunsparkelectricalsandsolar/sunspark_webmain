import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execute, pool } from "./db.js";

const here = dirname(fileURLToPath(import.meta.url));
const migrationPath = resolve(here, "../sql/001_init.sql");

function splitStatements(sql: string) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function main() {
  const sql = readFileSync(migrationPath, "utf8");

  for (const statement of splitStatements(sql)) {
    await execute(statement);
  }

  console.log("Database schema is ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
