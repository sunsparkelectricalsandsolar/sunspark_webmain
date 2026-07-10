import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { setSession } from "@/lib/auth/session";

async function loginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=invalid");
  }

  await setSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  redirect("/account");
}

export default function LoginPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  return (
    <section className="section auth-section">
      <div className="auth-card">
        <h1>Customer Login</h1>
        <p>Sign in to manage orders, invoices, cart, and wishlist.</p>
        <form action={loginAction} className="stack-form">
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" required />
          </label>
          <button className="primary-btn" type="submit">
            Sign in
          </button>
        </form>
        <AuthError searchParams={searchParams} />
        <Link href="/register">Create an account</Link>
      </div>
    </section>
  );
}

async function AuthError({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return params?.error ? <p className="form-error">Invalid email or password.</p> : null;
}
