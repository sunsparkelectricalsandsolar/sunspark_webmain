import { z } from "zod";

export const productInputSchema = z.object({
  name: z.string().trim().min(2),
  sku: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  categoryId: z.string().min(1),
  shortDescription: z.string().trim().optional(),
  description: z.string().trim().optional(),
  priceCents: z.coerce.number().int().min(0),
  compareAtCents: z.coerce.number().int().min(0).optional(),
  costCents: z.coerce.number().int().min(0).default(0),
  sellingUnit: z.enum(["UNIT", "METRE", "ROLL", "CARTON", "BOX", "PACK", "PAIR", "SET", "LITRE", "KILOGRAM"]).default("UNIT"),
  stockQuantity: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(3),
  isActive: z.coerce.boolean().default(false),
  isFeatured: z.coerce.boolean().default(false),
  isHotDeal: z.coerce.boolean().default(false),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional(),
  seoKeywords: z.string().trim().optional()
});

export type ProductInput = z.infer<typeof productInputSchema>;

export function slugifyProductName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
