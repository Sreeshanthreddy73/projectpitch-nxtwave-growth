"use client";

import { useEffect } from "react";

type ClientEvent = "visit" | "share_click" | "card_view";

// Fire-and-forget event. The server attaches session, source, campaign,
// referral code and variant from cookies; the browser only names the event.
export function sendEvent(type: ClientEvent) {
  fetch("/api/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
    keepalive: true,
  }).catch(() => {});
}

// Logs a page-level event once per tab per page.
export function Track({ type }: { type: "visit" | "card_view" }) {
  useEffect(() => {
    const key = `pp:${type}:${window.location.pathname}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage unavailable (private mode): still send the event.
    }
    sendEvent(type);
  }, [type]);
  return null;
}
