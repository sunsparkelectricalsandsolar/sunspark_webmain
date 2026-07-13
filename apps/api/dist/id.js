import { randomUUID } from "node:crypto";
export function id(prefix = "") {
    const value = randomUUID();
    return prefix ? `${prefix}_${value}` : value;
}
export function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
