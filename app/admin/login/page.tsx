import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { setSession } from "@/lib/auth/session";

async function adminLoginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeAdminPath(String(formData.get("next") ?? ""));
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.role !== "ADMIN" || !(await verifyPassword(password, user.passwordHash))) {
    redirect(`/admin/login?error=invalid${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  await setSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  redirect(next || "/admin");
}

export default async function AdminLoginPage({ searchParams }: { searchParams?: Promise<{ error?: string; next?: string }> }) {
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
          <button className="primary-btn" type="submit">
            Sign in
          </button>
        </form>
        {params?.error ? <p className="form-error" role="alert">Invalid admin credentials.</p> : null}
      </div>
    </section>
  );
}

function safeAdminPath(value: string) {
  return value.startsWith("/admin") && !value.startsWith("//") ? value : "";
}
