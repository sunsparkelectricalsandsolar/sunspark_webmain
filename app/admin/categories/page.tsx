import { AdminLayout } from "@/components/admin/admin-layout";
import { createCategoryAction, updateCategoryAction } from "@/app/admin/categories/actions";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <AdminLayout title="Categories" subtitle="Categories added here show on the homepage and can hold products immediately.">
        <form action={createCategoryAction} className="admin-form category-admin-form" encType="multipart/form-data">
          <div className="form-grid three">
            <label>
              Name
              <input name="name" required />
            </label>
            <label>
              Sort order
              <input name="sortOrder" type="number" defaultValue="10" />
            </label>
            <label className="check-label">
              <input name="isActive" type="checkbox" defaultChecked />
              Active
            </label>
          </div>
          <label>
            Description
            <input name="description" />
          </label>
          <label>
            Category images
            <input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple />
            <small>JPEG, PNG, or WebP. Each image must be below 2MB.</small>
          </label>
          <button className="primary-btn" type="submit">
            Add category
          </button>
        </form>
        <div className="category-admin-list">
          {categories.map((category) => (
            <form
              action={updateCategoryAction.bind(null, category.id)}
              className="admin-form"
              encType="multipart/form-data"
              key={category.id}
            >
              <div className="form-grid three">
                <label>
                  Name
                  <input name="name" defaultValue={category.name} required />
                </label>
                <label>
                  Sort order
                  <input name="sortOrder" type="number" defaultValue={category.sortOrder} />
                </label>
                <label className="check-label">
                  <input name="isActive" type="checkbox" defaultChecked={category.isActive} />
                  Active
                </label>
              </div>
              <label>
                Description
                <input name="description" defaultValue={category.description ?? ""} />
              </label>
              <label>
                Add images
                <input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple />
              </label>
              {category.images.length ? (
                <div className="admin-image-grid">
                  {category.images.map((image) => (
                    <div className="admin-image-card" key={image.id}>
                      <img alt={image.alt ?? category.name} src={image.url} />
                      <label>
                        <input name="primaryImageId" type="radio" value={image.id} defaultChecked={image.isPrimary} />
                        Primary
                      </label>
                      <label>
                        <input name="deleteImageIds" type="checkbox" value={image.id} />
                        Delete
                      </label>
                    </div>
                  ))}
                </div>
              ) : null}
              <button className="secondary-btn" type="submit">
                Save category
              </button>
            </form>
          ))}
        </div>
    </AdminLayout>
  );
}

async function getCategories() {
  try {
    return prisma.category.findMany({
      where: { parentId: null },
      include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    });
  } catch {
    return [];
  }
}
