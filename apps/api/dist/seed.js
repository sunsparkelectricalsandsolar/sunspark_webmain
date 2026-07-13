import bcrypt from "bcryptjs";
import { execute, pool, query } from "./db.js";
import { env } from "./env.js";
import { id, slugify } from "./id.js";
async function ensureAdmin() {
    const email = env("ADMIN_EMAIL", "admin@sunsparkelectricals.co.ke").toLowerCase();
    const existing = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (existing.length) {
        await execute("UPDATE users SET role = 'ADMIN' WHERE id = ?", [existing[0].id]);
        return;
    }
    const passwordHash = await bcrypt.hash(env("ADMIN_PASSWORD", "Password"), 12);
    await execute("INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, 'ADMIN')", [id("usr"), "Sunspark Admin", email, passwordHash]);
}
async function ensureCategory(name, description, sortOrder) {
    const slug = slugify(name);
    const existing = await query("SELECT id FROM categories WHERE slug = ? LIMIT 1", [slug]);
    if (existing.length) {
        await execute("UPDATE categories SET name = ?, description = ?, is_active = TRUE, sort_order = ? WHERE id = ?", [
            name,
            description,
            sortOrder,
            existing[0].id
        ]);
        return;
    }
    await execute("INSERT INTO categories (id, name, slug, description, is_active, sort_order) VALUES (?, ?, ?, ?, TRUE, ?)", [id("cat"), name, slug, description, sortOrder]);
}
async function ensureSettings() {
    await execute(`INSERT INTO site_settings (id, store_name, support_email, report_email, whatsapp_phone, currency)
     VALUES ('default', 'Sunspark Electricals & Solar', ?, ?, ?, 'KSH')
     ON DUPLICATE KEY UPDATE
       support_email = VALUES(support_email),
       report_email = VALUES(report_email),
       whatsapp_phone = VALUES(whatsapp_phone),
       currency = 'KSH'`, [
        env("SUPPORT_EMAIL", "support@sunsparkelectricals.co.ke"),
        env("REPORT_EMAIL", "sunsparkelectricalsandsolar@gmail.com"),
        env("WHATSAPP_PHONE", "254703586562")
    ]);
}
async function main() {
    await ensureAdmin();
    await ensureCategory("Solar", "Solar panels, inverters, batteries, charge controllers and complete solar accessories.", 1);
    await ensureCategory("Electricals", "Cables, switches, breakers, sockets, conduits, meters and installation materials.", 2);
    await ensureCategory("Electronics", "Electronics, lighting, accessories and everyday power devices.", 3);
    await ensureSettings();
    console.log("Seed complete.");
}
main()
    .catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
    .finally(async () => {
    await pool.end();
});
