"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const PENDING_REF_KEY = "geniuspay_pending_reference";

function resolveReference(searchParams) {
  const keys = [
    "reference",
    "ref",
    "payment_reference",
    "transaction_reference",
    "trx_ref",
    "tx_ref",
  ];
  for (const key of keys) {
    const v = searchParams.get(key);
    if (v) return v.trim();
  }
  return null;
}

function VerifyInner() {
  const searchParams = useSearchParams();
  const [state, setState] = useState({
    phase: "working",
    message: "",
    transaction: null,
    rawParams: null,
  });

  useEffect(() => {
    const status = searchParams.get("status");
    const fromQuery = resolveReference(searchParams);
    let fromStorage = null;
    try {
      fromStorage = sessionStorage.getItem(PENDING_REF_KEY);
    } catch {
      // ignore
    }

    const reference = fromQuery || (fromStorage ? fromStorage.trim() : null);

    const paramsObj = {};
    searchParams.forEach((v, k) => {
      paramsObj[k] = v;
    });
    console.log("[GeniusPay verify] query params:", paramsObj);
    console.log("[GeniusPay verify] resolved reference:", reference);

    if (status === "failed") {
      try {
        sessionStorage.removeItem(PENDING_REF_KEY);
      } catch {
        // ignore
      }
      setState({
        phase: "failed",
        message: "Payment was cancelled or failed.",
        transaction: null,
        rawParams: paramsObj,
      });
      return;
    }

    if (!reference) {
      setState({
        phase: "error",
        message:
          "No payment reference found. GeniusPay may not have appended it to the return URL — start checkout from this site again so the reference is stored before redirect.",
        transaction: null,
        rawParams: paramsObj,
      });
      return;
    }

    let cancelled = false;

    async function persistWithRetries() {
      const maxAttempts = 10;
      const delayMs = 1200;
      let lastErrorMessage = "";

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (cancelled) return;

        try {
          const res = await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference }),
          });

          const raw = await res.text();
          let data = {};
          try {
            data = raw ? JSON.parse(raw) : {};
          } catch {
            data = { non_json_body: raw };
          }

          console.log(
            `[GeniusPay verify] save attempt ${attempt}/${maxAttempts}`,
            { status: res.status, body: data },
          );

          if (!res.ok || !data?.success) {
            lastErrorMessage =
              data?.message ||
              data?.error?.message ||
              `HTTP ${res.status} while saving transaction`;
          }

          if (res.ok && data.success && data.transaction) {
            console.log("[GeniusPay verify] transaction saved:", data.transaction);
            try {
              sessionStorage.removeItem(PENDING_REF_KEY);
            } catch {
              // ignore
            }
            if (!cancelled) {
              setState({
                phase: "saved",
                message: "Payment recorded successfully.",
                transaction: data.transaction,
                rawParams: paramsObj,
              });
            }
            return;
          }

          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, delayMs));
          }
        } catch (e) {
          console.error("[GeniusPay verify] save error:", e);
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, delayMs));
          }
        }
      }

      if (!cancelled) {
        setState({
          phase: "error",
          message:
            `Could not confirm payment with GeniusPay yet. ${
              lastErrorMessage ? `Last error: ${lastErrorMessage}` : ""
            }`,
          transaction: null,
          rawParams: paramsObj,
        });
      }
    }

    persistWithRetries();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-4">
        {state.phase === "working" && (
          <>
            <h1 className="text-xl font-bold text-slate-900">Confirming payment…</h1>
            <p className="text-slate-600 text-sm">
              Talking to GeniusPay and saving your transaction in MongoDB. Watch the
              browser console for the saved object.
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
          </>
        )}

        {state.phase === "saved" && (
          <>
            <h1 className="text-xl font-bold text-emerald-800">All set</h1>
            <p className="text-slate-600 text-sm">{state.message}</p>
            {state.transaction && (
              <pre className="text-xs bg-slate-100 p-3 rounded-lg overflow-auto max-h-48 text-slate-800">
                {JSON.stringify(state.transaction, null, 2)}
              </pre>
            )}
            <Link
              href="/"
              className="inline-block mt-2 text-sm font-semibold text-blue-600 hover:underline"
            >
              Back to home
            </Link>
          </>
        )}

        {(state.phase === "failed" || state.phase === "error") && (
          <>
            <h1 className="text-xl font-bold text-slate-900">
              {state.phase === "failed" ? "Payment not completed" : "Could not save yet"}
            </h1>
            <p className="text-slate-600 text-sm">{state.message}</p>
            {state.rawParams && Object.keys(state.rawParams).length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-slate-500">URL parameters</summary>
                <pre className="mt-2 bg-slate-100 p-3 rounded-lg overflow-auto">
                  {JSON.stringify(state.rawParams, null, 2)}
                </pre>
              </details>
            )}
            <Link
              href="/"
              className="inline-block mt-2 text-sm font-semibold text-blue-600 hover:underline"
            >
              Back to home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentsVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900" />
        </div>
      }
    >
      <VerifyInner />
    </Suspense>
  );
}
