import { checkoutAction } from "@/app/checkout/actions";
import { LocationPicker } from "@/components/site/location-picker";
import { PendingButton } from "@/components/ui/pending-button";
import { preventAdminShopping } from "@/lib/auth/guards";
import { getCart } from "@/lib/cart/cart-service";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  await preventAdminShopping();
  const cart = await getCart();

  return (
    <section className="section">
      <div className="container checkout-layout">
        <div>
          <div className="section-title">
            <h3>Checkout</h3>
          </div>
          <form action={checkoutAction} className="admin-form">
            <label>
              Name
              <input name="customerName" required />
            </label>
            <label>
              Email
              <input name="customerEmail" type="email" required />
            </label>
            <label>
              Phone
              <input name="customerPhone" />
            </label>
            <label>
              Delivery note
              <textarea name="deliveryNote" rows={4} />
            </label>
            <LocationPicker />
            <label>
              Payment method
              <select name="paymentMethod" defaultValue="WHATSAPP">
                <option value="WHATSAPP">WhatsApp checkout</option>
                <option value="MPESA">M-Pesa</option>
              </select>
            </label>
            <PendingButton disabled={!cart.items.length} pendingText="Submitting order...">Place order</PendingButton>
          </form>
        </div>
        <aside className="order-summary">
          <h2>Order Summary</h2>
          {cart.items.map((item) => (
            <div className="summary-line" key={item.product.id}>
              <span>
                {item.product.name} x{item.quantity}
              </span>
              <strong>{formatMoney(item.lineTotalCents)}</strong>
            </div>
          ))}
          <div className="summary-line total">
            <span>Total</span>
            <strong>{formatMoney(cart.subtotalCents)}</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}
