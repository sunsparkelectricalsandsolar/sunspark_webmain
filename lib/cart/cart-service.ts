import "server-only";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const cartCookie = "sunspark_cart";

export type CartCookieItem = {
  slug: string;
  quantity: number;
};

async function readCartCookie(): Promise<CartCookieItem[]> {
  const cookieStore = await cookies();
  const value = cookieStore.get(cartCookie)?.value;

  if (!value) {
    return [];
  }

  try {
    const items = JSON.parse(value) as CartCookieItem[];
    return items.filter((item) => item.slug && item.quantity > 0);
  } catch {
    return [];
  }
}

async function writeCartCookie(items: CartCookieItem[]) {
  const cookieStore = await cookies();
  cookieStore.set(cartCookie, JSON.stringify(items), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function addCartItem(slug: string, quantity = 1) {
  const items = await readCartCookie();
  const existing = items.find((item) => item.slug === slug);

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ slug, quantity });
  }

  await writeCartCookie(items);
}

export async function updateCartItem(slug: string, quantity: number) {
  const items = await readCartCookie();
  const nextItems = quantity <= 0 ? items.filter((item) => item.slug !== slug) : items.map((item) => item.slug === slug ? { ...item, quantity } : item);
  await writeCartCookie(nextItems);
}

export async function clearCart() {
  const cookieStore = await cookies();
  cookieStore.delete(cartCookie);
}

export async function getCart() {
  const items = await readCartCookie();

  if (!items.length) {
    return { items: [], subtotalCents: 0 };
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        slug: { in: items.map((item) => item.slug) },
        isActive: true
      },
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] },
        category: true
      }
    });

    const cartItems = items.flatMap((item) => {
      const product = products.find((candidate) => candidate.slug === item.slug);

      if (!product) {
        return [];
      }

      const quantity = Math.min(item.quantity, Math.max(product.stockQuantity, 0));
      return quantity > 0
        ? [
            {
              product,
              quantity,
              lineTotalCents: product.priceCents * quantity
            }
          ]
        : [];
    });

    return {
      items: cartItems,
      subtotalCents: cartItems.reduce((total, item) => total + item.lineTotalCents, 0)
    };
  } catch {
    return { items: [], subtotalCents: 0 };
  }
}
