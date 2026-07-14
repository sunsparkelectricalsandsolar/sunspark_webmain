import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execute, pool, query } from "./db.js";

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

  await removeLegacySkuColumns();

  console.log("Database schema is ready.");
}

async function indexExists(table: string, indexName: string) {
  const rows = await query<{ count: number }>(
    "SELECT COUNT(*) AS count FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?",
    [table, indexName]
  );
  return Number(rows[0]?.count ?? 0) > 0;
}

async function columnExists(table: string, column: string) {
  const rows = await query<{ count: number }>(
    "SELECT COUNT(*) AS count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
    [table, column]
  );
  return Number(rows[0]?.count ?? 0) > 0;
}

async function dropIndexIfExists(table: string, indexName: string) {
  if (await indexExists(table, indexName)) {
    await execute(`ALTER TABLE \`${table}\` DROP INDEX \`${indexName}\``);
  }
}

async function dropColumnIfExists(table: string, column: string) {
  if (await columnExists(table, column)) {
    await execute(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``);
  }
}

async function removeLegacySkuColumns() {
  await dropIndexIfExists("products", "products_search_idx");
  await dropIndexIfExists("products", "sku");
  await dropColumnIfExists("products", "sku");
  await dropColumnIfExists("draft_document_items", "sku");
  await dropColumnIfExists("order_items", "sku");

  if (!(await indexExists("products", "products_search_idx"))) {
    await execute(
      "ALTER TABLE `products` ADD FULLTEXT `products_search_idx` (`name`, `brand`, `short_description`, `description`, `seo_title`, `seo_description`, `seo_keywords`)"
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
