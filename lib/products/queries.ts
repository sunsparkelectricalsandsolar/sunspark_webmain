import { prisma } from "@/lib/db";

const productInclude = {
  category: true,
  images: {
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }, { createdAt: "asc" as const }]
  }
};

export async function getHomeData() {
  try {
    const [categories, products] = await Promise.all([
      prisma.category.findMany({
        where: { parentId: null, isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
      }),
      prisma.product.findMany({
        where: { isActive: true, isFeatured: true },
        include: productInclude,
        orderBy: { updatedAt: "desc" },
        take: 8
      })
    ]);

    return { categories, products };
  } catch {
    return { categories: [], products: [] };
  }
}

export async function getStoreProducts(input: { q?: string; category?: string }) {
  try {
    return prisma.product.findMany({
      where: {
        isActive: true,
        ...(input.q
          ? {
              OR: [
                { name: { contains: input.q, mode: "insensitive" as const } },
                { sku: { contains: input.q, mode: "insensitive" as const } },
                { shortDescription: { contains: input.q, mode: "insensitive" as const } }
              ]
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
    });
  } catch {
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    return prisma.category.findUnique({
      where: { slug },
      include: {
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
    });
  } catch {
    return null;
  }
}

export async function getProductBySlug(slug: string) {
  try {
    return prisma.product.findUnique({
      where: { slug },
      include: productInclude
    });
  } catch {
    return null;
  }
}

export async function getRelatedProducts(categoryId: string, productId: string) {
  try {
    return prisma.product.findMany({
      where: {
        isActive: true,
        categoryId,
        NOT: { id: productId }
      },
      include: productInclude,
      take: 4,
      orderBy: { updatedAt: "desc" }
    });
  } catch {
    return [];
  }
}
