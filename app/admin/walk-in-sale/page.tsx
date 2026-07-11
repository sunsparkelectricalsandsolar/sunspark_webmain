import { AdminLayout } from "@/components/admin/admin-layout";
import { WalkInSaleForm } from "@/components/admin/walk-in-sale-form";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { createWalkInSaleAction } from "./actions";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  details: "Enter the customer name and at least one product.",
  items: "Review the product quantities and try again.",
  payment: "Choose cash or M-Pesa for a walk-in sale.",
  stock: "One or more selected items are no longer available in the requested quantity."
};

export default async function WalkInSalePage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  await requireAdmin("/admin/walk-in-sale");
  const params = await searchParams;
  const products = await prisma.product.findMany({ where: { isActive: true, stockQuantity: { gt: 0 } }, select: { id: true, name: true, sku: true, priceCents: true, stockQuantity: true }, orderBy: { name: "asc" }, take: 500 });
  return <AdminLayout title="Walk-in Sale" subtitle="Record counter sales, update stock, and issue a receipt.">
    {params?.error && errors[params.error] ? <p className="admin-feedback error" role="alert">{errors[params.error]}</p> : null}
    <WalkInSaleForm action={createWalkInSaleAction} products={products} />
  </AdminLayout>;
}
