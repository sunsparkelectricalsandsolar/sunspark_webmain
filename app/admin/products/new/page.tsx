import { AdminLayout } from "@/components/admin/admin-layout";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth/guards";
import { apiFetch } from "@/lib/api/client";
import type { Category } from "@/lib/types";
import { createProductAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <AdminLayout title="Add Product" subtitle="Create product details, stock, pricing, and image gallery.">
      <div className="admin-shell narrow">
        <ProductForm action={createProductAction} categories={categories} />
      </div>
    </AdminLayout>
  );
}

async function getCategories() {
  try {
    return apiFetch<Category[]>("/categories");
  } catch {
    return [];
  }
}
