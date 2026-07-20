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

  if (name.length < 2) {
    redirect("/register?error=name");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/register?error=email");
  }

  if (password.length < 8 || password.length > 200) {
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
    if (error.status === 409) redirect("/register?error=exists");
    if (error.status === 400) redirect("/register?error=invalid");
    redirect("/register?error=system");
  }

  await setSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  redirect("/account");
}

export default function RegisterPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  return (
    <section className="section auth-section">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p>Use your account to save orders and wishlist across devices.</p>
        <form action={registerAction} className="stack-form">
          <label>
            Name
            <input autoComplete="name" minLength={2} name="name" required />
          </label>
          <label>
            Email
            <input autoComplete="email" name="email" type="email" required />
          </label>
          <PasswordField autoComplete="new-password" minLength={8} />
          <p className="field-hint">Password must be at least 8 characters.</p>
          <PendingButton pendingText="Creating account...">Register</PendingButton>
        </form>
        <RegisterError searchParams={searchParams} />
      </div>
    </section>
  );
}

async function RegisterError({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const messages: Record<string, string> = {
    name: "Enter your full name, at least 2 characters.",
    email: "Enter a valid email address.",
    invalid: "Password must be at least 8 characters.",
    exists: "An account with that email already exists. Please sign in or reset your password.",
    system: "The account could not be created right now. Please try again, or contact Sunspark support."
  };
  const message = params?.error ? messages[params.error] : null;
  return message ? <p className="form-error" role="alert">{message}</p> : null;
}
