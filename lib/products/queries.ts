import { prisma } from "@/lib/db";
import { getDefaultCategory } from "@/lib/products/default-categories";

const queryTimeoutMs = 1500;

const productInclude = {
  category: true,
  images: {
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }, { createdAt: "asc" as const }]
  }
};

const categoryInclude = {
  images: {
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }, { createdAt: "asc" as const }]
  }
};

function storefrontCategoryRank(slug: string) {
  const order = ["solar", "electricals", "electronics"];
  const rank = order.indexOf(slug);
  return rank === -1 ? order.length : rank;
}

async function withFallback<T>(query: Promise<T>, fallback: T): Promise<T> {
  try {
    return await Promise.race([
      query,
      new Promise<T>((resolve) => {
        setTimeout(() => resolve(fallback), queryTimeoutMs);
      })
    ]);
  } catch {
    return fallback;
  }
}

export async function getHomeData() {
  const categories = await withFallback(
    prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: categoryInclude,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    }),
    []
  );
  const solarCategory = await withFallback(prisma.category.findUnique({ where: { slug: "solar" } }), null);
  const products = await withFallback(
    prisma.product.findMany({
      where: {
        isActive: true,
        ...(solarCategory ? { categoryId: solarCategory.id } : { isFeatured: true })
      },
      include: productInclude,
      orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
      take: 12
    }),
    []
  );
  const categorySections = await withFallback(
    prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        ...categoryInclude,
        products: {
          where: { isActive: true },
          include: productInclude,
          orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
          take: 24
        }
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    }),
    []
  );
  const brands = await withFallback(
    prisma.product.findMany({ where: { isActive: true, brand: { not: null } }, select: { brand: true }, distinct: ["brand"], orderBy: { brand: "asc" }, take: 12 }),
    []
  );

  return {
    categories: categories.sort((a, b) => {
      return storefrontCategoryRank(a.slug) - storefrontCategoryRank(b.slug);
    }),
    products,
    categorySections: categorySections
      .sort((a, b) => {
        return storefrontCategoryRank(a.slug) - storefrontCategoryRank(b.slug);
      }),
    brands: brands.flatMap((item) => item.brand ? [item.brand] : [])
  };
}

export async function getStoreCategories() {
  const categories = await withFallback(
    prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: categoryInclude,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    }),
    []
  );

  return categories.sort((a, b) => storefrontCategoryRank(a.slug) - storefrontCategoryRank(b.slug));
}

export async function getStoreProducts(input: { q?: string; category?: string }) {
  const terms = input.q?.trim().split(/\s+/).filter(Boolean) ?? [];
  return withFallback(
    prisma.product.findMany({
      where: {
        isActive: true,
        ...(terms.length
          ? {
              AND: terms.map((term) => ({
                OR: [
                  { name: { contains: term } },
                  { sku: { contains: term } },
                  { shortDescription: { contains: term } },
                  { description: { contains: term } },
                  { seoTitle: { contains: term } },
                  { seoDescription: { contains: term } },
                  { seoKeywords: { contains: term } },
                  { brand: { contains: term } },
                  { category: { name: { contains: term } } }
                ]
              }))
            }
          : {}),
        ...(input.category
          ? {
              category: {
                slug: input.category
              }
            }
          : {})
      },
      include: productInclude,
      orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }]
    }),
    []
  );
}

export async function getCategoryBySlug(slug: string) {
  const category = await withFallback(
    prisma.category.findUnique({
      where: { slug },
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] },
        products: {
          where: { isActive: true },
          include: productInclude,
          orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }]
        },
        children: {
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
        }
      }
    }),
    null
  );

  if (category) return category;

  const fallbackCategory = getDefaultCategory(slug);

  return fallbackCategory
    ? {
        id: `default-${fallbackCategory.slug}`,
        name: fallbackCategory.name,
        slug: fallbackCategory.slug,
        description: fallbackCategory.description,
        images: [],
        products: [],
        children: []
      }
    : null;
}

export async function getProductBySlug(slug: string) {
  return withFallback(
    prisma.product.findUnique({
      where: { slug },
      include: productInclude
    }),
    null
  );
}

export async function getRelatedProducts(categoryId: string, productId: string) {
  return withFallback(
    prisma.product.findMany({
      where: {
        isActive: true,
        categoryId,
        NOT: { id: productId }
      },
      include: productInclude,
      take: 4,
      orderBy: { updatedAt: "desc" }
    }),
    []
  );
}

export async function getProductCompanions(categoryId: string, productId: string) {
  return withFallback(
    prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: productId },
        categoryId: { not: categoryId }
      },
      include: productInclude,
      take: 4,
      orderBy: [{ isFeatured: "desc" }, { isHotDeal: "desc" }, { updatedAt: "desc" }]
    }),
    []
  );
}
