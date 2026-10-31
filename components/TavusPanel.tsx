"use client";

import { useEffect, useRef, useState } from "react";
import type { EventInput } from "@/lib/schema";

type Status = "idle" | "loading" | "active" | "error" | "unavailable";

interface Props {
  eventInput: EventInput;
  planSummary: string;
}

export function TavusPanel({ eventInput, planSummary }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevStatus = useRef<Status>("idle");

  async function start() {
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/tavus/conversation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventInput, planSummary }),
      });

      if (res.status === 503) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setStatus("unavailable");
        setMessage(
          data.error ??
            "Live video planner isn't configured — the rest of your plan still works.",
        );
        return;
      }
      if (!res.ok) throw new Error("request failed");

      const data = (await res.json()) as { conversation_url?: string };
      if (!data.conversation_url) throw new Error("missing url");
      setUrl(data.conversation_url);
      setStatus("active");
    } catch {
      setStatus("error");
      setMessage("We couldn't start the video planner. Please try again.");
    }
  }

  function close() {
    // Unmounting the iframe stops the camera and microphone.
    setUrl(null);
    setStatus("idle");
  }

  // Move focus into the panel when it opens, and back to the trigger on close.
  useEffect(() => {
    if (status === "active") closeRef.current?.focus();
    else if (status === "idle" && prevStatus.current === "active")
      triggerRef.current?.focus();
    prevStatus.current = status;
  }, [status]);

  if (status === "active" && url) {
    return (
      <section aria-label="Live video planner" className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-base font-semibold">Your planner is live</h3>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            className="rounded-md border border-ink/20 px-3 py-1 text-sm font-semibold hover:border-ink/40"
          >
            End &amp; close
          </button>
        </div>
        <iframe
          title={`Live video planning session for ${eventInput.name}`}
          src={url}
          allow="camera; microphone"
          loading="lazy"
          className="h-[460px] w-full rounded-lg border border-line bg-paper-deep"
        />
        <p className="text-xs text-ink-soft">
          Video and microphone are optional. Closing this ends the session and stops your
          camera and mic.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Talk to your planner" className="space-y-2">
      <h3 className="font-serif text-base font-semibold">Talk to your planner</h3>
      <p className="text-sm text-ink-soft">
        Have a live video chat with an AI planner who already knows your event. Camera and
        microphone are optional — the rest of PlanPal works without it.
      </p>
      <button
        ref={triggerRef}
        type="button"
        onClick={start}
        disabled={status === "loading"}
        className="w-full rounded-lg bg-accent-deep px-4 py-2.5 font-semibold text-paper transition hover:brightness-110 disabled:opacity-60"
      >
        {status === "loading" ? "Connecting…" : "Talk to your planner"}
      </button>
      <p aria-live="polite" className="min-h-[1.25rem] text-sm text-accent-deep">
        {status === "error" || status === "unavailable" ? (
          <>
            <span aria-hidden className="mr-1.5 font-bold">
              ⚠
            </span>
            {message}
          </>
        ) : null}
      </p>
    </section>
  );
}
