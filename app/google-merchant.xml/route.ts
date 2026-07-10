import { prisma } from "@/lib/db";
import { buildMerchantFeed } from "@/lib/merchant/feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: { select: { name: true } },
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
      }
    },
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }]
  });

  return new Response(buildMerchantFeed(products), {
    headers: {
      "Cache-Control": "public, max-age=1800, s-maxage=1800",
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}
