"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { getPrimaryImage } from "@/lib/products/images";

type GalleryImage = {
  url: string;
  alt: string | null;
  isPrimary: boolean;
};

export function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const primary = useMemo(() => getPrimaryImage(images), [images]);
  const [activeUrl, setActiveUrl] = useState(primary?.url ?? null);
  const active = images.find((image) => image.url === activeUrl) ?? primary;

  return (
    <div className="product-gallery">
      <div className="gallery-main">
        {active ? (
          <Image src={active.url} alt={active.alt ?? name} fill sizes="(max-width: 860px) 100vw, 50vw" priority />
        ) : (
          <span>No product image</span>
        )}
      </div>
      {images.length > 1 ? (
        <div className="gallery-thumbs" aria-label="Product images">
          {images.map((image) => (
            <button
              aria-label={`Show ${image.alt ?? name}`}
              className={image.url === active?.url ? "active" : ""}
              key={image.url}
              onClick={() => setActiveUrl(image.url)}
              type="button"
            >
              <Image src={image.url} alt={image.alt ?? name} fill sizes="96px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
