"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { preventAdminShopping } from "@/lib/auth/guards";
import { addCartItem, updateCartItem } from "@/lib/cart/cart-service";

export async function addToCartAction(slug: string) {
  await preventAdminShopping();
  await addCartItem(slug, 1);
  revalidatePath("/cart");
}

export async function addToCartAndRedirectAction(slug: string) {
  await preventAdminShopping();
  await addCartItem(slug, 1);
  redirect("/cart");
}

export async function updateCartAction(formData: FormData) {
  await preventAdminShopping();
  const slug = String(formData.get("slug") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);

  await updateCartItem(slug, Number.isFinite(quantity) ? quantity : 0);
  revalidatePath("/cart");
}
