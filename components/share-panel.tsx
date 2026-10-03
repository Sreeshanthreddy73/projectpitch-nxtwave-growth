"use client";

import { useState, useSyncExternalStore } from "react";
import { sendEvent } from "./track";
import { Button, CheckIcon, buttonClass } from "./ui";

// The absolute URL depends on where the app is hosted, so it is read from the
// browser. On the server render only the path is known.
const subscribe = () => () => {};
function useOrigin() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => "",
  );
}

function useCopy() {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed"); // clipboard blocked: the text stays selectable on the page
    }
    setTimeout(() => setState("idle"), 2500);
  }
  return { state, copy };
}

export function SharePanel({ code, title }: { code: string; title: string }) {
  const origin = useOrigin();
  const { state, copy } = useCopy();

  const url = `${origin}/r/${code}`;
  const message = `I just got my AI project blueprint: "${title}". Get yours in 30 seconds: ${url}`;

  return (
    <div>
      <label htmlFor="share-link" className="sr-only">
        Your project link
      </label>
      <input
        id="share-link"
        readOnly
        value={url}
        onFocus={(e) => e.target.select()}
        className="w-full truncate rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-3 font-mono text-xs text-white/85 outline-none focus:border-white/40"
      />
      <Button
        variant="primary"
        size="lg"
        disabled={!origin}
        className="mt-3 w-full"
        onClick={() => {
          sendEvent("share_click");
          copy(url);
        }}
      >
        {state === "copied" ? (
          <span className="inline-flex animate-pop items-center gap-2">
            <CheckIcon /> Link copied
          </span>
        ) : (
          "Copy Project Link"
        )}
      </Button>
      <p role="status" className="mt-2 min-h-5 text-sm text-white/60">
        {state === "copied" && "Paste it in your class group or send it to a friend."}
        {state === "failed" && "Couldn't copy automatically. Select the link above and copy it."}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sendEvent("share_click")}
          className={buttonClass("light", "md")}
        >
          WhatsApp
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sendEvent("share_click")}
          className={buttonClass("light", "md")}
        >
          LinkedIn
        </a>
      </div>
      <a
        href={`/r/${code}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
      >
        See what your friends will see
      </a>
    </div>
  );
}

// Small "Copy" button for a piece of text (used for the resume bullet).
export function CopyText({ text, label = "Copy" }: { text: string; label?: string }) {
  const { state, copy } = useCopy();
  return (
    <Button variant="secondary" size="sm" onClick={() => copy(text)} aria-live="polite">
      {state === "copied" ? (
        <>
          <CheckIcon className="size-3.5" /> Copied
        </>
      ) : state === "failed" ? (
        "Select and copy"
      ) : (
        label
      )}
    </Button>
  );
}
