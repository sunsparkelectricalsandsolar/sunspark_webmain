import type { MetadataRoute } from "next";
import { apiFetch } from "@/lib/api/client";
import { siteConfig } from "@/lib/site-config";
import type { Category, Product } from "@/lib/types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseRoutes = ["", "/store", "/policies", "/login", "/register", "/cart", "/checkout"].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.7
  }));

  try {
    const [categories, products] = await Promise.all([
      apiFetch<Category[]>("/categories"),
      apiFetch<Product[]>("/products?limit=2000")
    ]);

    return [
      ...baseRoutes,
      ...categories.map((category) => ({
        url: `${siteConfig.url}/category/${category.slug}`,
        lastModified: new Date(category.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8
      })),
      ...products.map((product) => ({
        url: `${siteConfig.url}/product/${product.slug}`,
        lastModified: new Date(product.updatedAt),
        changeFrequency: "daily" as const,
        priority: 0.9
      }))
    ];
  } catch {
    return baseRoutes;
  }
}
