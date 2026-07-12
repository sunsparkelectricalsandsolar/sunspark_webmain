"use client";

import { useFormStatus } from "react-dom";

type PendingButtonProps = {
  children: string;
  className?: string;
  disabled?: boolean;
  pendingText?: string;
};

export function PendingButton({
  children,
  className = "primary-btn",
  disabled = false,
  pendingText = "Submitting..."
}: PendingButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button aria-busy={pending} className={className} disabled={disabled || pending} type="submit">
      {pending ? pendingText : children}
    </button>
  );
}
