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
    <form action={action} className="product-editor">
      <div className="product-editor-main">
        <section className="editor-card">
          <div className="editor-card-heading">
            <span>01</span>
            <div>
              <h2>Product information</h2>
              <p>Core details customers use to understand and find this product.</p>
            </div>
          </div>
          <label className="field-wide">
            Product name
            <input name="name" defaultValue={product?.name ?? ""} required />
          </label>
          <div className="form-grid two">
            <label>
              Category
              <select name="categoryId" defaultValue={product?.categoryId ?? ""} required>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option value={category.id} key={category.id}>{category.name}</option>
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
            <textarea name="description" defaultValue={product?.description ?? ""} rows={7} />
          </label>
        </section>

        <section className="editor-card">
          <div className="editor-card-heading">
            <span>02</span>
            <div>
              <h2>Product gallery</h2>
              <p>Use clean photos with enough contrast. WebP, PNG, or JPEG under 2MB each.</p>
            </div>
          </div>
          <label className="file-drop product-file-drop">
            <strong>Add product images</strong>
            <input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple />
            <small>Uploads are stored on the HostAfrica backend and linked to this product.</small>
          </label>
          {product?.images.length ? (
            <div className="admin-image-grid product-image-manager">
              {product.images.map((image) => (
                <div className="admin-image-card" key={image.id}>
                  <img alt={image.alt ?? product.name} src={image.url} />
                  <div className="image-card-controls">
                    <label className="check-label">
                      <input name="primaryImageId" type="radio" value={image.id} defaultChecked={image.isPrimary} />
                      Cover
                    </label>
                    <label className="check-label danger-label">
                      <input name="deleteImageIds" type="checkbox" value={image.id} />
                      Remove
                    </label>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="editor-empty">No product images yet.</p>
          )}
        </section>

        <details className="editor-card seo-card">
          <summary>Search engine details</summary>
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
      </div>

      <aside className="product-editor-side">
        <section className="editor-card publish-card">
          <div className="editor-card-heading compact">
            <div>
              <h2>Publish</h2>
              <p>Visibility and promotional labels.</p>
            </div>
          </div>
          <label className="check-label form-switch">
            <input name="isActive" type="checkbox" defaultChecked={product?.isActive ?? true} />
            <span><strong>Active</strong><small>Visible to customers.</small></span>
          </label>
          <label className="check-label form-switch">
            <input name="isFeatured" type="checkbox" defaultChecked={product?.isFeatured ?? false} />
            <span><strong>Featured</strong><small>Prioritize in product rows.</small></span>
          </label>
          <label className="check-label form-switch">
            <input name="isHotDeal" type="checkbox" defaultChecked={product?.isHotDeal ?? false} />
            <span><strong>Hot deal</strong><small>Show deal badge.</small></span>
          </label>
        </section>

        <section className="editor-card">
          <div className="editor-card-heading compact">
            <div>
              <h2>Pricing</h2>
              <p>Customer price and private cost.</p>
            </div>
          </div>
          <label>
            Price (KSH)
            <input name="priceKsh" type="number" min="0" step="0.01" defaultValue={product ? product.priceCents / 100 : ""} required />
          </label>
          <label>
            Compare at (KSH)
            <input name="compareAtKsh" type="number" min="0" step="0.01" defaultValue={product?.compareAtCents ? product.compareAtCents / 100 : ""} />
          </label>
          <label>
            Buying cost (admin only)
            <input name="costKsh" type="number" min="0" step="0.01" defaultValue={product ? product.costCents / 100 : ""} />
          </label>
        </section>

        <section className="editor-card">
          <div className="editor-card-heading compact">
            <div>
              <h2>Inventory</h2>
              <p>Stock, SKU, and selling unit.</p>
            </div>
          </div>
          <label>
            SKU
            <input name="sku" defaultValue={product?.sku ?? ""} />
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
          <div className="form-grid two tight">
            <label>
              Stock
              <input name="stockQuantity" type="number" min="0" defaultValue={product?.stockQuantity ?? 0} required />
            </label>
            <label>
              Low alert
              <input name="lowStockThreshold" type="number" min="0" defaultValue={product?.lowStockThreshold ?? 3} />
            </label>
          </div>
        </section>

        <div className="editor-submit-bar">
          <PendingButton pendingText="Saving product...">{product ? "Save changes" : "Create product"}</PendingButton>
        </div>
      </aside>
    </form>
  );
}
