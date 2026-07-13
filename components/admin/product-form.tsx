import type { Category, Product, ProductImage } from "@/lib/types";
import { PendingButton } from "@/components/ui/pending-button";

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
    <form action={action} className="admin-form">
      <section className="form-section">
        <div className="form-section-heading">
          <h2>Catalogue details</h2>
          <p>Name, category, brand, and descriptions shown to customers.</p>
        </div>
        <div className="form-grid two">
          <label>
            Product name
            <input name="name" defaultValue={product?.name ?? ""} required />
          </label>
          <label>
            SKU
            <input name="sku" defaultValue={product?.sku ?? ""} />
            <small>Optional internal stock code, for example CAB-2.5-BLU-100.</small>
          </label>
        </div>
        <div className="form-grid two">
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
          <label>
            Brand
            <input name="brand" defaultValue={product?.brand ?? ""} placeholder="Optional, for example Schneider" />
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
      </section>

      <section className="form-section">
        <div className="form-section-heading">
          <h2>Pricing and stock</h2>
          <p>Buying cost stays private. Customers only see price and compare-at price.</p>
        </div>
        <div className="form-grid two">
          <label>
            Price (KSH)
            <input name="priceKsh" type="number" min="0" step="0.01" defaultValue={product ? product.priceCents / 100 : ""} required />
          </label>
          <label>
            Compare at (KSH)
            <input name="compareAtKsh" type="number" min="0" step="0.01" defaultValue={product?.compareAtCents ? product.compareAtCents / 100 : ""} />
          </label>
          <label>
            Buying cost (KSH, admin only)
            <input name="costKsh" type="number" min="0" step="0.01" defaultValue={product ? product.costCents / 100 : ""} />
          </label>
          <label>
            Selling unit
            <select defaultValue={product?.sellingUnit ?? "UNIT"} name="sellingUnit">
              <option value="UNIT">Unit / piece</option>
              <option value="METRE">Metre</option>
              <option value="ROLL">Roll</option>
              <option value="CARTON">Carton</option>
              <option value="BOX">Box</option>
              <option value="PACK">Pack</option>
              <option value="PAIR">Pair</option>
              <option value="SET">Set</option>
              <option value="LITRE">Litre</option>
              <option value="KILOGRAM">Kilogram</option>
            </select>
          </label>
          <label>
            Stock quantity
            <input name="stockQuantity" type="number" min="0" defaultValue={product?.stockQuantity ?? 0} required />
          </label>
          <label>
            Low stock threshold
            <input name="lowStockThreshold" type="number" min="0" defaultValue={product?.lowStockThreshold ?? 3} />
          </label>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-heading">
          <h2>Images</h2>
          <p>Upload clean product photos. JPEG, PNG, or WebP, each below 2MB.</p>
        </div>
        <label className="file-drop">
          Product images
          <input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple />
          <small>New uploads are stored on the backend server and linked to this product.</small>
        </label>
        {product?.images.length ? (
          <div className="admin-image-grid">
            {product.images.map((image) => (
              <div className="admin-image-card" key={image.id}>
                <img alt={image.alt ?? product.name} src={image.url} />
                <label>
                  <input name="primaryImageId" type="radio" value={image.id} defaultChecked={image.isPrimary} />
                  Primary
                </label>
                <label>
                  <input name="deleteImageIds" type="checkbox" value={image.id} />
                  Remove
                </label>
              </div>
            ))}
          </div>
        ) : null}
      </section>
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
      <PendingButton pendingText="Saving product...">Save product</PendingButton>
    </form>
  );
}
