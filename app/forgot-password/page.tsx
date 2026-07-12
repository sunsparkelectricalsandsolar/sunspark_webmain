import Link from "next/link";
import { redirect } from "next/navigation";
import { PendingButton } from "@/components/ui/pending-button";
import { apiFetch } from "@/lib/api/client";

async function requestPasswordResetAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email) await apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }).catch(() => null);

  redirect("/forgot-password?sent=1");
}

export default async function ForgotPasswordPage({ searchParams }: { searchParams?: Promise<{ sent?: string }> }) {
  const params = await searchParams;

  return (
    <section className="section auth-section">
      <div className="auth-card">
        <h1>Reset Password</h1>
        <p>Enter your account email and we will send a secure reset link if the account exists.</p>
        <form action={requestPasswordResetAction} className="stack-form">
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <PendingButton pendingText="Sending...">Send reset link</PendingButton>
        </form>
        {params?.sent ? (
          <p className="form-success" role="status">
            If that email is registered, a password reset link has been sent.
          </p>
        ) : null}
        <Link href="/login">Back to login</Link>
      </div>
    </section>
  );
}
