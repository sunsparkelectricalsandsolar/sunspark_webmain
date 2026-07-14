import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdmin } from "@/lib/auth/guards";
import { apiFetch, toQueryString } from "@/lib/api/client";
import { productUrl } from "@/lib/merchant/feed";
import { formatMoney } from "@/lib/money";
import { deleteProductAction, hideProductAction } from "./actions";
import type { Category, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const messages: Record<string, string> = {
  deleted: "Product deleted.",
  hidden: "Product hidden from the storefront.",
  delete: "The product could not be deleted. Please try again.",
  "delete-linked": "This product is used on an invoice or quotation. Hide it instead, or remove it from those documents first."
};

export default async function AdminProductsPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; category?: string; status?: string; page?: string; error?: string; notice?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const allProducts = await getProducts({
    category: params?.category,
    q: params?.q,
    status: params?.status
  });
  const perPage = 25;
  const page = Math.min(Math.max(Number(params?.page ?? 1) || 1, 1), Math.max(Math.ceil(allProducts.length / perPage), 1));
  const products = allProducts.slice((page - 1) * perPage, page * perPage);
  const pageCount = Math.max(Math.ceil(allProducts.length / perPage), 1);
  const categories = await getCategories();
  const feedback = params?.error ? messages[params.error] : params?.notice ? messages[params.notice] : null;

  return (
    <AdminLayout
      title="Products"
      subtitle="Manage product pricing, stock, status, and images."
      actions={
        <Link className="primary-btn" href="/admin/products/new">
          Add product
        </Link>
      }
    >
        {feedback ? <p className={params?.error ? "admin-feedback error" : "admin-feedback success"} role="status">{feedback}</p> : null}
        <form action="/admin/products" className="admin-filter">
          <input name="q" defaultValue={params?.q ?? ""} placeholder="Search product, brand, description..." />
          <select name="category" defaultValue={params?.category ?? ""}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option value={category.slug} key={category.id}>{category.name}</option>
            ))}
          </select>
          <select name="status" defaultValue={params?.status ?? ""}>
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
            <option value="low">Low stock</option>
          </select>
          <button type="submit">Filter</button>
          <Link className="filter-reset" href="/admin/products">All products</Link>
        </form>
        <div className="admin-table product-admin-table">
          <div className="admin-table-row heading">
            <span>Product</span>
            <span>Category</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Status</span>
            <span></span>
          </div>
          {products.map((product) => (
            <div className="admin-table-row" key={product.id}>
              <strong>{product.name}</strong>
              <span>{product.category.name}</span>
              <span>{formatMoney(product.priceCents)}</span>
              <span>{product.stockQuantity}</span>
              <span className={product.isActive ? "status-pill active" : "status-pill"}>{product.isActive ? "Active" : "Hidden"}</span>
              <details className="row-action-menu">
                <summary>Actions</summary>
                <div>
                  <Link href={`/admin/products/${product.id}/edit`}>Edit product</Link>
                  <a href={productUrl(product.slug)} rel="noreferrer" target="_blank">Merchant link</a>
                  {product.isActive ? (
                    <form action={hideProductAction.bind(null, product.id)}>
                      <button type="submit" title="Hide from customers without deleting order history">Hide product</button>
                    </form>
                  ) : null}
                  <form action={deleteProductAction.bind(null, product.id)}>
                    <button className="danger-btn" type="submit">Delete product</button>
                  </form>
                </div>
              </details>
            </div>
          ))}
          {!allProducts.length ? <p className="empty-state">No products yet. Add the first Sunspark product.</p> : null}
        </div>
        {allProducts.length > perPage ? (
          <nav className="pagination" aria-label="Product pages">
            <Link className={page <= 1 ? "disabled" : ""} href={productPageHref(params, page - 1)}>Previous</Link>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((item) => (
              <Link className={item === page ? "active" : ""} href={productPageHref(params, item)} key={item}>{item}</Link>
            ))}
            <Link className={page >= pageCount ? "disabled" : ""} href={productPageHref(params, page + 1)}>Next</Link>
          </nav>
        ) : null}
    </AdminLayout>
  );
}

function productPageHref(
  params: { q?: string; category?: string; status?: string } | undefined,
  page: number
) {
  return `/admin/products${toQueryString({
    q: params?.q,
    category: params?.category,
    status: params?.status,
    page: Math.max(page, 1)
  })}`;
}

async function getProducts(input: { q?: string; category?: string; status?: string }) {
  const terms = input.q?.trim().split(/\s+/).filter(Boolean) ?? [];
  try {
    return apiFetch<Product[]>(`/admin/products${toQueryString({ q: terms.join(" "), category: input.category, status: input.status, limit: 2000 })}`);
  } catch {
    return [];
  }
}

async function getCategories() {
  try {
    return apiFetch<Category[]>("/admin/categories");
  } catch {
    return [];
  }
}
