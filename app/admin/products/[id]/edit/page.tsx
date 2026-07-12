import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth/guards";
import { apiFetch } from "@/lib/api/client";
import type { Category, Product } from "@/lib/types";
import { updateProductAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [product, categories] = await Promise.all([getProduct(id), getCategories()]);

  if (!product) {
    notFound();
  }

  return (
    <AdminLayout title="Edit Product" subtitle={product.name}>
      <div className="admin-shell narrow">
        <ProductForm action={updateProductAction.bind(null, product.id)} categories={categories} product={product} />
      </div>
    </AdminLayout>
  );
}

async function getProduct(id: string) {
  try {
    return apiFetch<Product>(`/admin/products/${id}`);
  } catch {
    return null;
  }
}

async function getCategories() {
  try {
    return apiFetch<Category[]>("/categories");
  } catch {
    return [];
  }
}
