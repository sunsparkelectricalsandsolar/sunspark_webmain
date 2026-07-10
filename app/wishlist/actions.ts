"use server";

import { redirect } from "next/navigation";
import { addWishlistItem } from "@/lib/wishlist/wishlist-service";

export async function addWishlistAction(slug: string) {
  await addWishlistItem(slug);
  redirect("/wishlist");
}
