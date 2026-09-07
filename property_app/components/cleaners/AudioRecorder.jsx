"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_AUDIO_SECONDS } from "@/utils/cleaners/constants";

function pickMime() {
  if (typeof MediaRecorder === "undefined") return "";
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function formatSeconds(value) {
  const safe = Math.max(0, Number(value) || 0);
  const m = String(Math.floor(safe / 60)).padStart(2, "0");
  const s = String(safe % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function AudioRecorder({ onSave, disabled }) {
  const [state, setState] = useState("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const blobRef = useRef(null);
  const timerRef = useRef(null);
  const mimeRef = useRef("");

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    return () => {
      cleanupStream();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (state !== "recording") return undefined;
    const onLeave = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [state]);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const finishBlob = () => {
    const blob = new Blob(chunksRef.current, {
      type: mimeRef.current || "audio/webm",
    });
    chunksRef.current = [];
    blobRef.current = blob;
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
    cleanupStream();
    stopTimer();
    setState("preview");
  };

  const start = async () => {
    setError("");
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot record audio. Add a photo or a written note instead.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setError("Recording is not supported here. Try Chrome or Safari on your phone.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMime();
      mimeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = finishBlob;
      recorderRef.current = recorder;
      recorder.start();
      setSeconds(0);
      setState("recording");
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_AUDIO_SECONDS) {
            recorder.stop();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      if (err?.name === "NotAllowedError") {
        setError("Microphone permission is needed to record. You can still add photos or a note.");
      } else {
        setError("Could not start the microphone.");
      }
    }
  };

  const pause = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.pause();
      stopTimer();
      setState("paused");
    }
  };

  const resume = () => {
    if (recorderRef.current?.state === "paused") {
      recorderRef.current.resume();
      setState("recording");
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_AUDIO_SECONDS) recorderRef.current?.stop();
          return next;
        });
      }, 1000);
    }
  };

  const stop = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  };

  const discard = () => {
    blobRef.current = null;
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setSeconds(0);
    setState("idle");
  };

  const save = async () => {
    if (!blobRef.current || blobRef.current.size < 200) {
      setError("That recording is empty. Try again.");
      return;
    }
    setState("saving");
    try {
      await onSave(blobRef.current, {
        duration: seconds,
        mimeType: blobRef.current.type || mimeRef.current || "audio/webm",
      });
      discard();
      setState("saved");
      setTimeout(() => setState("idle"), 1600);
    } catch (err) {
      setState("preview");
      setError(err.message || "Upload failed. Your recording is still here — try save again.");
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]">
        Audio report
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">
        {state === "idle" || state === "saved" ? "00:00" : formatSeconds(seconds)}
      </p>
      <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">
        {state === "recording"
          ? "Recording…"
          : state === "paused"
            ? "Paused"
            : state === "preview"
              ? "Listen, then save"
              : state === "saving"
                ? "Saving…"
                : state === "saved"
                  ? "Saved"
                  : "Speak your report. Writing is optional."}
      </p>

      {state === "idle" || state === "saved" ? (
        <button
          type="button"
          disabled={disabled}
          onClick={start}
          className="cleaner-mic mx-auto mt-4 bg-[var(--kama-accent)] text-white"
        >
          🎙
        </button>
      ) : null}

      {state === "recording" || state === "paused" ? (
        <div className="mt-4 flex justify-center gap-3">
          {state === "recording" ? (
            <button type="button" onClick={pause} className="rounded-full bg-[var(--kama-field)] px-4 py-2 text-sm font-semibold">
              Pause
            </button>
          ) : (
            <button type="button" onClick={resume} className="rounded-full bg-[var(--kama-field)] px-4 py-2 text-sm font-semibold">
              Resume
            </button>
          )}
          <button
            type="button"
            onClick={stop}
            data-state="recording"
            className="cleaner-mic bg-[#b42318] text-white"
          >
            ■
          </button>
        </div>
      ) : null}

      {state === "preview" || state === "saving" ? (
        <div className="mt-4 space-y-3">
          {previewUrl ? <audio controls src={previewUrl} className="w-full" /> : null}
          <div className="flex justify-center gap-2">
            <button type="button" onClick={discard} className="rounded-full px-4 py-2 text-sm">
              Delete
            </button>
            <button
              type="button"
              disabled={state === "saving"}
              onClick={save}
              className="rounded-full bg-[var(--kama-accent)] px-5 py-2 text-sm font-semibold text-white"
            >
              {state === "saving" ? "Saving…" : "Save report"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
