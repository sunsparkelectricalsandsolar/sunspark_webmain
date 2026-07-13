import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import { z } from "zod";
import { execute, query, transaction } from "./db.js";
import { sendEmail } from "./email.js";
import { env } from "./env.js";
import { id, slugify } from "./id.js";
import { HttpError, asyncRoute, errorHandler } from "./response.js";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  is_active: 0 | 1 | boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  brand: string | null;
  short_description: string | null;
  description: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  cost_cents: number;
  selling_unit: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: 0 | 1 | boolean;
  is_featured: 0 | 1 | boolean;
  is_hot_deal: 0 | 1 | boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  category_id: string;
  created_at: Date;
  updated_at: Date;
  category_name?: string;
  category_slug?: string;
};

type ImageRow = {
  id: string;
  product_id?: string;
  category_id?: string;
  url: string;
  alt: string | null;
  is_primary: 0 | 1 | boolean;
  sort_order: number;
  created_at: Date;
};

const app = express();
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uploadRoot = path.join(appRoot, "public", "uploads");

app.use(cors({ origin: env("FRONTEND_ORIGIN", "*"), credentials: true }));
app.use(express.json({ limit: "24mb" }));
app.use("/uploads", express.static(uploadRoot, { maxAge: "30d", immutable: true }));

function truthy(value: 0 | 1 | boolean) {
  return value === true || value === 1;
}

function apiPublicBase() {
  return env("API_PUBLIC_URL", env("NEXT_PUBLIC_API_URL", "http://localhost:4000")).replace(/\/+$/, "");
}

function publicImageUrl(url: string) {
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  if (url.startsWith("/uploads/")) return `${apiPublicBase()}${url}`;
  if (url.startsWith("uploads/")) return `${apiPublicBase()}/${url}`;
  return url;
}

function mapCategory(row: CategoryRow, images: ImageRow[] = [], products: unknown[] = [], children: unknown[] = []) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    parentId: row.parent_id,
    isActive: truthy(row.is_active),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    images: images.map((image) => ({
      id: image.id,
      categoryId: image.category_id,
      url: publicImageUrl(image.url),
      alt: image.alt,
      isPrimary: truthy(image.is_primary),
      sortOrder: image.sort_order,
      createdAt: image.created_at
    })),
    products,
    children
  };
}

function mapProduct(row: ProductRow, images: ImageRow[] = []) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    brand: row.brand,
    shortDescription: row.short_description,
    description: row.description,
    priceCents: row.price_cents,
    compareAtCents: row.compare_at_cents,
    costCents: row.cost_cents,
    sellingUnit: row.selling_unit,
    stockQuantity: row.stock_quantity,
    lowStockThreshold: row.low_stock_threshold,
    isActive: truthy(row.is_active),
    isFeatured: truthy(row.is_featured),
    isHotDeal: truthy(row.is_hot_deal),
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    seoKeywords: row.seo_keywords,
    categoryId: row.category_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: row.category_name
      ? {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug,
          description: null,
          parentId: null,
          isActive: true,
          sortOrder: 0,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          images: [],
          products: [],
          children: []
        }
      : undefined,
    images: images.map((image) => ({
      id: image.id,
      productId: image.product_id,
      url: publicImageUrl(image.url),
      alt: image.alt,
      isPrimary: truthy(image.is_primary),
      sortOrder: image.sort_order,
      createdAt: image.created_at
    }))
  };
}

const uploadContentTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

function safeUploadName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "image";
}

function frontendOrigin() {
  return env("FRONTEND_ORIGIN", env("NEXT_PUBLIC_SITE_URL", "http://localhost:3000")).replace(/\/+$/, "");
}

function routeParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

async function assertUniqueCategorySlug(slug: string, currentId?: string) {
  const rows = await query<{ id: string }>("SELECT id FROM categories WHERE slug = ? LIMIT 1", [slug]);
  if (rows[0] && rows[0].id !== currentId) {
    throw new HttpError(409, "A category with that name already exists.");
  }
}

async function assertUniqueProductSlugAndSku(slug: string, sku?: string | null, currentId?: string) {
  const slugRows = await query<{ id: string }>("SELECT id FROM products WHERE slug = ? LIMIT 1", [slug]);
  if (slugRows[0] && slugRows[0].id !== currentId) {
    throw new HttpError(409, "A product with that name already exists.");
  }

  if (sku) {
    const skuRows = await query<{ id: string }>("SELECT id FROM products WHERE sku = ? LIMIT 1", [sku]);
    if (skuRows[0] && skuRows[0].id !== currentId) {
      throw new HttpError(409, "A product with that SKU already exists.");
    }
  }
}

async function imagesForProducts(productIds: string[]) {
  if (!productIds.length) return new Map<string, ImageRow[]>();
  const rows = await query<ImageRow>(
    `SELECT * FROM product_images WHERE product_id IN (${productIds.map(() => "?").join(",")})
     ORDER BY is_primary DESC, sort_order ASC, created_at ASC`,
    productIds
  );
  return rows.reduce((map, row) => {
    const list = map.get(row.product_id ?? "") ?? [];
    list.push(row);
    map.set(row.product_id ?? "", list);
    return map;
  }, new Map<string, ImageRow[]>());
}

async function imagesForCategories(categoryIds: string[]) {
  if (!categoryIds.length) return new Map<string, ImageRow[]>();
  const rows = await query<ImageRow>(
    `SELECT * FROM category_images WHERE category_id IN (${categoryIds.map(() => "?").join(",")})
     ORDER BY is_primary DESC, sort_order ASC, created_at ASC`,
    categoryIds
  );
  return rows.reduce((map, row) => {
    const list = map.get(row.category_id ?? "") ?? [];
    list.push(row);
    map.set(row.category_id ?? "", list);
    return map;
  }, new Map<string, ImageRow[]>());
}

async function listProducts(filters: { q?: string; category?: string; categoryId?: string; limit?: number; excludeId?: string } = {}) {
  const where = ["p.is_active = TRUE"];
  const values: unknown[] = [];

  if (filters.category) {
    where.push("c.slug = ?");
    values.push(filters.category);
  }

  if (filters.categoryId) {
    where.push("p.category_id = ?");
    values.push(filters.categoryId);
  }

  if (filters.excludeId) {
    where.push("p.id <> ?");
    values.push(filters.excludeId);
  }

  const terms = filters.q?.trim().split(/\s+/).filter(Boolean) ?? [];
  for (const term of terms) {
    where.push(`(
      p.name LIKE ? OR p.slug LIKE ? OR p.sku LIKE ? OR p.brand LIKE ? OR p.short_description LIKE ? OR
      p.description LIKE ? OR p.seo_title LIKE ? OR p.seo_description LIKE ? OR p.seo_keywords LIKE ? OR c.name LIKE ?
    )`);
    values.push(...Array(10).fill(`%${term}%`));
  }

  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);
  values.push(limit);

  const rows = await query<ProductRow>(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE ${where.join(" AND ")}
     ORDER BY p.is_featured DESC, p.is_hot_deal DESC, p.updated_at DESC
     LIMIT ?`,
    values
  );
  const imageMap = await imagesForProducts(rows.map((row) => row.id));
  return rows.map((row) => mapProduct(row, imageMap.get(row.id) ?? []));
}

function publicUser(row: { id: string; name: string; email: string; phone: string | null; role: string; created_at?: Date }) {
  return { id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role, createdAt: row.created_at };
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

app.get("/health", (_request, response) => {
  response.json({ ok: true, service: "sunspark-api" });
});

app.get("/settings", asyncRoute(async (_request, response) => {
  const rows = await query("SELECT * FROM site_settings WHERE id = 'default' LIMIT 1");
  response.json(rows[0] ?? null);
}));

app.patch("/admin/settings", asyncRoute(async (request, response) => {
  const input = z.object({
    storeName: z.string().min(2),
    supportEmail: z.string().email(),
    reportEmail: z.string().email(),
    whatsappPhone: z.string().min(6),
    currency: z.string().default("KSH")
  }).parse(request.body);

  await execute(
    `INSERT INTO site_settings (id, store_name, support_email, report_email, whatsapp_phone, currency)
     VALUES ('default', ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       store_name = VALUES(store_name),
       support_email = VALUES(support_email),
       report_email = VALUES(report_email),
       whatsapp_phone = VALUES(whatsapp_phone),
       currency = VALUES(currency)`,
    [input.storeName, input.supportEmail, input.reportEmail, input.whatsappPhone, input.currency]
  );

  response.json({ ok: true });
}));

app.get("/categories", asyncRoute(async (_request, response) => {
  const rows = await query<CategoryRow>(
    "SELECT * FROM categories WHERE parent_id IS NULL AND is_active = TRUE ORDER BY sort_order ASC, name ASC"
  );
  const imageMap = await imagesForCategories(rows.map((row) => row.id));
  response.json(rows.map((row) => mapCategory(row, imageMap.get(row.id) ?? [])));
}));

app.get("/admin/categories", asyncRoute(async (request, response) => {
  const q = String(request.query.q ?? "").trim();
  const status = String(request.query.status ?? "");
  const where = ["parent_id IS NULL"];
  const values: unknown[] = [];

  if (q) {
    where.push("(name LIKE ? OR slug LIKE ? OR description LIKE ?)");
    values.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (status === "active") where.push("is_active = TRUE");
  if (status === "hidden") where.push("is_active = FALSE");

  const rows = await query<CategoryRow>(
    `SELECT * FROM categories WHERE ${where.join(" AND ")} ORDER BY sort_order ASC, name ASC`,
    values
  );
  const [imageMap, counts] = await Promise.all([
    imagesForCategories(rows.map((row) => row.id)),
    query<{ category_id: string; count: number }>(
      `SELECT category_id, COUNT(*) AS count FROM products WHERE category_id IN (${rows.length ? rows.map(() => "?").join(",") : "''"}) GROUP BY category_id`,
      rows.map((row) => row.id)
    )
  ]);
  const countMap = new Map(counts.map((row) => [row.category_id, Number(row.count)]));
  response.json(rows.map((row) => ({ ...mapCategory(row, imageMap.get(row.id) ?? []), _count: { products: countMap.get(row.id) ?? 0 } })));
}));

app.get("/admin/categories/:id", asyncRoute(async (request, response) => {
  const rows = await query<CategoryRow>("SELECT * FROM categories WHERE id = ? LIMIT 1", [request.params.id]);
  if (!rows[0]) throw new HttpError(404, "Category not found.");
  const imageMap = await imagesForCategories([rows[0].id]);
  response.json(mapCategory(rows[0], imageMap.get(rows[0].id) ?? []));
}));

app.get("/categories/:slug", asyncRoute(async (request, response) => {
  const rows = await query<CategoryRow>("SELECT * FROM categories WHERE slug = ? AND is_active = TRUE LIMIT 1", [request.params.slug]);
  const category = rows[0];
  if (!category) throw new HttpError(404, "Category not found.");

  const [childrenRows, products, imageMap] = await Promise.all([
    query<CategoryRow>("SELECT * FROM categories WHERE parent_id = ? AND is_active = TRUE ORDER BY sort_order ASC, name ASC", [category.id]),
    listProducts({ categoryId: category.id, limit: 200 }),
    imagesForCategories([category.id])
  ]);
  response.json(mapCategory(category, imageMap.get(category.id) ?? [], products, childrenRows.map((row) => mapCategory(row))));
}));

app.get("/products", asyncRoute(async (request, response) => {
  response.json(await listProducts({
    q: String(request.query.q ?? ""),
    category: String(request.query.category ?? ""),
    limit: Number(request.query.limit ?? 120)
  }));
}));

app.get("/products/by-slugs", asyncRoute(async (request, response) => {
  const slugs = String(request.query.slugs ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean)
    .slice(0, 100);

  if (!slugs.length) {
    response.json([]);
    return;
  }

  const rows = await query<ProductRow>(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM products p JOIN categories c ON c.id = p.category_id
     WHERE p.is_active = TRUE AND p.slug IN (${slugs.map(() => "?").join(",")})
     ORDER BY p.updated_at DESC`,
    slugs
  );
  const imageMap = await imagesForProducts(rows.map((row) => row.id));
  response.json(rows.map((row) => mapProduct(row, imageMap.get(row.id) ?? [])));
}));

app.get("/products/:slug", asyncRoute(async (request, response) => {
  const rows = await query<ProductRow>(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM products p JOIN categories c ON c.id = p.category_id
     WHERE p.slug = ? LIMIT 1`,
    [request.params.slug]
  );
  const product = rows[0];
  if (!product) throw new HttpError(404, "Product not found.");
  const imageMap = await imagesForProducts([product.id]);
  response.json(mapProduct(product, imageMap.get(product.id) ?? []));
}));

app.get("/admin/products/:id", asyncRoute(async (request, response) => {
  const rows = await query<ProductRow>(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM products p JOIN categories c ON c.id = p.category_id
     WHERE p.id = ? LIMIT 1`,
    [request.params.id]
  );
  if (!rows[0]) throw new HttpError(404, "Product not found.");
  const imageMap = await imagesForProducts([rows[0].id]);
  response.json(mapProduct(rows[0], imageMap.get(rows[0].id) ?? []));
}));

app.get("/products/:id/related", asyncRoute(async (request, response) => {
  const productId = String(request.params.id);
  const rows = await query<ProductRow>("SELECT category_id FROM products WHERE id = ? LIMIT 1", [productId]);
  if (!rows[0]) throw new HttpError(404, "Product not found.");
  response.json(await listProducts({ categoryId: rows[0].category_id, excludeId: productId, limit: 8 }));
}));

app.get("/products/:id/companions", asyncRoute(async (request, response) => {
  const productId = String(request.params.id);
  const rows = await query<ProductRow>("SELECT category_id FROM products WHERE id = ? LIMIT 1", [productId]);
  if (!rows[0]) throw new HttpError(404, "Product not found.");
  const products = await listProducts({ excludeId: productId, limit: 12 });
  response.json(products.filter((product) => product.categoryId !== rows[0].category_id).slice(0, 8));
}));

app.get("/home", asyncRoute(async (_request, response) => {
  const categoryRows = await query<CategoryRow>(
    "SELECT * FROM categories WHERE parent_id IS NULL AND is_active = TRUE ORDER BY sort_order ASC, name ASC"
  );
  const categoryImages = await imagesForCategories(categoryRows.map((row) => row.id));
  const categories = categoryRows.map((row) => mapCategory(row, categoryImages.get(row.id) ?? []));
  const categorySections = await Promise.all(categoryRows.map(async (row) => ({
    ...mapCategory(row, categoryImages.get(row.id) ?? []),
    products: await listProducts({ categoryId: row.id, limit: 24 })
  })));
  const products = categorySections.flatMap((section) => section.products).slice(0, 12);
  const brandRows = await query<{ brand: string }>(
    "SELECT DISTINCT brand FROM products WHERE is_active = TRUE AND brand IS NOT NULL AND brand <> '' ORDER BY brand ASC LIMIT 20"
  );

  response.json({ categories, categorySections, products, brands: brandRows.map((row) => row.brand) });
}));

app.get("/admin/stats", asyncRoute(async (_request, response) => {
  const [products, orders, customers, lowStock] = await Promise.all([
    query<{ count: number }>("SELECT COUNT(*) AS count FROM products"),
    query<{ count: number }>("SELECT COUNT(*) AS count FROM orders"),
    query<{ count: number }>("SELECT COUNT(*) AS count FROM users WHERE role = 'CUSTOMER'"),
    query<{ count: number }>("SELECT COUNT(*) AS count FROM products WHERE stock_quantity <= low_stock_threshold")
  ]);

  response.json({
    products: Number(products[0]?.count ?? 0),
    orders: Number(orders[0]?.count ?? 0),
    customers: Number(customers[0]?.count ?? 0),
    lowStock: Number(lowStock[0]?.count ?? 0)
  });
}));

app.get("/campaigns", asyncRoute(async (_request, response) => {
  const rows = await query(
    "SELECT * FROM campaigns WHERE is_active = TRUE ORDER BY updated_at DESC LIMIT 3"
  );
  response.json(rows);
}));

app.get("/admin/campaigns", asyncRoute(async (_request, response) => {
  const rows = await query("SELECT * FROM campaigns ORDER BY updated_at DESC LIMIT 100");
  response.json(rows);
}));

app.get("/admin/customers", asyncRoute(async (request, response) => {
  const q = String(request.query.q ?? "").trim();
  const where = ["role = 'CUSTOMER'"];
  const values: unknown[] = [];
  if (q) {
    where.push("(name LIKE ? OR email LIKE ? OR phone LIKE ?)");
    values.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  const rows = await query(
    `SELECT id, name, email, phone, role, created_at AS createdAt, updated_at AS updatedAt
     FROM users WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT 200`,
    values
  );
  response.json(rows);
}));

app.post("/admin/categories", asyncRoute(async (request, response) => {
  const input = z.object({
    name: z.string().min(2),
    slug: z.string().min(2),
    description: z.string().optional().nullable(),
    sortOrder: z.number().int().default(0),
    isActive: z.boolean().default(true),
    images: z.array(z.object({ url: z.string(), alt: z.string().optional().nullable(), isPrimary: z.boolean(), sortOrder: z.number().int() })).default([])
  }).parse(request.body);
  await assertUniqueCategorySlug(input.slug);
  const categoryId = id("cat");
  await transaction(async (connection) => {
    await connection.query(
      "INSERT INTO categories (id, name, slug, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)",
      [categoryId, input.name, input.slug, input.description ?? null, input.sortOrder, input.isActive]
    );
    for (const image of input.images) {
      await connection.query(
        "INSERT INTO category_images (id, category_id, url, alt, is_primary, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
        [id("cim"), categoryId, image.url, image.alt ?? null, image.isPrimary, image.sortOrder]
      );
    }
  });
  response.status(201).json({ id: categoryId });
}));

app.patch("/admin/categories/:id", asyncRoute(async (request, response) => {
  const input = z.object({
    name: z.string().min(2),
    slug: z.string().min(2),
    description: z.string().optional().nullable(),
    sortOrder: z.number().int().default(0),
    isActive: z.boolean().default(true),
    images: z.array(z.object({ url: z.string(), alt: z.string().optional().nullable(), isPrimary: z.boolean(), sortOrder: z.number().int() })).default([]),
    deleteImageIds: z.array(z.string()).default([]),
    primaryImageId: z.string().optional().nullable()
  }).parse(request.body);
  await assertUniqueCategorySlug(input.slug, routeParam(request.params.id));
  await transaction(async (connection) => {
    await connection.query(
      "UPDATE categories SET name = ?, slug = ?, description = ?, sort_order = ?, is_active = ? WHERE id = ?",
      [input.name, input.slug, input.description ?? null, input.sortOrder, input.isActive, request.params.id]
    );
    if (input.deleteImageIds.length) {
      await connection.query(`DELETE FROM category_images WHERE category_id = ? AND id IN (${input.deleteImageIds.map(() => "?").join(",")})`, [
        request.params.id,
        ...input.deleteImageIds
      ]);
    }
    const countRows = await connection.query("SELECT COUNT(*) AS count FROM category_images WHERE category_id = ?", [request.params.id]) as { count: number }[];
    const existingCount = Number(countRows[0]?.count ?? 0);
    for (const [index, image] of input.images.entries()) {
      await connection.query(
        "INSERT INTO category_images (id, category_id, url, alt, is_primary, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
        [id("cim"), request.params.id, image.url, image.alt ?? null, existingCount === 0 && index === 0, existingCount + index]
      );
    }
    if (input.primaryImageId) {
      await connection.query("UPDATE category_images SET is_primary = FALSE WHERE category_id = ?", [request.params.id]);
      await connection.query("UPDATE category_images SET is_primary = TRUE WHERE id = ?", [input.primaryImageId]);
    }
  });
  response.json({ ok: true });
}));

app.patch("/admin/categories/:id/hide", asyncRoute(async (request, response) => {
  await execute("UPDATE categories SET is_active = FALSE WHERE id = ?", [request.params.id]);
  response.json({ ok: true });
}));

app.delete("/admin/categories/:id", asyncRoute(async (request, response) => {
  const linkedRows = await query<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM draft_document_items ddi
     INNER JOIN products p ON p.id = ddi.product_id
     WHERE p.category_id = ?`,
    [request.params.id]
  );
  if (Number(linkedRows[0]?.count ?? 0) > 0) {
    throw new HttpError(409, "This category has products used on invoices or quotations. Hide it instead, or remove those document items first.");
  }

  await transaction(async (connection) => {
    await connection.query("DELETE FROM products WHERE category_id = ?", [request.params.id]);
    const result = await connection.query("DELETE FROM categories WHERE id = ?", [request.params.id]) as { affectedRows?: number };
    if (!result.affectedRows) throw new HttpError(404, "Category not found.");
  });
  response.status(204).send();
}));

app.post("/admin/uploads", asyncRoute(async (request, response) => {
  const input = z.object({
    folder: z.enum(["products", "categories"]),
    name: z.string().min(1).default("Image"),
    files: z.array(z.object({
      filename: z.string().optional().default("image"),
      type: z.string(),
      dataBase64: z.string().min(1)
    })).max(8)
  }).parse(request.body);

  const targetDir = path.join(uploadRoot, input.folder);
  await mkdir(targetDir, { recursive: true });

  const images = [];
  for (const file of input.files) {
    const extension = uploadContentTypes.get(file.type);
    if (!extension) throw new HttpError(400, "Images must be JPEG, PNG, or WebP.");

    const buffer = Buffer.from(file.dataBase64, "base64");
    if (!buffer.byteLength || buffer.byteLength > 2 * 1024 * 1024) {
      throw new HttpError(400, "Each image must be smaller than 2 MB.");
    }

    const filename = `${crypto.randomUUID()}-${safeUploadName(file.filename).replace(/\.[a-z0-9]+$/i, "")}.${extension}`;
    await writeFile(path.join(targetDir, filename), buffer, { flag: "wx" });
    images.push({
      url: `/uploads/${input.folder}/${filename}`,
      alt: input.name
    });
  }

  response.status(201).json({ images });
}));

app.post("/admin/products", asyncRoute(async (request, response) => {
  const input = z.object({
    name: z.string().min(2),
    slug: z.string().min(2),
    sku: z.string().optional().nullable(),
    brand: z.string().optional().nullable(),
    categoryId: z.string(),
    shortDescription: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    priceCents: z.number().int(),
    compareAtCents: z.number().int().optional().nullable(),
    costCents: z.number().int().default(0),
    sellingUnit: z.string().default("UNIT"),
    stockQuantity: z.number().int().default(0),
    lowStockThreshold: z.number().int().default(5),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    isHotDeal: z.boolean().default(false),
    seoTitle: z.string().optional().nullable(),
    seoDescription: z.string().optional().nullable(),
    seoKeywords: z.string().optional().nullable(),
    images: z.array(z.object({ url: z.string(), alt: z.string().optional().nullable(), isPrimary: z.boolean(), sortOrder: z.number().int() })).default([])
  }).parse(request.body);
  await assertUniqueProductSlugAndSku(input.slug, input.sku);
  const productId = id("prd");
  await transaction(async (connection) => {
    await connection.query(
      `INSERT INTO products
       (id, name, slug, sku, brand, category_id, short_description, description, price_cents, compare_at_cents,
        cost_cents, selling_unit, stock_quantity, low_stock_threshold, is_active, is_featured, is_hot_deal,
        seo_title, seo_description, seo_keywords)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId, input.name, input.slug, input.sku ?? null, input.brand ?? null, input.categoryId,
        input.shortDescription ?? null, input.description ?? null, input.priceCents, input.compareAtCents ?? null,
        input.costCents, input.sellingUnit, input.stockQuantity, input.lowStockThreshold, input.isActive,
        input.isFeatured, input.isHotDeal, input.seoTitle ?? null, input.seoDescription ?? null, input.seoKeywords ?? null
      ]
    );
    for (const image of input.images) {
      await connection.query(
        "INSERT INTO product_images (id, product_id, url, alt, is_primary, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
        [id("pim"), productId, image.url, image.alt ?? null, image.isPrimary, image.sortOrder]
      );
    }
  });
  response.status(201).json({ id: productId });
}));

app.patch("/admin/products/:id", asyncRoute(async (request, response) => {
  const input = z.object({
    name: z.string().min(2),
    slug: z.string().min(2),
    sku: z.string().optional().nullable(),
    brand: z.string().optional().nullable(),
    categoryId: z.string(),
    shortDescription: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    priceCents: z.number().int(),
    compareAtCents: z.number().int().optional().nullable(),
    costCents: z.number().int().default(0),
    sellingUnit: z.string().default("UNIT"),
    stockQuantity: z.number().int().default(0),
    lowStockThreshold: z.number().int().default(5),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    isHotDeal: z.boolean().default(false),
    seoTitle: z.string().optional().nullable(),
    seoDescription: z.string().optional().nullable(),
    seoKeywords: z.string().optional().nullable(),
    images: z.array(z.object({ url: z.string(), alt: z.string().optional().nullable() })).default([]),
    deleteImageIds: z.array(z.string()).default([]),
    primaryImageId: z.string().optional().nullable()
  }).parse(request.body);
  await assertUniqueProductSlugAndSku(input.slug, input.sku, routeParam(request.params.id));
  await transaction(async (connection) => {
    await connection.query(
      `UPDATE products SET name = ?, slug = ?, sku = ?, brand = ?, category_id = ?, short_description = ?,
       description = ?, price_cents = ?, compare_at_cents = ?, cost_cents = ?, selling_unit = ?, stock_quantity = ?,
       low_stock_threshold = ?, is_active = ?, is_featured = ?, is_hot_deal = ?, seo_title = ?, seo_description = ?,
       seo_keywords = ? WHERE id = ?`,
      [
        input.name, input.slug, input.sku ?? null, input.brand ?? null, input.categoryId,
        input.shortDescription ?? null, input.description ?? null, input.priceCents, input.compareAtCents ?? null,
        input.costCents, input.sellingUnit, input.stockQuantity, input.lowStockThreshold, input.isActive,
        input.isFeatured, input.isHotDeal, input.seoTitle ?? null, input.seoDescription ?? null, input.seoKeywords ?? null,
        request.params.id
      ]
    );
    if (input.deleteImageIds.length) {
      await connection.query(`DELETE FROM product_images WHERE product_id = ? AND id IN (${input.deleteImageIds.map(() => "?").join(",")})`, [
        request.params.id,
        ...input.deleteImageIds
      ]);
    }
    const countRows = await connection.query("SELECT COUNT(*) AS count FROM product_images WHERE product_id = ?", [request.params.id]) as { count: number }[];
    const existingCount = Number(countRows[0]?.count ?? 0);
    for (const [index, image] of input.images.entries()) {
      await connection.query(
        "INSERT INTO product_images (id, product_id, url, alt, is_primary, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
        [id("pim"), request.params.id, image.url, image.alt ?? null, existingCount === 0 && index === 0, existingCount + index]
      );
    }
    if (input.primaryImageId) {
      await connection.query("UPDATE product_images SET is_primary = FALSE WHERE product_id = ?", [request.params.id]);
      await connection.query("UPDATE product_images SET is_primary = TRUE WHERE id = ?", [input.primaryImageId]);
    }
  });
  response.json({ ok: true });
}));

app.patch("/admin/products/:id/hide", asyncRoute(async (request, response) => {
  await execute("UPDATE products SET is_active = FALSE WHERE id = ?", [request.params.id]);
  response.json({ ok: true });
}));

app.delete("/admin/products/:id", asyncRoute(async (request, response) => {
  const draftRows = await query<{ count: number }>("SELECT COUNT(*) AS count FROM draft_document_items WHERE product_id = ?", [request.params.id]);
  if (Number(draftRows[0]?.count ?? 0) > 0) {
    throw new HttpError(409, "This product is used on an invoice or quotation. Hide it instead, or remove it from those documents first.");
  }

  const result = await execute("DELETE FROM products WHERE id = ?", [request.params.id]) as { affectedRows?: number };
  if (!result.affectedRows) throw new HttpError(404, "Product not found.");
  response.status(204).send();
}));

app.post("/admin/campaigns", asyncRoute(async (request, response) => {
  const input = z.object({
    title: z.string().min(2),
    description: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    isActive: z.boolean().default(true)
  }).parse(request.body);
  const campaignId = id("cmp");
  await execute(
    "INSERT INTO campaigns (id, title, description, image_url, is_active) VALUES (?, ?, ?, ?, ?)",
    [campaignId, input.title, input.description ?? null, input.imageUrl ?? null, input.isActive]
  );
  response.status(201).json({ id: campaignId });
}));

app.patch("/admin/campaigns/:id", asyncRoute(async (request, response) => {
  const input = z.object({
    title: z.string().min(2),
    description: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    isActive: z.boolean().default(true)
  }).parse(request.body);
  await execute(
    "UPDATE campaigns SET title = ?, description = ?, image_url = COALESCE(?, image_url), is_active = ? WHERE id = ?",
    [input.title, input.description ?? null, input.imageUrl ?? null, input.isActive, request.params.id]
  );
  response.json({ ok: true });
}));

app.patch("/admin/orders/:id", asyncRoute(async (request, response) => {
  const input = z.object({ status: z.string(), paymentStatus: z.string() }).parse(request.body);
  await execute("UPDATE orders SET status = ?, payment_status = ? WHERE id = ?", [input.status, input.paymentStatus, request.params.id]);
  response.json({ ok: true });
}));

function documentReference(kind: "INVOICE" | "QUOTATION") {
  const prefix = kind === "QUOTATION" ? "QUO" : "INV-DRAFT";
  return `${prefix}-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

app.get("/admin/draft-documents", asyncRoute(async (request, response) => {
  const q = String(request.query.q ?? "").trim();
  const where: string[] = [];
  const values: unknown[] = [];

  if (q) {
    where.push("(reference LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR customer_phone LIKE ?)");
    values.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }

  const documents = await query<Record<string, unknown>>(
    `SELECT id, reference, kind, status, order_id AS orderId, customer_name AS customerName,
      customer_email AS customerEmail, customer_phone AS customerPhone, payment_method AS paymentMethod,
      subtotal_cents AS subtotalCents, total_cents AS totalCents, created_at AS createdAt, updated_at AS updatedAt
     FROM draft_documents
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY updated_at DESC
     LIMIT 100`,
    values
  );
  const ids = documents.map((document) => String(document.id));
  const items = ids.length
    ? await query<Record<string, unknown>>(
        `SELECT id, document_id AS documentId, product_id AS productId, product_name AS productName,
          sku, unit_cents AS unitCents, cost_cents AS costCents, quantity, total_cents AS totalCents
         FROM draft_document_items WHERE document_id IN (${ids.map(() => "?").join(",")})`,
        ids
      )
    : [];

  response.json(documents.map((document) => ({ ...document, items: items.filter((item) => item.documentId === document.id) })));
}));

app.get("/admin/draft-documents/:id", asyncRoute(async (request, response) => {
  const documents = await query<Record<string, unknown>>(
    `SELECT id, reference, kind, status, order_id AS orderId, customer_name AS customerName,
      customer_email AS customerEmail, customer_phone AS customerPhone, payment_method AS paymentMethod,
      subtotal_cents AS subtotalCents, total_cents AS totalCents, created_at AS createdAt, updated_at AS updatedAt
     FROM draft_documents WHERE id = ? LIMIT 1`,
    [request.params.id]
  );
  if (!documents[0]) throw new HttpError(404, "Document not found.");
  const items = await query<Record<string, unknown>>(
    `SELECT id, document_id AS documentId, product_id AS productId, product_name AS productName,
      sku, unit_cents AS unitCents, cost_cents AS costCents, quantity, total_cents AS totalCents
     FROM draft_document_items WHERE document_id = ?`,
    [request.params.id]
  );
  response.json({ ...documents[0], items });
}));

app.post("/admin/draft-documents", asyncRoute(async (request, response) => {
  const input = z.object({
    kind: z.enum(["INVOICE", "QUOTATION"]),
    customerName: z.string().min(2),
    customerEmail: z.string().optional().nullable(),
    customerPhone: z.string().optional().nullable(),
    paymentMethod: z.enum(["WHATSAPP", "MPESA", "CASH"]).default("CASH"),
    items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1)
  }).parse(request.body);
  const productIds = [...new Set(input.items.map((item) => item.productId))];
  const rows = await query<ProductRow>(
    `SELECT * FROM products WHERE is_active = TRUE AND id IN (${productIds.map(() => "?").join(",")})`,
    productIds
  );
  if (rows.length !== productIds.length) throw new HttpError(400, "One or more selected products are unavailable.");
  const products = new Map(rows.map((row) => [row.id, row]));
  const documentId = id("doc");
  let totalCents = 0;

  await transaction(async (connection) => {
    const lines = input.items.map((item) => {
      const product = products.get(item.productId);
      if (!product) throw new HttpError(400, "One or more selected products are unavailable.");
      const lineTotal = product.price_cents * item.quantity;
      totalCents += lineTotal;
      return { product, quantity: item.quantity, lineTotal };
    });

    await connection.query(
      `INSERT INTO draft_documents
       (id, reference, kind, customer_name, customer_email, customer_phone, payment_method, subtotal_cents, total_cents)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        documentId,
        documentReference(input.kind),
        input.kind,
        input.customerName,
        input.customerEmail ?? null,
        input.customerPhone ?? null,
        input.paymentMethod,
        totalCents,
        totalCents
      ]
    );

    for (const line of lines) {
      await connection.query(
        `INSERT INTO draft_document_items
         (id, document_id, product_id, product_name, sku, unit_cents, cost_cents, quantity, total_cents)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id("dit"), documentId, line.product.id, line.product.name, line.product.sku, line.product.price_cents, line.product.cost_cents, line.quantity, line.lineTotal]
      );
    }
  });

  response.status(201).json({ id: documentId });
}));

app.post("/admin/draft-documents/:id/finalize", asyncRoute(async (request, response) => {
  const documentRows = await query<Record<string, unknown>>("SELECT * FROM draft_documents WHERE id = ? LIMIT 1", [request.params.id]);
  const document = documentRows[0];
  if (!document || document.status !== "DRAFT") throw new HttpError(400, "This invoice is already finalized or unavailable.");
  if (document.kind !== "INVOICE") throw new HttpError(400, "Quotations do not update stock.");
  const items = await query<Record<string, unknown>>("SELECT * FROM draft_document_items WHERE document_id = ?", [request.params.id]);
  if (!items.length) throw new HttpError(400, "This invoice has no items.");

  const order = await transaction(async (connection) => {
    const productIds = items.map((item) => String(item.product_id));
    const products = await connection.query(`SELECT * FROM products WHERE is_active = TRUE AND id IN (${productIds.map(() => "?").join(",")})`, productIds) as ProductRow[];
    if (products.length !== items.length) throw new HttpError(400, "One or more selected products are unavailable.");
    const productMap = new Map(products.map((product) => [product.id, product]));
    for (const item of items) {
      const product = productMap.get(String(item.product_id));
      if (!product || product.stock_quantity < Number(item.quantity)) throw new HttpError(400, "Stock changed before finalization.");
    }

    const orderId = id("ord");
    const orderNumber = `SUN-${Date.now().toString().slice(-8)}`;
    await connection.query(
      `INSERT INTO orders
       (id, order_number, customer_name, customer_email, customer_phone, payment_method, payment_status, status, subtotal_cents, total_cents)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING', 'CONFIRMED', ?, ?)`,
      [
        orderId,
        orderNumber,
        document.customer_name,
        document.customer_email ?? `invoice-${orderNumber.toLowerCase()}@sunsparkelectricals.co.ke`,
        document.customer_phone ?? null,
        document.payment_method,
        document.subtotal_cents,
        document.total_cents
      ]
    );

    for (const item of items) {
      await connection.query(
        `INSERT INTO order_items (id, order_id, product_id, product_name, sku, unit_cents, cost_cents, quantity, total_cents)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id("itm"), orderId, item.product_id, item.product_name, item.sku, item.unit_cents, item.cost_cents, item.quantity, item.total_cents]
      );
      await connection.query("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?", [item.quantity, item.product_id]);
    }

    await connection.query("INSERT INTO invoices (id, order_id, invoice_number) VALUES (?, ?, ?)", [id("inv"), orderId, `INV-${orderNumber}`]);
    await connection.query("UPDATE draft_documents SET status = 'COMPLETED', order_id = ? WHERE id = ?", [orderId, request.params.id]);
    return { id: orderId };
  });

  response.json(order);
}));

const authSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1)
});

app.post("/auth/login", asyncRoute(async (request, response) => {
  const input = authSchema.parse(request.body);
  const rows = await query<{ id: string; name: string; email: string; phone: string | null; role: string; password_hash: string; created_at: Date }>(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [input.email]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
    throw new HttpError(401, "Invalid email or password.");
  }
  response.json({ user: publicUser(user) });
}));

app.post("/auth/register", asyncRoute(async (request, response) => {
  const input = z.object({
    name: z.string().min(2),
    email: z.string().email().transform((value) => value.toLowerCase()),
    password: z.string().min(8)
  }).parse(request.body);

  const existing = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [input.email]);
  if (existing.length) throw new HttpError(409, "An account with that email already exists.");

  const userId = id("usr");
  await execute(
    "INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, 'CUSTOMER')",
    [userId, input.name, input.email, await bcrypt.hash(input.password, 12)]
  );
  response.status(201).json({ user: { id: userId, name: input.name, email: input.email, phone: null, role: "CUSTOMER" } });
}));

app.get("/users/:id", asyncRoute(async (request, response) => {
  const rows = await query<{ id: string; name: string; email: string; phone: string | null; role: string; created_at: Date }>(
    "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ? LIMIT 1",
    [request.params.id]
  );
  if (!rows[0]) throw new HttpError(404, "User not found.");
  response.json(publicUser(rows[0]));
}));

app.post("/auth/forgot-password", asyncRoute(async (request, response) => {
  const email = z.string().email().parse(request.body.email).toLowerCase();
  const rows = await query<{ id: string }>("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);

  if (rows[0]) {
    const token = crypto.randomBytes(32).toString("base64url");
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await execute(
      "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
      [id("rst"), rows[0].id, hashToken(token), expires]
    );
    const resetUrl = `${frontendOrigin()}/reset-password?token=${encodeURIComponent(token)}`;
    await sendEmail({
      to: email,
      subject: "Reset your Sunspark password",
      text: `Use this link to reset your Sunspark password. It expires in 1 hour: ${resetUrl}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#172033">
          <h2 style="margin:0 0 12px">Reset your Sunspark password</h2>
          <p>Use the button below to set a new password. This link expires in 1 hour.</p>
          <p><a href="${resetUrl}" style="display:inline-block;background:#0f65c8;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none">Reset password</a></p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `
    });
  }

  response.json({ ok: true });
}));

app.post("/auth/reset-password", asyncRoute(async (request, response) => {
  const input = z.object({ token: z.string().min(10), password: z.string().min(8) }).parse(request.body);
  const rows = await query<{ id: string; user_id: string }>(
    "SELECT id, user_id FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1",
    [hashToken(input.token)]
  );
  if (!rows[0]) throw new HttpError(400, "Password reset link is invalid or expired.");

  await transaction(async (connection) => {
    await connection.query("UPDATE users SET password_hash = ? WHERE id = ?", [await bcrypt.hash(input.password, 12), rows[0].user_id]);
    await connection.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?", [rows[0].id]);
  });

  response.json({ ok: true });
}));

app.post("/orders/checkout", asyncRoute(async (request, response) => {
  const input = z.object({
    userId: z.string().optional().nullable(),
    customerName: z.string().min(2),
    customerEmail: z.string().email(),
    customerPhone: z.string().optional().nullable(),
    deliveryNote: z.string().optional().nullable(),
    deliveryLocation: z.string().optional().nullable(),
    deliveryMapUrl: z.string().optional().nullable(),
    deliveryLatitude: z.string().optional().nullable(),
    deliveryLongitude: z.string().optional().nullable(),
    paymentMethod: z.enum(["WHATSAPP", "MPESA", "CASH"]),
    items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1)
  }).parse(request.body);
  const productIds = [...new Set(input.items.map((item) => item.productId))];
  const rows = await query<ProductRow>(
    `SELECT * FROM products WHERE is_active = TRUE AND id IN (${productIds.map(() => "?").join(",")})`,
    productIds
  );
  const products = new Map(rows.map((row) => [row.id, row]));

  const order = await transaction(async (connection) => {
    const orderId = id("ord");
    const orderNumber = `SUN-${Date.now().toString().slice(-8)}`;
    let subtotal = 0;
    const lines = input.items.map((item) => {
      const product = products.get(item.productId);
      if (!product) throw new HttpError(400, "One cart product is not available.");
      if (product.stock_quantity < item.quantity) throw new HttpError(400, `${product.name} has insufficient stock.`);
      const total = product.price_cents * item.quantity;
      subtotal += total;
      return { product, quantity: item.quantity, total };
    });

    await connection.query(
      `INSERT INTO orders
       (id, order_number, user_id, customer_name, customer_email, customer_phone, delivery_note, delivery_location,
        delivery_map_url, delivery_latitude, delivery_longitude, payment_method, subtotal_cents, total_cents)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        orderNumber,
        input.userId ?? null,
        input.customerName,
        input.customerEmail,
        input.customerPhone ?? null,
        input.deliveryNote ?? null,
        input.deliveryLocation ?? null,
        input.deliveryMapUrl ?? null,
        input.deliveryLatitude ?? null,
        input.deliveryLongitude ?? null,
        input.paymentMethod,
        subtotal,
        subtotal
      ]
    );

    for (const line of lines) {
      await connection.query(
        `INSERT INTO order_items (id, order_id, product_id, product_name, sku, unit_cents, cost_cents, quantity, total_cents)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id("itm"), orderId, line.product.id, line.product.name, line.product.sku, line.product.price_cents, line.product.cost_cents, line.quantity, line.total]
      );
      await connection.query("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?", [line.quantity, line.product.id]);
    }

    const invoiceNumber = `INV-${orderNumber}`;
    await connection.query("INSERT INTO invoices (id, order_id, invoice_number) VALUES (?, ?, ?)", [id("inv"), orderId, invoiceNumber]);

    return {
      id: orderId,
      orderNumber,
      userId: input.userId ?? null,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone ?? null,
      deliveryNote: input.deliveryNote ?? null,
      deliveryLocation: input.deliveryLocation ?? null,
      deliveryMapUrl: input.deliveryMapUrl ?? null,
      deliveryLatitude: input.deliveryLatitude ?? null,
      deliveryLongitude: input.deliveryLongitude ?? null,
      status: "PENDING",
      paymentMethod: input.paymentMethod,
      paymentStatus: "UNPAID",
      subtotalCents: subtotal,
      totalCents: subtotal,
      items: lines.map((line) => ({
        productId: line.product.id,
        productName: line.product.name,
        sku: line.product.sku,
        unitCents: line.product.price_cents,
        costCents: line.product.cost_cents,
        quantity: line.quantity,
        totalCents: line.total
      })),
      invoice: { invoiceNumber }
    };
  });

  response.status(201).json(order);
}));

app.get("/orders", asyncRoute(async (request, response) => {
  const userId = String(request.query.userId ?? "");
  const email = String(request.query.email ?? "");
  const where: string[] = [];
  const values: unknown[] = [];

  if (userId) {
    where.push("user_id = ?");
    values.push(userId);
  }

  if (email) {
    where.push("(user_id IS NULL AND customer_email = ?)");
    values.push(email);
  }

  if (!where.length) {
    response.json([]);
    return;
  }

  const rows = await query<Record<string, unknown>>(
    `SELECT
       id, order_number AS orderNumber, user_id AS userId, customer_name AS customerName,
       customer_email AS customerEmail, customer_phone AS customerPhone, delivery_note AS deliveryNote,
       delivery_location AS deliveryLocation, delivery_map_url AS deliveryMapUrl,
       delivery_latitude AS deliveryLatitude, delivery_longitude AS deliveryLongitude,
       status, payment_method AS paymentMethod, payment_status AS paymentStatus,
       subtotal_cents AS subtotalCents, total_cents AS totalCents, created_at AS createdAt, updated_at AS updatedAt
     FROM orders
     WHERE ${where.join(" OR ")}
     ORDER BY created_at DESC
     LIMIT 100`,
    values
  );
  response.json(rows);
}));

app.get("/admin/orders", asyncRoute(async (request, response) => {
  const q = String(request.query.q ?? "").trim();
  const status = String(request.query.status ?? "");
  const paymentStatus = String(request.query.paymentStatus ?? "");
  const customerId = String(request.query.customerId ?? "");
  const where: string[] = [];
  const values: unknown[] = [];

  if (q) {
    where.push("(order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR customer_phone LIKE ? OR delivery_location LIKE ? OR delivery_note LIKE ?)");
    values.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (status) {
    where.push("status = ?");
    values.push(status);
  }
  if (paymentStatus) {
    where.push("payment_status = ?");
    values.push(paymentStatus);
  }
  if (customerId) {
    where.push("user_id = ?");
    values.push(customerId);
  }

  const orders = await query<Record<string, unknown>>(
    `SELECT
       id, order_number AS orderNumber, user_id AS userId, customer_name AS customerName,
       customer_email AS customerEmail, customer_phone AS customerPhone, delivery_note AS deliveryNote,
       delivery_location AS deliveryLocation, delivery_map_url AS deliveryMapUrl,
       delivery_latitude AS deliveryLatitude, delivery_longitude AS deliveryLongitude,
       status, payment_method AS paymentMethod, payment_status AS paymentStatus,
       subtotal_cents AS subtotalCents, total_cents AS totalCents, created_at AS createdAt, updated_at AS updatedAt
     FROM orders
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY created_at DESC
     LIMIT 200`,
    values
  );
  const ids = orders.map((order) => String(order.id));
  const items = ids.length
    ? await query<Record<string, unknown>>(
        `SELECT id, order_id AS orderId, product_id AS productId, product_name AS productName, sku,
         unit_cents AS unitCents, cost_cents AS costCents, quantity, total_cents AS totalCents
         FROM order_items WHERE order_id IN (${ids.map(() => "?").join(",")})`,
        ids
      )
    : [];
  response.json(orders.map((order) => ({ ...order, items: items.filter((item) => item.orderId === order.id) })));
}));

app.get("/admin/orders/:id", asyncRoute(async (request, response) => {
  const orders = await query<Record<string, unknown>>(
    `SELECT
       id, order_number AS orderNumber, user_id AS userId, customer_name AS customerName,
       customer_email AS customerEmail, customer_phone AS customerPhone, delivery_note AS deliveryNote,
       delivery_location AS deliveryLocation, delivery_map_url AS deliveryMapUrl,
       delivery_latitude AS deliveryLatitude, delivery_longitude AS deliveryLongitude,
       status, payment_method AS paymentMethod, payment_status AS paymentStatus,
       subtotal_cents AS subtotalCents, total_cents AS totalCents, created_at AS createdAt, updated_at AS updatedAt
     FROM orders WHERE id = ? LIMIT 1`,
    [request.params.id]
  );
  if (!orders[0]) throw new HttpError(404, "Order not found.");
  const [items, invoices] = await Promise.all([
    query<Record<string, unknown>>(
      `SELECT id, order_id AS orderId, product_id AS productId, product_name AS productName, sku,
       unit_cents AS unitCents, cost_cents AS costCents, quantity, total_cents AS totalCents
       FROM order_items WHERE order_id = ?`,
      [request.params.id]
    ),
    query<Record<string, unknown>>("SELECT id, order_id AS orderId, invoice_number AS invoiceNumber, issued_at AS issuedAt FROM invoices WHERE order_id = ? LIMIT 1", [request.params.id])
  ]);
  response.json({ ...orders[0], items, invoice: invoices[0] ?? null });
}));

app.use(errorHandler);

const port = Number(env("PORT", "4000"));
app.listen(port, () => {
  console.log(`Sunspark API listening on ${port}`);
});
