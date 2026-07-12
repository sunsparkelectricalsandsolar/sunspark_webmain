import { createHash } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PendingButton } from "@/components/ui/pending-button";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function resetPasswordAction(formData: FormData) {
  "use server";

  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token || password.length < 8 || password !== confirmPassword) {
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=invalid`);
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    redirect("/reset-password?error=expired");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: await hashPassword(password) }
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() }
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        userId: resetToken.userId,
        usedAt: null,
        id: { not: resetToken.id }
      }
    })
  ]);

  redirect(resetToken.user.role === "ADMIN" ? "/admin/login?reset=1" : "/login?reset=1");
}

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams?: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  const token = params?.token ?? "";

  return (
    <section className="section auth-section">
      <div className="auth-card">
        <h1>Choose New Password</h1>
        <p>Set a new password with at least 8 characters.</p>
        {params?.error === "expired" ? (
          <p className="form-error" role="alert">This reset link is invalid or has expired.</p>
        ) : null}
        {params?.error === "invalid" ? (
          <p className="form-error" role="alert">Passwords must match and be at least 8 characters.</p>
        ) : null}
        {token ? (
          <form action={resetPasswordAction} className="stack-form">
            <input name="token" type="hidden" value={token} />
            <label>
              New password
              <input name="password" type="password" minLength={8} required />
            </label>
            <label>
              Confirm password
              <input name="confirmPassword" type="password" minLength={8} required />
            </label>
            <PendingButton pendingText="Updating...">Update password</PendingButton>
          </form>
        ) : (
          <Link href="/forgot-password">Request a new reset link</Link>
        )}
      </div>
    </section>
  );
}
