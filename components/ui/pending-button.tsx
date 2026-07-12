"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

type PendingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: string;
  pendingText?: string;
};

export function PendingButton({
  children,
  className = "primary-btn",
  disabled = false,
  pendingText = "Submitting...",
  ...props
}: PendingButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button {...props} aria-busy={pending} className={className} disabled={disabled || pending} type="submit">
      {pending ? pendingText : children}
    </button>
  );
}
