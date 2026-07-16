import Link from "next/link";
import type { ReactNode } from "react";
import { adminLogoutAction } from "@/app/admin/logout-action";
import { AdminBackButton } from "@/components/admin/admin-back-button";
import { getSession } from "@/lib/auth/session";
import { canManageCatalog } from "@/lib/auth/roles";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/products/new", label: "Add Product", ownerOnly: true },
  { href: "/admin/walk-in-sale", label: "Walk-in Sale" },
  { href: "/admin/invoices", label: "Invoices & Quotes" },
  { href: "/admin/categories", label: "Categories", ownerOnly: true },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/campaigns", label: "Campaigns", ownerOnly: true },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/settings", label: "Settings", ownerOnly: true }
];

export async function AdminLayout({
  actions,
  children,
  subtitle,
  title
}: {
  actions?: ReactNode;
  children: ReactNode;
  subtitle?: string;
  title: string;
}) {
  const session = await getSession();
  const links = adminLinks.filter((link) => !link.ownerOnly || canManageCatalog(session?.role));

  return (
    <section className="admin-page">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          <span>Sunspark</span>
          <small>Admin</small>
        </Link>
        <details className="admin-mobile-menu">
          <summary aria-label="Open admin menu">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </summary>
          <div className="admin-mobile-panel">
            <nav aria-label="Admin mobile navigation">
              {links.map((link) => (
                <Link href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <form action={adminLogoutAction} className="admin-mobile-logout">
              <button type="submit">Log out</button>
            </form>
          </div>
        </details>
        <nav aria-label="Admin navigation">
          {links.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <form action={adminLogoutAction} className="admin-logout">
          <button type="submit">Log out</button>
        </form>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <AdminBackButton />
            <div>
              <p className="eyebrow">Admin</p>
              <h1>{title}</h1>
              {subtitle ? <p>{subtitle}</p> : null}
            </div>
          </div>
          {actions ? <div className="admin-topbar-actions">{actions}</div> : null}
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </section>
  );
}
