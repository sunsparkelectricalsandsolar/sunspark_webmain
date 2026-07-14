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

  await backfillDefaultProductOptions();

  console.log("Database schema is ready.");
}

async function backfillDefaultProductOptions() {
  await execute(
    `INSERT INTO product_options
       (id, product_id, label, selling_unit, price_cents, compare_at_cents, cost_cents, stock_multiplier, is_default, sort_order)
     SELECT
       CONCAT('opt_', REPLACE(UUID(), '-', '')), p.id,
       CASE
         WHEN p.selling_unit = 'METRE' THEN 'Per metre'
         WHEN p.selling_unit = 'ROLL' THEN 'Roll'
         WHEN p.selling_unit = 'CARTON' THEN 'Carton'
         WHEN p.selling_unit = 'BOX' THEN 'Box'
         WHEN p.selling_unit = 'PACK' THEN 'Pack'
         ELSE 'Unit'
       END,
       p.selling_unit, p.price_cents, p.compare_at_cents, p.cost_cents, 1, TRUE, 0
     FROM products p
     WHERE NOT EXISTS (SELECT 1 FROM product_options po WHERE po.product_id = p.id)`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
