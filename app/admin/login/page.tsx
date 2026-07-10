import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { setSession } from "@/lib/auth/session";

async function adminLoginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.role !== "ADMIN" || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/admin/login?error=invalid");
  }

  await setSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  redirect("/admin");
}

export default function AdminLoginPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  return (
    <section className="section auth-section">
      <div className="auth-card">
        <h1>Admin Login</h1>
        <p>Initial setup uses admin@sunspark.co.ke and Password. Change it before launch.</p>
        <form action={adminLoginAction} className="stack-form">
          <label>
            Email
            <input name="email" type="email" defaultValue="admin@sunspark.co.ke" required />
          </label>
          <label>
            Password
            <input name="password" type="password" required />
          </label>
          <button className="primary-btn" type="submit">
            Sign in
          </button>
        </form>
        <AdminAuthError searchParams={searchParams} />
      </div>
    </section>
  );
}

async function AdminAuthError({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return params?.error ? <p className="form-error">Invalid admin credentials.</p> : null;
}
