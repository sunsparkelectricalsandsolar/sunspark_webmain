import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { createProductAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <section className="section">
      <div className="container admin-shell narrow">
        <div className="admin-heading">
          <p className="eyebrow">Admin</p>
          <h1>Add Product</h1>
        </div>
        <ProductForm action={createProductAction} categories={categories} />
      </div>
    </section>
  );
}

async function getCategories() {
  try {
    return prisma.category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  } catch {
    return [];
  }
}
