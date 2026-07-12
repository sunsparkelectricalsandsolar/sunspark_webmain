import Link from "next/link";
import { redirect } from "next/navigation";
import { PendingButton } from "@/components/ui/pending-button";
import { apiFetch, ApiError } from "@/lib/api/client";
import { setSession } from "@/lib/auth/session";
import type { PublicUser } from "@/lib/types";

async function adminLoginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeAdminPath(String(formData.get("next") ?? ""));
  let user: PublicUser;

  try {
    const result = await apiFetch<{ user: PublicUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    user = result.user;
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    redirect(`/admin/login?error=invalid${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  if (user.role !== "ADMIN") {
    redirect(`/admin/login?error=invalid${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  await setSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  redirect(next || "/admin");
}

export default async function AdminLoginPage({ searchParams }: { searchParams?: Promise<{ error?: string; next?: string; reset?: string }> }) {
  const params = await searchParams;
  const next = safeAdminPath(params?.next ?? "");
  return (
    <section className="section auth-section">
      <div className="auth-card">
        <h1>Admin Login</h1>
        <p>Sign in to manage products, orders, stock, invoices, and checkout settings.</p>
        <form action={adminLoginAction} className="stack-form">
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
        {params?.error ? <p className="form-error" role="alert">Invalid admin credentials.</p> : null}
        {params?.reset ? <p className="form-success" role="status">Password updated. You can sign in now.</p> : null}
        <div className="auth-links">
          <Link href="/forgot-password">Forgot password?</Link>
        </div>
      </div>
    </section>
  );
}

function safeAdminPath(value: string) {
  return value.startsWith("/admin") && !value.startsWith("//") ? value : "";
}
