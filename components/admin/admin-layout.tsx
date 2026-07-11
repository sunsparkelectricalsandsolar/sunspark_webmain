import Link from "next/link";
import type { ReactNode } from "react";
import { adminLogoutAction } from "@/app/admin/logout-action";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/products/new", label: "Add Product" },
  { href: "/admin/walk-in-sale", label: "Walk-in Sale" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/campaigns", label: "Campaigns" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/settings", label: "Settings" }
];

export function AdminLayout({
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
  return (
    <section className="admin-page">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          <span>Sunspark</span>
          <small>Admin</small>
        </Link>
        <nav aria-label="Admin navigation">
          {adminLinks.map((link) => (
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
          <div>
            <p className="eyebrow">Admin</p>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {actions ? <div className="admin-topbar-actions">{actions}</div> : null}
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </section>
  );
}
