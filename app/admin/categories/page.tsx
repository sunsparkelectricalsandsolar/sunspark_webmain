import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import { CategoryForm } from "@/components/admin/category-form";
import { createCategoryAction } from "@/app/admin/categories/actions";
import { requireAdmin } from "@/lib/auth/guards";
import { apiFetch, toQueryString } from "@/lib/api/client";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

const messages: Record<string, string> = {
  duplicate: "A category with that name already exists. Choose a different name.",
  image: "The image could not be uploaded. Use a JPEG, PNG, or WebP below 2 MB.",
  invalid: "Enter a category name with at least two characters.",
  save: "The category could not be saved. Please review the form and try again.",
  saved: "Category saved successfully."
};

export default async function AdminCategoriesPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; status?: string; error?: string; notice?: string }>;
}) {
  await requireAdmin("/admin/categories");
  const params = await searchParams;
  const categories = await getCategories({ q: params?.q, status: params?.status });
  const feedback = params?.error ? messages[params.error] : params?.notice ? messages[params.notice] : null;

  return (
    <AdminLayout title="Categories" subtitle="Homepage categories and their imagery are managed here.">
      {feedback ? <p className={params?.error ? "admin-feedback error" : "admin-feedback success"} role="status">{feedback}</p> : null}
      <form action="/admin/categories" className="admin-filter">
        <input name="q" defaultValue={params?.q ?? ""} placeholder="Search categories..." />
        <select name="status" defaultValue={params?.status ?? ""}>
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
        </select>
        <button type="submit">Filter</button>
      </form>
      <details className="admin-disclosure">
        <summary>Add category</summary>
        <CategoryForm action={createCategoryAction} />
      </details>
      <div className="admin-table">
        <div className="admin-table-row category-admin-row heading">
          <span>Category</span><span>Products</span><span>Images</span><span>Status</span><span>Updated</span><span />
        </div>
        {categories.map((category) => (
          <div className="admin-table-row category-admin-row" key={category.id}>
            <strong>{category.name}<small>{category.description ?? "No description"}</small></strong>
            <span>{category._count.products}</span>
            <span>{category.images.length}</span>
            <span><i className={category.isActive ? "status-dot active" : "status-dot"} />{category.isActive ? "Active" : "Hidden"}</span>
            <span>{new Date(category.updatedAt).toLocaleDateString("en-KE")}</span>
            <Link className="table-link" href={`/admin/categories/${category.id}/edit`}>Edit</Link>
          </div>
        ))}
        {!categories.length ? <p className="empty-state">No categories match this filter.</p> : null}
      </div>
    </AdminLayout>
  );
}

async function getCategories(input: { q?: string; status?: string }) {
  return apiFetch<(Category & { _count: { products: number } })[]>(`/admin/categories${toQueryString(input)}`);
}
