import Link from "next/link";
import { redirect } from "next/navigation";
import { PendingButton } from "@/components/ui/pending-button";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { setSession } from "@/lib/auth/session";

async function loginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeCustomerPath(String(formData.get("next") ?? ""));
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect(`/login?error=invalid${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  await setSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  redirect(next || "/account");
}

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ error?: string; next?: string; reset?: string }> }) {
  const params = await searchParams;
  const next = safeCustomerPath(params?.next ?? "");
  return (
    <section className="section auth-section">
      <div className="auth-card">
        <h1>Customer Login</h1>
        <p>Sign in to manage orders, invoices, cart, and wishlist.</p>
        <form action={loginAction} className="stack-form">
          {next ? <input name="next" type="hidden" value={next} /> : null}
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" required />
          </label>
          <PendingButton pendingText="Signing in...">Sign in</PendingButton>
        </form>
        {params?.error ? <p className="form-error" role="alert">Invalid email or password.</p> : null}
        {params?.reset ? <p className="form-success" role="status">Password updated. You can sign in now.</p> : null}
        <div className="auth-links">
          <Link href="/forgot-password">Forgot password?</Link>
          <Link href="/register">Create an account</Link>
        </div>
      </div>
    </section>
  );
}

function safeCustomerPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/admin") ? value : "";
}
