import { createHash, randomBytes } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PendingButton } from "@/components/ui/pending-button";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send-email";
import { siteConfig } from "@/lib/site-config";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function requestPasswordResetAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;

  if (user) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt
      }
    });

    const resetUrl = `${siteConfig.url}/reset-password?token=${encodeURIComponent(token)}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your Sunspark password",
      text: `Use this link to reset your Sunspark password. It expires in 30 minutes: ${resetUrl}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#172033">
          <h2 style="margin:0 0 12px">Reset your Sunspark password</h2>
          <p>Use the button below to set a new password. This link expires in 30 minutes.</p>
          <p><a href="${resetUrl}" style="display:inline-block;background:#0f65c8;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none">Reset password</a></p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `
    });
  }

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
