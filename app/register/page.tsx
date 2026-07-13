import { redirect } from "next/navigation";
import { PendingButton } from "@/components/ui/pending-button";
import { PasswordField } from "@/components/ui/password-field";
import { apiFetch, ApiError } from "@/lib/api/client";
import { setSession } from "@/lib/auth/session";
import type { PublicUser } from "@/lib/types";

async function registerAction(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2 || !email.includes("@") || password.length < 8) {
    redirect("/register?error=invalid");
  }

  let user: PublicUser;

  try {
    const result = await apiFetch<{ user: PublicUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
    user = result.user;
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    redirect("/register?error=exists");
  }

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
          <PasswordField autoComplete="new-password" minLength={8} />
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
