"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type AccountMenuSession = {
  name: string;
} | null;

export function AccountMenu({
  session,
  logoutAction
}: {
  session: AccountMenuSession;
  logoutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={`account-menu${open ? " open" : ""}`} ref={menuRef}>
      <button aria-expanded={open} aria-label="Account menu" onClick={() => setOpen((current) => !current)} type="button">
        <span aria-hidden="true" className="account-menu-icon">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M12 12a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Zm0 2c-4.1 0-7.4 2.2-7.4 5v1h14.8v-1c0-2.8-3.3-5-7.4-5Z" />
          </svg>
        </span>
        <span aria-hidden="true" className="account-menu-arrow" />
      </button>
      {open ? (
        <div className="account-menu-panel">
          {session ? (
            <>
              <strong>{session.name}</strong>
              <Link href="/account#top" onClick={() => setOpen(false)}>My account</Link>
              <Link href="/account/orders#top" onClick={() => setOpen(false)}>Orders</Link>
              <Link href="/forgot-password#top" onClick={() => setOpen(false)}>Change password</Link>
              <form action={logoutAction}>
                <button type="submit">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login#top" onClick={() => setOpen(false)}>Sign in</Link>
              <Link href="/register#top" onClick={() => setOpen(false)}>Create account</Link>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
