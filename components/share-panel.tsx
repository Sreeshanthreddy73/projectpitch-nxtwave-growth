"use client";

import { useState, useSyncExternalStore } from "react";
import { sendEvent } from "./track";
import { Button, CheckIcon, inputClass } from "./ui";

// The absolute URL depends on where the app is hosted, so it is read from the
// browser. On the server render the path alone is shown.
const subscribe = () => () => {};
function useOrigin() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => "",
  );
}

export function SharePanel({ code, title }: { code: string; title: string }) {
  const origin = useOrigin();
  const [copied, setCopied] = useState<"ok" | "failed" | null>(null);

  const url = `${origin}/r/${code}`;
  const message = `I just got my AI project blueprint: "${title}". Get yours in 30 seconds: ${url}`;

  async function copy() {
    sendEvent("share_click");
    try {
      await navigator.clipboard.writeText(url);
      setCopied("ok");
    } catch {
      setCopied("failed"); // clipboard blocked: the link is still selectable in the field
    }
    setTimeout(() => setCopied(null), 2500);
  }

  return (
    <div>
      <label htmlFor="share-link" className="text-xs font-semibold uppercase tracking-wider text-muted">
        Your blueprint link
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="share-link"
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          className={`${inputClass} font-mono text-xs`}
        />
        <Button variant="dark" onClick={copy} disabled={!origin} className="shrink-0">
          {copied === "ok" ? (
            <>
              <CheckIcon /> Copied
            </>
          ) : (
            "Copy link"
          )}
        </Button>
      </div>
      {copied === "failed" && (
        <p role="status" className="mt-1.5 text-sm text-muted">
          Couldn&apos;t copy automatically. Select the link above and copy it.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sendEvent("share_click")}
          className="inline-flex items-center rounded-lg border border-line bg-card px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink/30"
        >
          Share on WhatsApp
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sendEvent("share_click")}
          className="inline-flex items-center rounded-lg border border-line bg-card px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink/30"
        >
          Share on LinkedIn
        </a>
        <a
          href={`/r/${code}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-2 py-2.5 text-sm font-medium text-muted hover:text-ink"
        >
          Preview your card
        </a>
      </div>
    </div>
  );
}
