"use client";

import { useState } from "react";

export function SupportChat() {
  const [open, setOpen] = useState(false);
  return <aside className="support-chat">
    {open ? <div className="support-chat-panel"><button aria-label="Close support chat" className="support-chat-close" onClick={() => setOpen(false)} type="button">Close</button><strong>Sunspark Support</strong><p>Need help choosing an electrical, electronics, or solar product?</p><a className="primary-btn" href="https://wa.me/254703586522" rel="noreferrer" target="_blank">Chat on WhatsApp</a></div> : null}
    <button className="support-chat-trigger" onClick={() => setOpen((value) => !value)} type="button">Help</button>
  </aside>;
}
