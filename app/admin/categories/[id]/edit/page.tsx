import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { CategoryForm } from "@/components/admin/category-form";
import { updateCategoryAction } from "@/app/admin/categories/actions";
import { requireAdmin } from "@/lib/auth/guards";
import { apiFetch } from "@/lib/api/client";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

const messages: Record<string, string> = {
  duplicate: "A category with that name already exists. Choose a different name.",
  image: "The image could not be uploaded. Use a JPEG, PNG, or WebP below 2 MB.",
  invalid: "Enter a category name with at least two characters."
};

export default async function EditCategoryPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  await requireAdmin(`/admin/categories/${id}/edit`);
  const category = await apiFetch<Category>(`/admin/categories/${id}`).catch(() => null);

  if (!category) notFound();

  return (
    <AdminLayout title="Edit Category" subtitle={`Update ${category.name} and the homepage category card.`}>
      <div className="admin-shell narrow">
        {query?.error && messages[query.error] ? <p className="admin-feedback error" role="alert">{messages[query.error]}</p> : null}
        <CategoryForm action={updateCategoryAction.bind(null, category.id)} cancelHref="/admin/categories" category={category} />
      </div>
    </AdminLayout>
  );
}
