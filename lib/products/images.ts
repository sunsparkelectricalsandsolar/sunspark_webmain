type ProductImageLike = {
  url: string;
  alt: string | null;
  isPrimary: boolean;
};

function imageBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.API_INTERNAL_URL ??
    "http://localhost:4000"
  ).replace(/\/+$/, "");
}

export function publicImageUrl(url: string | null | undefined) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads/")) return `${imageBaseUrl()}${url}`;
  if (url.startsWith("uploads/")) return `${imageBaseUrl()}/${url}`;
  return url;
}

export function getPrimaryImage(images: ProductImageLike[]) {
  return images.find((image) => image.isPrimary) ?? images[0] ?? null;
}
