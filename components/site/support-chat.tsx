"use client";

import { useState } from "react";
import { siteConfig } from "@/lib/site-config";

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const message = "Hello Sunspark, I have loved the electricals you are selling, I have a request to make.";
  const whatsappUrl = `https://wa.me/${siteConfig.whatsappPhone}?text=${encodeURIComponent(message)}`;

  return <aside className="support-chat">
    {open ? <div className="support-chat-panel"><button aria-label="Close support chat" className="support-chat-close" onClick={() => setOpen(false)} type="button">Close</button><strong>Sunspark Support</strong><p>Need help choosing an electrical, electronics, or solar product?</p><small>{message}</small><a className="primary-btn" href={whatsappUrl} rel="noreferrer" target="_blank">Chat on WhatsApp</a></div> : null}
    <button className="support-chat-trigger" onClick={() => setOpen((value) => !value)} type="button">Help</button>
  </aside>;
}
