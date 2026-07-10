import type { Category, Product, ProductImage } from "@prisma/client";

type ProductWithImages = Product & {
  images: ProductImage[];
};

export function ProductForm({
  action,
  categories,
  product
}: {
  action: (formData: FormData) => Promise<void>;
  categories: Category[];
  product?: ProductWithImages | null;
}) {
  return (
    <form action={action} className="admin-form" encType="multipart/form-data">
      <div className="form-grid two">
        <label>
          Product name
          <input name="name" defaultValue={product?.name ?? ""} required />
        </label>
        <label>
          SKU
          <input name="sku" defaultValue={product?.sku ?? ""} required />
        </label>
      </div>
      <label>
        Category
        <select name="categoryId" defaultValue={product?.categoryId ?? ""} required>
          <option value="">Select category</option>
          {categories.map((category) => (
            <option value={category.id} key={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <div className="form-grid two">
        <label>
          Price (KSH)
          <input
            name="priceKsh"
            type="number"
            min="0"
            step="0.01"
            defaultValue={product ? product.priceCents / 100 : ""}
            required
          />
        </label>
        <label>
          Compare at (KSH)
          <input
            name="compareAtKsh"
            type="number"
            min="0"
            step="0.01"
            defaultValue={product?.compareAtCents ? product.compareAtCents / 100 : ""}
          />
        </label>
      </div>
      <div className="form-grid two">
        <label>
          Stock quantity
          <input name="stockQuantity" type="number" min="0" defaultValue={product?.stockQuantity ?? 0} required />
        </label>
        <label>
          Low stock threshold
          <input name="lowStockThreshold" type="number" min="0" defaultValue={product?.lowStockThreshold ?? 3} />
        </label>
      </div>
      <label>
        Short description
        <textarea name="shortDescription" defaultValue={product?.shortDescription ?? ""} rows={3} />
      </label>
      <label>
        Full description
        <textarea name="description" defaultValue={product?.description ?? ""} rows={6} />
      </label>
      <label>
        Product images
        <input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple />
      </label>
      {product?.images.length ? (
        <div className="admin-image-list">
          {product.images.map((image) => (
            <span key={image.id}>{image.url}</span>
          ))}
        </div>
      ) : null}
      <div className="form-grid three">
        <label className="check-label">
          <input name="isActive" type="checkbox" defaultChecked={product?.isActive ?? true} />
          Active
        </label>
        <label className="check-label">
          <input name="isFeatured" type="checkbox" defaultChecked={product?.isFeatured ?? false} />
          Featured
        </label>
        <label className="check-label">
          <input name="isHotDeal" type="checkbox" defaultChecked={product?.isHotDeal ?? false} />
          Hot deal
        </label>
      </div>
      <details>
        <summary>SEO</summary>
        <label>
          SEO title
          <input name="seoTitle" defaultValue={product?.seoTitle ?? ""} />
        </label>
        <label>
          SEO description
          <textarea name="seoDescription" defaultValue={product?.seoDescription ?? ""} rows={3} />
        </label>
        <label>
          SEO keywords
          <input name="seoKeywords" defaultValue={product?.seoKeywords ?? ""} />
        </label>
      </details>
      <button className="primary-btn" type="submit">
        Save product
      </button>
    </form>
  );
}
