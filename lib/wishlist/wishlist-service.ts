import "server-only";

import { cookies } from "next/headers";

const wishlistCookie = "sunspark_wishlist";

async function readWishlist() {
  const cookieStore = await cookies();
  const value = cookieStore.get(wishlistCookie)?.value;

  if (!value) {
    return [];
  }

  try {
    return (JSON.parse(value) as string[]).filter(Boolean);
  } catch {
    return [];
  }
}

export async function addWishlistItem(slug: string) {
  const cookieStore = await cookies();
  const items = new Set(await readWishlist());
  items.add(slug);
  cookieStore.set(wishlistCookie, JSON.stringify([...items]), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90
  });
}

export async function getWishlistSlugs() {
  return readWishlist();
}
