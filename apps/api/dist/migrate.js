import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execute, pool, query } from "./db.js";
const here = dirname(fileURLToPath(import.meta.url));
const migrationPath = resolve(here, "../sql/001_init.sql");
function splitStatements(sql) {
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
    await backfillDefaultProductOptions();
    console.log("Database schema is ready.");
}
async function indexExists(table, indexName) {
    const rows = await query("SELECT COUNT(*) AS count FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?", [table, indexName]);
    return Number(rows[0]?.count ?? 0) > 0;
}
async function columnExists(table, column) {
    const rows = await query("SELECT COUNT(*) AS count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?", [table, column]);
    return Number(rows[0]?.count ?? 0) > 0;
}
async function dropIndexIfExists(table, indexName) {
    if (await indexExists(table, indexName)) {
        await execute(`ALTER TABLE \`${table}\` DROP INDEX \`${indexName}\``);
    }
}
async function dropColumnIfExists(table, column) {
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
        await execute("ALTER TABLE `products` ADD FULLTEXT `products_search_idx` (`name`, `brand`, `short_description`, `description`, `seo_title`, `seo_description`, `seo_keywords`)");
    }
}
async function backfillDefaultProductOptions() {
    await execute(`INSERT INTO product_options
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
     WHERE NOT EXISTS (SELECT 1 FROM product_options po WHERE po.product_id = p.id)`);
}
main()
    .catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
    .finally(async () => {
    await pool.end();
});
