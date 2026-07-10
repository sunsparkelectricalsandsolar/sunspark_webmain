import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { siteConfig } from "@/lib/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseRoutes = ["", "/store", "/login", "/register", "/cart", "/checkout"].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.7
  }));

  try {
    const [categories, products] = await Promise.all([
      prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } })
    ]);

    return [
      ...baseRoutes,
      ...categories.map((category) => ({
        url: `${siteConfig.url}/category/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8
      })),
      ...products.map((product) => ({
        url: `${siteConfig.url}/product/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.9
      }))
    ];
  } catch {
    return baseRoutes;
  }
}
