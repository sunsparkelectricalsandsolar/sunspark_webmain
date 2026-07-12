import { redirect } from "next/navigation";
import { PendingButton } from "@/components/ui/pending-button";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { setSession } from "@/lib/auth/session";

async function registerAction(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2 || !email.includes("@") || password.length < 8) {
    redirect("/register?error=invalid");
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "CUSTOMER"
    }
  });

  await setSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  redirect("/account");
}

export default function RegisterPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  return (
    <section className="section auth-section">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p>Use your account to persist orders and wishlist across devices.</p>
        <form action={registerAction} className="stack-form">
          <label>
            Name
            <input name="name" required />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" minLength={8} required />
          </label>
          <PendingButton pendingText="Creating account...">Register</PendingButton>
        </form>
        <RegisterError searchParams={searchParams} />
      </div>
    </section>
  );
}

async function RegisterError({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return params?.error ? <p className="form-error">Enter a valid name, email, and password.</p> : null;
}
