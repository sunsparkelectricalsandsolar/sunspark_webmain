import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 2 * 1024 * 1024;

export type SavedProductImage = {
  url: string;
  alt: string;
};

function safeExtension(file: File) {
  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

export async function saveUploadedImages(
  files: File[],
  name: string,
  folder: "products" | "categories"
): Promise<SavedProductImage[]> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadDir, { recursive: true });

  const saved: SavedProductImage[] = [];

  for (const file of files) {
    if (!file.size || !allowedTypes.has(file.type) || file.size > maxBytes) {
      continue;
    }

    const filename = `${randomUUID()}.${safeExtension(file)}`;
    const destination = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(destination, buffer);
    saved.push({
      url: `/uploads/${folder}/${filename}`,
      alt: name
    });
  }

  return saved;
}

export async function saveProductImages(files: File[], productName: string): Promise<SavedProductImage[]> {
  return saveUploadedImages(files, productName, "products");
}

export async function saveCategoryImages(files: File[], categoryName: string): Promise<SavedProductImage[]> {
  return saveUploadedImages(files, categoryName, "categories");
}
