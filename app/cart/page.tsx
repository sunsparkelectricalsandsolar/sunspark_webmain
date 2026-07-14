import Image from "next/image";
import Link from "next/link";
import { updateCartAction } from "@/app/cart/actions";
import { PendingButton } from "@/components/ui/pending-button";
import { formatMoney } from "@/lib/money";
import { getPrimaryImage, publicImageUrl } from "@/lib/products/images";
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
                  <article className="cart-row" key={`${item.product.id}-${item.option?.id ?? "default"}`}>
                    <Link className="cart-thumb" href={`/product/${item.product.slug}`}>
                      {image ? (
                        <Image src={publicImageUrl(image.url)} alt={image.alt ?? item.product.name} fill sizes="90px" />
                      ) : (
                        <span>No image</span>
                      )}
                    </Link>
                    <div className="cart-item-main">
                      <Link href={`/product/${item.product.slug}`}>
                        <h2>{item.product.name}</h2>
                      </Link>
                      <p>
                        {item.option ? <small>{item.option.label}</small> : null}
                        <span>{formatMoney(item.option?.priceCents ?? item.product.priceCents)}</span>
                        <small> each</small>
                      </p>
                    </div>
                    <div className="cart-stepper" aria-label={`Quantity for ${item.product.name}`}>
                      <form action={updateCartAction}>
                        <input name="slug" type="hidden" value={item.product.slug} />
                        <input name="optionId" type="hidden" value={item.option?.id ?? ""} />
                        <input name="quantity" type="hidden" value={Math.max(0, item.quantity - 1)} />
                        <PendingButton aria-label={`Reduce ${item.product.name}`} pendingText="...">-</PendingButton>
                      </form>
                      <strong>{item.quantity}</strong>
                      <form action={updateCartAction}>
                        <input name="slug" type="hidden" value={item.product.slug} />
                        <input name="optionId" type="hidden" value={item.option?.id ?? ""} />
                        <input name="quantity" type="hidden" value={item.quantity + 1} />
                        <PendingButton aria-label={`Add one ${item.product.name}`} pendingText="...">+</PendingButton>
                      </form>
                    </div>
                    <div className="cart-line-total">
                      <span>Total</span>
                      <strong>{formatMoney(item.lineTotalCents)}</strong>
                    </div>
                    <form action={updateCartAction} className="cart-remove">
                      <input name="slug" type="hidden" value={item.product.slug} />
                      <input name="optionId" type="hidden" value={item.option?.id ?? ""} />
                      <input name="quantity" type="hidden" value="0" />
                      <PendingButton pendingText="Removing...">Remove</PendingButton>
                    </form>
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
