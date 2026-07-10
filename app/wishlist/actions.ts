"use server";

import { redirect } from "next/navigation";
import { preventAdminShopping } from "@/lib/auth/guards";
import { addWishlistItem } from "@/lib/wishlist/wishlist-service";

export async function addWishlistAction(slug: string) {
  await preventAdminShopping();
  await addWishlistItem(slug);
  redirect("/wishlist");
}
