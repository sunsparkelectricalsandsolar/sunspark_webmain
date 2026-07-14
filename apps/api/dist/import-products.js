import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pool } from "./db.js";
import { id, slugify } from "./id.js";
const args = process.argv.slice(2);
function argValue(name, fallback = "") {
    const direct = args.find((arg) => arg.startsWith(`${name}=`));
    if (direct)
        return direct.slice(name.length + 1);
    const index = args.indexOf(name);
    if (index !== -1)
        return args[index + 1] ?? fallback;
    return fallback;
}
function flag(name) {
    return args.includes(name);
}
function readExport(path) {
    const fullPath = resolve(path);
    if (!existsSync(fullPath))
        throw new Error(`Import file not found: ${fullPath}`);
    const parsed = JSON.parse(readFileSync(fullPath, "utf8"));
    if (!Array.isArray(parsed.headers) || !Array.isArray(parsed.rows)) {
        throw new Error(`${fullPath} must have headers[] and rows[]`);
    }
    return parsed;
}
function rowsAsObjects(table, mapper) {
    return table.rows.map((values) => {
        const row = {};
        table.headers.forEach((header, index) => {
            row[header] = values[index];
        });
        return mapper(row);
    });
}
function text(value, fallback = "") {
    return String(value ?? fallback).trim();
}
function nullableText(value) {
    const content = text(value);
    return content || null;
}
function numberValue(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}
function boolValue(value, fallback = false) {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "number")
        return value !== 0;
    const normalized = text(value).toLowerCase();
    if (["true", "yes", "1", "active"].includes(normalized))
        return true;
    if (["false", "no", "0", "inactive"].includes(normalized))
        return false;
    return fallback;
}
function cents(ksh) {
    return Math.round(ksh * 100);
}
function categoryName(value) {
    const normalized = value.toLowerCase().trim();
    if (normalized === "electrical")
        return "Electricals";
    if (normalized === "solar")
        return "Solar";
    if (normalized === "electronics")
        return "Electronics";
    return value.trim() || "Electricals";
}
function normalizeUnit(value) {
    const normalized = value.toUpperCase().trim();
    if (["METRE", "METER", "PER METRE", "PER METER"].includes(normalized))
        return "METRE";
    if (normalized === "ROLL")
        return "ROLL";
    if (normalized === "CARTON")
        return "CARTON";
    if (normalized === "BOX")
        return "BOX";
    if (normalized === "PACK")
        return "PACK";
    return "UNIT";
}
function optionId(productId, label, unit) {
    return `opt_${slugify(`${productId}-${label}-${unit}`)}`.slice(0, 191);
}
async function existingId(connection, table, column, value) {
    const rows = await connection.query(`SELECT id FROM ${table} WHERE ${column} = ? LIMIT 1`, [value]);
    return rows[0]?.id ?? null;
}
async function ensureCategory(connection, name) {
    const slug = slugify(name);
    const existing = await existingId(connection, "categories", "slug", slug);
    if (existing) {
        await connection.query("UPDATE categories SET name = ?, is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [name, existing]);
        return existing;
    }
    const categoryId = id("cat");
    await connection.query("INSERT INTO categories (id, name, slug, description, is_active, sort_order) VALUES (?, ?, ?, ?, TRUE, ?)", [categoryId, name, slug, `${name} products available from Sunspark Electricals and Solar.`, 100]);
    return categoryId;
}
function mapProduct(row) {
    const name = text(row.name);
    const slug = text(row.slug, slugify(name));
    return {
        importStatus: text(row.import_status),
        productKey: text(row.product_key, slug),
        name,
        slug,
        brand: nullableText(row.brand),
        category: categoryName(text(row.category, "Electricals")),
        shortDescription: text(row.short_description, name),
        description: text(row.description, name),
        seoTitle: text(row.seo_title, name),
        seoDescription: text(row.seo_description),
        seoKeywords: text(row.seo_keywords),
        stockQuantity: numberValue(row.stock_quantity, 0),
        lowStockThreshold: numberValue(row.low_stock_threshold, 3),
        isActive: boolValue(row.is_active, false)
    };
}
function mapOption(row) {
    return {
        productKey: text(row.product_key),
        optionLabel: text(row.option_label, "Unit"),
        sellingUnit: normalizeUnit(text(row.selling_unit, "UNIT")),
        buyingPriceKsh: numberValue(row.buying_price_ksh),
        sellingPriceKsh: numberValue(row.selling_price_ksh),
        comparePriceKsh: row.compare_price_ksh === null || row.compare_price_ksh === undefined || row.compare_price_ksh === ""
            ? null
            : numberValue(row.compare_price_ksh),
        isDefault: boolValue(row.is_default)
    };
}
async function main() {
    const productsPath = argValue("--products", process.env.PRODUCT_IMPORT_PRODUCTS_JSON ?? "products.json");
    const optionsPath = argValue("--options", process.env.PRODUCT_IMPORT_OPTIONS_JSON ?? "options.json");
    const dryRun = flag("--dry-run");
    const forceInactive = flag("--force-inactive") || process.env.PRODUCT_IMPORT_FORCE_INACTIVE === "1";
    const updateStock = flag("--update-stock") || process.env.PRODUCT_IMPORT_UPDATE_STOCK === "1";
    const products = rowsAsObjects(readExport(productsPath), mapProduct)
        .filter((product) => product.importStatus.toUpperCase() === "READY" && product.name && product.slug);
    const options = rowsAsObjects(readExport(optionsPath), mapOption)
        .filter((option) => option.productKey && option.sellingPriceKsh > 0);
    const optionsByProduct = options.reduce((map, option) => {
        const list = map.get(option.productKey) ?? [];
        list.push(option);
        map.set(option.productKey, list);
        return map;
    }, new Map());
    const connection = await pool.getConnection();
    let insertedProducts = 0;
    let updatedProducts = 0;
    let insertedOptions = 0;
    let updatedOptions = 0;
    let skippedProducts = 0;
    try {
        await connection.beginTransaction();
        for (const product of products) {
            const productOptions = optionsByProduct.get(product.productKey) ?? [];
            if (!productOptions.length) {
                skippedProducts += 1;
                continue;
            }
            const categoryId = await ensureCategory(connection, product.category);
            const firstDefault = productOptions.find((option) => option.isDefault) ?? productOptions[0];
            const productId = await existingId(connection, "products", "slug", product.slug) ?? id("prd");
            const exists = await existingId(connection, "products", "id", productId);
            const isActive = forceInactive ? false : product.isActive;
            if (exists) {
                const stockSql = updateStock ? ", stock_quantity = ?" : "";
                const stockValues = updateStock ? [product.stockQuantity] : [];
                await connection.query(`UPDATE products
           SET name = ?, brand = ?, short_description = ?, description = ?, price_cents = ?,
               compare_at_cents = ?, cost_cents = ?, selling_unit = ?, low_stock_threshold = ?,
               seo_title = ?, seo_description = ?, seo_keywords = ?, category_id = ?,
               updated_at = CURRENT_TIMESTAMP${forceInactive ? ", is_active = FALSE" : ""}${stockSql}
           WHERE id = ?`, [
                    product.name,
                    product.brand,
                    product.shortDescription,
                    product.description,
                    cents(firstDefault.sellingPriceKsh),
                    firstDefault.comparePriceKsh === null ? null : cents(firstDefault.comparePriceKsh),
                    cents(firstDefault.buyingPriceKsh),
                    firstDefault.sellingUnit,
                    product.lowStockThreshold,
                    product.seoTitle,
                    product.seoDescription,
                    product.seoKeywords,
                    categoryId,
                    ...stockValues,
                    productId
                ]);
                updatedProducts += 1;
            }
            else {
                await connection.query(`INSERT INTO products
           (id, name, slug, brand, short_description, description, price_cents, compare_at_cents, cost_cents,
            selling_unit, stock_quantity, low_stock_threshold, is_active, seo_title, seo_description, seo_keywords, category_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    productId,
                    product.name,
                    product.slug,
                    product.brand,
                    product.shortDescription,
                    product.description,
                    cents(firstDefault.sellingPriceKsh),
                    firstDefault.comparePriceKsh === null ? null : cents(firstDefault.comparePriceKsh),
                    cents(firstDefault.buyingPriceKsh),
                    firstDefault.sellingUnit,
                    product.stockQuantity,
                    product.lowStockThreshold,
                    isActive,
                    product.seoTitle,
                    product.seoDescription,
                    product.seoKeywords,
                    categoryId
                ]);
                insertedProducts += 1;
            }
            await connection.query("UPDATE product_options SET is_default = FALSE WHERE product_id = ?", [productId]);
            for (const [index, option] of productOptions.entries()) {
                const safeOptionId = optionId(productId, option.optionLabel, option.sellingUnit);
                const existsOption = await existingId(connection, "product_options", "id", safeOptionId);
                const isDefault = option === firstDefault;
                if (existsOption) {
                    await connection.query(`UPDATE product_options
             SET label = ?, selling_unit = ?, price_cents = ?, compare_at_cents = ?, cost_cents = ?,
                 is_default = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`, [
                        option.optionLabel,
                        option.sellingUnit,
                        cents(option.sellingPriceKsh),
                        option.comparePriceKsh === null ? null : cents(option.comparePriceKsh),
                        cents(option.buyingPriceKsh),
                        isDefault,
                        index,
                        safeOptionId
                    ]);
                    updatedOptions += 1;
                }
                else {
                    await connection.query(`INSERT INTO product_options
             (id, product_id, label, selling_unit, price_cents, compare_at_cents, cost_cents, stock_multiplier, is_default, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`, [
                        safeOptionId,
                        productId,
                        option.optionLabel,
                        option.sellingUnit,
                        cents(option.sellingPriceKsh),
                        option.comparePriceKsh === null ? null : cents(option.comparePriceKsh),
                        cents(option.buyingPriceKsh),
                        isDefault,
                        index
                    ]);
                    insertedOptions += 1;
                }
            }
        }
        if (dryRun) {
            await connection.rollback();
            console.log("Dry run complete. No database changes were saved.");
        }
        else {
            await connection.commit();
            console.log("Product import complete.");
        }
        console.table({
            productsRead: products.length,
            insertedProducts,
            updatedProducts,
            skippedProducts,
            insertedOptions,
            updatedOptions
        });
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
        await pool.end();
    }
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
