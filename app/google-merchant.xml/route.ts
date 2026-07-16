import { apiFetch } from "@/lib/api/client";
import { buildMerchantFeed } from "@/lib/merchant/feed";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await apiFetch<Product[]>("/products?limit=2000");

  return new Response(buildMerchantFeed(products), {
    headers: {
      "Cache-Control": "public, max-age=1800, s-maxage=1800",
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}
