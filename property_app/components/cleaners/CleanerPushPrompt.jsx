"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
  isIosSafari,
  isStandaloneDisplay,
  pushSupported,
  subscribeHostPush,
} from "@/utils/push/client";

export default function CleanerPushPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    if (isIosSafari() && !isStandaloneDisplay()) {
      setHint("Add Isisel to your Home Screen, then tap Allow alerts.");
      setVisible(true);
      return;
    }
    if (!pushSupported()) return;
    if (Notification.permission === "granted") {
      subscribeHostPush().catch(() => {});
      return;
    }
    if (Notification.permission === "denied") return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="mb-4 rounded-2xl border border-[var(--kama-accent)] bg-[var(--kama-accent-soft)] px-4 py-3">
      <p className="text-sm font-semibold">Get a ping when a host needs you</p>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--kama-ink-muted)]">{hint}</p>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await subscribeHostPush();
              setVisible(false);
            } catch {
              setHint("Allow notifications in the browser, then try again.");
            } finally {
              setBusy(false);
            }
          }}
          className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--kama-accent)] px-4 text-sm font-semibold text-white"
        >
          <Bell className="h-4 w-4" />
          {busy ? "Enabling…" : "Allow alerts"}
        </button>
      )}
    </div>
  );
}
