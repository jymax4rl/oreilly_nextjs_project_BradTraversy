"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import heroImage from "@/assets/images/modernMansion01.png";

gsap.registerPlugin(useGSAP);

const LS_KEY = "kamaproperties_hasCompletedHostOnboarding";

function PatternCorners() {
  return (
    <>
      <div
        className="pointer-events-none absolute left-0 top-0 h-40 w-40 opacity-[0.08]"
        aria-hidden
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 6px,
            rgba(196,181,253,0.5) 6px,
            rgba(196,181,253,0.5) 8px
          )`,
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 opacity-[0.08]"
        aria-hidden
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 8px,
            rgba(167,139,250,0.45) 8px,
            rgba(167,139,250,0.45) 10px
          )`,
        }}
      />
    </>
  );
}

function FloatingParticles({ scope }) {
  const n = 18;
  const particles = Array.from({ length: n }, (_, i) => ({
    id: i,
    left: `${(i * 47) % 100}%`,
    top: `${(i * 61) % 100}%`,
    size: 2 + (i % 4),
    delay: (i % 7) * 0.3,
  }));

  return (
    <div ref={scope} className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle absolute rounded-full bg-violet-200/35 shadow-[0_0_12px_rgba(196,181,253,0.6)]"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  );
}

function NetworkNodes({ scope }) {
  const nodes = [
    { x: "12%", y: "38%" },
    { x: "28%", y: "52%" },
    { x: "44%", y: "44%" },
    { x: "62%", y: "58%" },
    { x: "78%", y: "40%" },
    { x: "88%", y: "62%" },
  ];
  return (
    <div ref={scope} className="pointer-events-none absolute inset-0">
      {nodes.map((pt, i) => (
        <div
          key={i}
          className="network-node absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-300 shadow-[0_0_16px_4px_rgba(139,92,246,0.65)]"
          style={{ left: pt.x, top: pt.y }}
        />
      ))}
    </div>
  );
}

export default function HostWelcomeOnboardingPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const rootRef = useRef(null);
  const bgRef = useRef(null);
  const eyebrowRef = useRef(null);
  const headlineL1Ref = useRef(null);
  const headlineL2Ref = useRef(null);
  const descRef = useRef(null);
  const bottomRef = useRef(null);
  const ctaRef = useRef(null);
  const particlesScope = useRef(null);
  const nodesScope = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const touchStartX = useRef(null);

  const persistComplete = useCallback(async () => {
    const res = await fetch("/api/user/host-welcome-onboarding", {
      method: "POST",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Could not save your progress");
    }
    try {
      localStorage.setItem(LS_KEY, "1");
    } catch {
      /* ignore */
    }
    await update();
  }, [update]);

  const goComplete = useCallback(async () => {
    setError("");
    setSubmitting(true);
    try {
      await persistComplete();
      router.replace("/properties/add");
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }, [persistComplete, router]);

  const goSkip = useCallback(() => {
    router.replace("/");
  }, [router]);

  useGSAP(
    () => {
      if (bgRef.current) {
        gsap.fromTo(
          bgRef.current,
          { scale: 1 },
          {
            scale: 1.08,
            duration: 18,
            repeat: -1,
            yoyo: true,
            ease: "none",
          },
        );
      }

      gsap.fromTo(
        eyebrowRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: "power3.out" },
      );

      gsap.fromTo(
        headlineL1Ref.current,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.7, delay: 0.45, ease: "power4.out" },
      );
      gsap.fromTo(
        headlineL2Ref.current,
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 0.75, delay: 0.62, ease: "power4.out" },
      );

      gsap.fromTo(
        descRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, delay: 0.85, ease: "power3.out" },
      );

      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 1, delay: 1.05, ease: "power3.out" },
      );

      gsap.fromTo(
        bottomRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.2, delay: 1.35, ease: "power2.out" },
      );

      const particleEls =
        particlesScope.current?.querySelectorAll(".particle");
      if (particleEls?.length) {
        particleEls.forEach((el, i) => {
          gsap.to(el, {
            y: `+=${12 + (i % 6) * 3}`,
            x: `+=${4 + (i % 4)}`,
            duration: 8 + (i % 5) * 0.8,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: i * 0.15,
          });
        });
      }

      const nodeEls = nodesScope.current?.querySelectorAll(".network-node");
      if (nodeEls?.length) {
        gsap.to(nodeEls, {
          scale: 1.65,
          opacity: 0.55,
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: 0.4,
        });
      }
    },
    { scope: rootRef },
  );

  const onPointerMove = (e) => {
    if (!bgRef.current || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    const s = 0.18;
    gsap.to(bgRef.current, {
      x: nx * 24 * s,
      y: ny * 24 * s,
      duration: 0.6,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const end = e.changedTouches[0]?.clientX ?? start;
    if (start - end > 60) {
      goComplete();
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#07081c] text-violet-200">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      className="relative min-h-dvh w-full overflow-hidden bg-[#07081c] text-white"
      onPointerMove={onPointerMove}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        type="button"
        onClick={goSkip}
        className="absolute right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] z-30 text-sm font-medium text-white/70 transition hover:text-white"
      >
        Skip
      </button>

      <div className="absolute inset-0 overflow-hidden">
        <div
          ref={bgRef}
          className="absolute inset-[-8%] will-change-transform"
          style={{ transform: "translateZ(0)" }}
        >
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            className="object-cover object-right"
            sizes="100vw"
          />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(8,10,40,0.15) 0%, rgba(18,12,68,0.72) 55%, rgba(7,8,28,0.92) 100%)",
          }}
          aria-hidden
        />
      </div>

      <PatternCorners />
      <FloatingParticles scope={particlesScope} />
      <NetworkNodes scope={nodesScope} />

      <div
        className="relative z-20 flex min-h-dvh flex-col justify-end px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(1.5rem,env(safe-area-inset-left))] pt-[max(4rem,env(safe-area-inset-top))]"
        style={{ alignItems: "flex-start" }}
      >
        <div className="max-w-[min(100%,360px)]">
          <p
            ref={eyebrowRef}
            className="mb-3 text-[12px] font-bold uppercase tracking-[0.18em] text-[#A78BFA]"
          >
            Welcome, host
          </p>

          <h1 className="mb-4 font-extrabold leading-[0.95] text-[clamp(2.5rem,12vw,3.375rem)] text-white">
            <span ref={headlineL1Ref} className="block">
              A New Era
            </span>
            <span ref={headlineL2Ref} className="block">
              <span className="text-[#FACC15]">Begins</span>
            </span>
          </h1>

          <p
            ref={descRef}
            className="mb-6 max-w-[320px] text-base leading-relaxed text-white/[0.82]"
          >
            Open your doors to travelers across Africa and beyond. Your property
            can now reach guests from Senegal, Mali, Niger, Kenya and more —
            without payment barriers getting in the way.
          </p>

          <p ref={bottomRef} className="mb-8 text-sm font-medium text-[#C4B5FD]">
            The future of African hospitality starts now.
          </p>

          {error ? (
            <p className="mb-3 text-sm text-amber-200" role="alert">
              {error}
            </p>
          ) : null}

          <button
            ref={ctaRef}
            type="button"
            disabled={submitting}
            onClick={goComplete}
            className="flex h-[58px] w-full max-w-[320px] items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] text-[17px] font-bold text-white shadow-[0_10px_40px_rgba(99,102,241,0.35)] transition enabled:hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
