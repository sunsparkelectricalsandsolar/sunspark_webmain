import { apiFetch, toQueryString } from "@/lib/api/client";
import type { Category, Product } from "@/lib/types";

const queryTimeoutMs = 2500;

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
  const data = await withFallback(
    apiFetch<{ categories: Category[]; categorySections: Category[]; products: Product[]; brands: string[] }>("/home"),
    { categories: [], categorySections: [], products: [], brands: [] }
  );
  const products = data.products.length ? data.products : await getStoreProducts({});

  return {
    categories: data.categories.sort((a, b) => storefrontCategoryRank(a.slug) - storefrontCategoryRank(b.slug)),
    products,
    categorySections: data.categorySections.sort((a, b) => storefrontCategoryRank(a.slug) - storefrontCategoryRank(b.slug)),
    brands: data.brands
  };
}

export async function getStoreCategories() {
  const categories = await withFallback(apiFetch<Category[]>("/categories"), []);
  return categories.sort((a, b) => storefrontCategoryRank(a.slug) - storefrontCategoryRank(b.slug));
}

export async function getStoreProducts(input: { q?: string; category?: string }) {
  return withFallback(apiFetch<Product[]>(`/products${toQueryString({ q: input.q, category: input.category })}`), []);
}

export async function getCategoryBySlug(slug: string) {
  return withFallback(apiFetch<Category>(`/categories/${encodeURIComponent(slug)}`), null);
}

export async function getProductBySlug(slug: string) {
  return withFallback(apiFetch<Product>(`/products/${encodeURIComponent(slug)}`), null);
}

export async function getRelatedProducts(_categoryId: string, productId: string) {
  return withFallback(apiFetch<Product[]>(`/products/${encodeURIComponent(productId)}/related`), []);
}

export async function getProductCompanions(_categoryId: string, productId: string) {
  return withFallback(apiFetch<Product[]>(`/products/${encodeURIComponent(productId)}/companions`), []);
}
