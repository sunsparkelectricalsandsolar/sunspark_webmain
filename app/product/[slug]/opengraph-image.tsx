import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getPrimaryImage, publicImageUrl } from "@/lib/products/images";
import { getProductBySlugStrict } from "@/lib/products/queries";
import { siteConfig } from "@/lib/site-config";

export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

function price(cents: number) {
  return `KSH ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(cents / 100)}`;
}

export default async function ProductOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlugStrict(slug);

  if (!product || !product.isActive) {
    notFound();
  }

  const image = getPrimaryImage(product.images);
  const imageUrl = image ? publicImageUrl(image.url) : `${siteConfig.url}/logo.jpg`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          background: "#fff7ed",
          color: "#172033",
          fontFamily: "Arial, sans-serif",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            width: "54%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff"
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={product.name}
            src={imageUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain"
            }}
          />
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "48px 54px",
            background: "linear-gradient(135deg, #0e52a4 0%, #0b3f7e 58%, #f36f21 160%)",
            color: "#ffffff"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", fontSize: 24, fontWeight: 800, opacity: 0.94 }}>
              {siteConfig.name}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: product.name.length > 60 ? 42 : 50,
                fontWeight: 900,
                lineHeight: 1.06,
                letterSpacing: 0
              }}
            >
              {product.name}
            </div>
            <div style={{ display: "flex", fontSize: 24, opacity: 0.9 }}>
              {product.category.name}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", fontSize: 46, fontWeight: 900 }}>{price(product.priceCents)}</div>
              <div style={{ display: "flex", fontSize: 21, opacity: 0.88 }}>WhatsApp {siteConfig.phone}</div>
            </div>
            <div
              style={{
                display: "flex",
                borderRadius: 999,
                background: "#ffffff",
                color: "#0e52a4",
                padding: "15px 22px",
                fontSize: 22,
                fontWeight: 900
              }}
            >
              View product
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
