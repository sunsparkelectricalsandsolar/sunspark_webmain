type ProductImageLike = {
  url: string;
  alt: string | null;
  isPrimary: boolean;
};

export function getPrimaryImage(images: ProductImageLike[]) {
  return images.find((image) => image.isPrimary) ?? images[0] ?? null;
}
