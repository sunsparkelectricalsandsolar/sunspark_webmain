import Link from "next/link";
import { clearSession } from "@/lib/auth/session";
import { requireCustomer } from "@/lib/auth/guards";
import { redirect } from "next/navigation";

async function logoutAction() {
  "use server";

  await clearSession();
  redirect("/");
}

export default async function AccountPage() {
  const user = await requireCustomer();

  return (
    <section className="section">
      <div className="container account-grid">
        <div>
          <p className="eyebrow">My Account</p>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
        <div className="account-panel">
          <Link href="/account/orders">Orders</Link>
          <Link href="/wishlist">Wishlist</Link>
          <Link href="/checkout">Checkout</Link>
          <form action={logoutAction}>
            <button className="secondary-btn" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
