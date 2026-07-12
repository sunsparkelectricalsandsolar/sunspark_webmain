import Image from "next/image";
import Link from "next/link";
import { updateCartAction } from "@/app/cart/actions";
import { PendingButton } from "@/components/ui/pending-button";
import { formatMoney } from "@/lib/money";
import { getPrimaryImage } from "@/lib/products/images";
import { getCart } from "@/lib/cart/cart-service";
import { preventAdminShopping } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  await preventAdminShopping();
  const cart = await getCart();

  return (
    <section className="section">
      <div className="container checkout-layout">
        <div>
          <div className="section-title">
            <h3>Shopping Cart</h3>
          </div>
          {cart.items.length ? (
            <div className="cart-list-page">
              {cart.items.map((item) => {
                const image = getPrimaryImage(item.product.images);
                return (
                  <article className="cart-row" key={item.product.id}>
                    <Link className="cart-thumb" href={`/product/${item.product.slug}`}>
                      {image ? (
                        <Image src={image.url} alt={image.alt ?? item.product.name} fill sizes="90px" />
                      ) : (
                        <span>No image</span>
                      )}
                    </Link>
                    <div>
                      <h2>{item.product.name}</h2>
                      <p>{formatMoney(item.product.priceCents)}</p>
                    </div>
                    <form action={updateCartAction} className="cart-qty">
                      <input name="slug" type="hidden" value={item.product.slug} />
                      <input min="0" name="quantity" type="number" defaultValue={item.quantity} />
                      <PendingButton className="" pendingText="Updating...">Update</PendingButton>
                    </form>
                    <strong>{formatMoney(item.lineTotalCents)}</strong>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-products">
              <h2>Your cart is empty</h2>
              <Link className="primary-btn" href="/store">
                Continue shopping
              </Link>
            </div>
          )}
        </div>
        <aside className="order-summary">
          <h2>Cart Summary</h2>
          <div className="summary-line">
            <span>Subtotal</span>
            <strong>{formatMoney(cart.subtotalCents)}</strong>
          </div>
          <Link className="primary-btn" href="/checkout">
            Checkout
          </Link>
        </aside>
      </div>
    </section>
  );
}
