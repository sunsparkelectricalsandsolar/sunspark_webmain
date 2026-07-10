import { createCategoryAction, updateCategoryAction } from "@/app/admin/categories/actions";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <section className="section">
      <div className="container admin-shell">
        <div className="admin-heading">
          <p className="eyebrow">Admin</p>
          <h1>Categories</h1>
          <p>Categories added here show on the homepage and can hold products immediately.</p>
        </div>
        <form action={createCategoryAction} className="admin-form category-admin-form">
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
          <button className="primary-btn" type="submit">
            Add category
          </button>
        </form>
        <div className="category-admin-list">
          {categories.map((category) => (
            <form action={updateCategoryAction.bind(null, category.id)} className="admin-form" key={category.id}>
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
              <button className="secondary-btn" type="submit">
                Save category
              </button>
            </form>
          ))}
        </div>
      </div>
    </section>
  );
}

async function getCategories() {
  try {
    return prisma.category.findMany({
      where: { parentId: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    });
  } catch {
    return [];
  }
}
