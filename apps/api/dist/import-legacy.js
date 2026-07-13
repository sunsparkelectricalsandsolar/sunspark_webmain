import { execute, pool, query } from "./db.js";
async function tableExists(name) {
    const rows = await query("SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?", [name]);
    return Number(rows[0]?.count ?? 0) > 0;
}
async function runIfTablesExist(names, label, sql) {
    for (const name of names) {
        if (!(await tableExists(name))) {
            console.log(`${label}: skipped, missing ${name}`);
            return;
        }
    }
    await execute(sql);
    console.log(`${label}: imported`);
}
async function main() {
    await runIfTablesExist(["user"], "users", `INSERT INTO users (id, name, email, password_hash, role, phone, created_at, updated_at)
     SELECT id, name, email, passwordHash, role, phone, createdAt, updatedAt FROM \`user\`
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       role = VALUES(role),
       phone = VALUES(phone),
       updated_at = VALUES(updated_at)`);
    await runIfTablesExist(["category"], "categories", `INSERT INTO categories (id, name, slug, description, parent_id, is_active, sort_order, created_at, updated_at)
     SELECT id, name, slug, description, parentId, isActive, sortOrder, createdAt, updatedAt FROM category
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       description = VALUES(description),
       is_active = VALUES(is_active),
       sort_order = VALUES(sort_order),
       updated_at = VALUES(updated_at)`);
    await runIfTablesExist(["categoryimage", "category"], "category images", `INSERT INTO category_images (id, category_id, url, alt, is_primary, sort_order, created_at)
     SELECT ci.id, COALESCE(cn.id, ci.categoryId), ci.url, ci.alt, ci.isPrimary, ci.sortOrder, ci.createdAt
     FROM categoryimage ci
     LEFT JOIN category co ON co.id = ci.categoryId
     LEFT JOIN categories cn ON cn.slug = co.slug
     ON DUPLICATE KEY UPDATE
       url = VALUES(url),
       alt = VALUES(alt),
       is_primary = VALUES(is_primary),
       sort_order = VALUES(sort_order)`);
    await runIfTablesExist(["product", "category"], "products", `INSERT INTO products (
       id, name, slug, sku, brand, short_description, description, price_cents, compare_at_cents,
       cost_cents, selling_unit, stock_quantity, low_stock_threshold, is_active, is_featured, is_hot_deal,
       seo_title, seo_description, seo_keywords, category_id, created_at, updated_at
     )
     SELECT
       p.id, p.name, p.slug, p.sku, p.brand, p.shortDescription, p.description, p.priceCents,
       p.compareAtCents, COALESCE(p.costCents, 0), COALESCE(p.sellingUnit, 'UNIT'), p.stockQuantity,
       p.lowStockThreshold, p.isActive, p.isFeatured, p.isHotDeal, p.seoTitle, p.seoDescription,
       p.seoKeywords, COALESCE(cn.id, p.categoryId), p.createdAt, p.updatedAt
     FROM product p
     LEFT JOIN category co ON co.id = p.categoryId
     LEFT JOIN categories cn ON cn.slug = co.slug
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       sku = VALUES(sku),
       brand = VALUES(brand),
       short_description = VALUES(short_description),
       description = VALUES(description),
       price_cents = VALUES(price_cents),
       compare_at_cents = VALUES(compare_at_cents),
       cost_cents = VALUES(cost_cents),
       selling_unit = VALUES(selling_unit),
       stock_quantity = VALUES(stock_quantity),
       low_stock_threshold = VALUES(low_stock_threshold),
       is_active = VALUES(is_active),
       is_featured = VALUES(is_featured),
       is_hot_deal = VALUES(is_hot_deal),
       seo_title = VALUES(seo_title),
       seo_description = VALUES(seo_description),
       seo_keywords = VALUES(seo_keywords),
       category_id = VALUES(category_id),
       updated_at = VALUES(updated_at)`);
    await runIfTablesExist(["productimage", "product"], "product images", `INSERT INTO product_images (id, product_id, url, alt, is_primary, sort_order, created_at)
     SELECT pi.id, COALESCE(pn.id, pi.productId), pi.url, pi.alt, pi.isPrimary, pi.sortOrder, pi.createdAt
     FROM productimage pi
     LEFT JOIN product po ON po.id = pi.productId
     LEFT JOIN products pn ON pn.slug = po.slug
     ON DUPLICATE KEY UPDATE
       url = VALUES(url),
       alt = VALUES(alt),
       is_primary = VALUES(is_primary),
       sort_order = VALUES(sort_order)`);
}
main()
    .catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
    .finally(async () => {
    await pool.end();
});
