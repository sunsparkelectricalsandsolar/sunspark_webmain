import Link from "next/link";
import type { Category, CategoryImage } from "@prisma/client";

type CategoryWithImages = Category & { images: CategoryImage[] };

export function CategoryForm({
  action,
  cancelHref,
  category
}: {
  action: (formData: FormData) => Promise<void>;
  cancelHref?: string;
  category?: CategoryWithImages;
}) {
  const isEditing = Boolean(category);

  return (
    <form action={action} className="admin-form category-form">
      <div className="form-grid two">
        <label>
          Category name
          <input defaultValue={category?.name ?? ""} name="name" required />
        </label>
        <label>
          Display order
          <input defaultValue={category?.sortOrder ?? 10} min="0" name="sortOrder" type="number" />
        </label>
      </div>
      <label>
        Customer-facing description
        <textarea defaultValue={category?.description ?? ""} name="description" rows={3} />
      </label>
      <label className="check-label form-switch">
        <input defaultChecked={category?.isActive ?? true} name="isActive" type="checkbox" />
        <span><strong>Show on storefront</strong><small>Visible on the homepage and in customer navigation.</small></span>
      </label>
      <label>
        {isEditing ? "Add more category images" : "Category images"}
        <input accept="image/jpeg,image/png,image/webp" multiple name="images" type="file" />
        <small>JPEG, PNG, or WebP. Each image must be below 2 MB.</small>
      </label>
      {category?.images.length ? (
        <div className="admin-image-grid">
          {category.images.map((image) => (
            <div className="admin-image-card" key={image.id}>
              <img alt={image.alt ?? category.name} src={image.url} />
              <label className="check-label">
                <input defaultChecked={image.isPrimary} name="primaryImageId" type="radio" value={image.id} />
                Cover image
              </label>
              <label className="check-label danger-label">
                <input name="deleteImageIds" type="checkbox" value={image.id} />
                Remove image
              </label>
            </div>
          ))}
        </div>
      ) : null}
      <div className="admin-form-actions">
        <button className="primary-btn" type="submit">{isEditing ? "Save changes" : "Create category"}</button>
        {cancelHref ? <Link className="secondary-btn" href={cancelHref}>Cancel</Link> : null}
      </div>
    </form>
  );
}
