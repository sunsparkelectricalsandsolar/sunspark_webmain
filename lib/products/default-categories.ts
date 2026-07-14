export const defaultCategories = [
  {
    name: "Electricals",
    slug: "electricals",
    description: "Cables, switches, breakers, fittings, and installation essentials."
  },
  {
    name: "Electronics",
    slug: "electronics",
    description: "Reliable electronics and accessories for home and business."
  }
] as const;

export function getDefaultCategory(slug: string) {
  return defaultCategories.find((category) => category.slug === slug) ?? null;
}
