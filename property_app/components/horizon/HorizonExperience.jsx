"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { horizonPage } from "@/app/horizon/content";

gsap.registerPlugin(ScrollTrigger);

export default function HorizonExperience({ children }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 900px)").matches;
    let magnetCleanup;

    const ctx = gsap.context(() => {
      const progress = root.querySelector("[data-hz-progress]");
      const indexEl = root.querySelector("[data-hz-index]");
      const sections = [...root.querySelectorAll("[data-hz-section]")];

      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          if (progress) {
            progress.style.transform = `scaleY(${self.progress.toFixed(4)})`;
          }
          if (indexEl) {
            const n = Math.min(
              99,
              Math.max(1, Math.round(self.progress * Math.max(sections.length, 1))),
            );
            indexEl.textContent = String(n).padStart(2, "0");
          }
        },
      });

      root.querySelectorAll("[data-hz-reveal]").forEach((node) => {
        gsap.fromTo(
          node,
          { autoAlpha: 0, y: reduce ? 0 : 32 },
          {
            autoAlpha: 1,
            y: 0,
            duration: reduce ? 0.01 : 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: node,
              start: "top 86%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      root.querySelectorAll("[data-count]").forEach((node) => {
        const end = Number(node.getAttribute("data-count"));
        const prefix = node.getAttribute("data-prefix") || "";
        const suffix = node.getAttribute("data-suffix") || "";
        const format = node.getAttribute("data-format") || "int";
        const apply = (value) => {
          if (format === "usd") {
            node.textContent = `${prefix}${Math.round(value).toLocaleString("en-US")}`;
            return;
          }
          node.textContent = `${prefix}${Math.round(value)}${suffix}`;
        };
        apply(reduce ? end : 0);
        ScrollTrigger.create({
          trigger: node,
          start: "top 82%",
          once: true,
          onEnter: () => {
            if (reduce) {
              apply(end);
              return;
            }
            const obj = { n: 0 };
            gsap.to(obj, {
              n: end,
              duration: 1.75,
              ease: "power2.out",
              onUpdate: () => apply(obj.n),
            });
          },
        });
      });

      const seal = root.querySelector("[data-hz-seal]");
      if (seal && !reduce) {
        gsap.to(seal, {
          rotate: 360,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
          },
        });
      }

      const flora = root.querySelector("[data-hz-flora]");
      if (flora && !reduce) {
        gsap.to(flora, {
          y: -48,
          x: 28,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.85,
          },
        });
      }

      const pin = root.querySelector(".hz-walk__pin");
      const track = root.querySelector("[data-hz-htrack]");
      if (pin && track && desktop && !reduce) {
        const getShift = () => Math.min(0, window.innerWidth - track.scrollWidth);
        gsap.to(track, {
          x: getShift,
          ease: "none",
          scrollTrigger: {
            trigger: pin,
            pin: true,
            scrub: 0.85,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            end: () => `+=${Math.max(track.scrollWidth - window.innerWidth, 400)}`,
          },
        });
      }

      const magnet = root.querySelector("[data-hz-magnet]");
      if (magnet && window.matchMedia("(hover: hover)").matches && !reduce) {
        const onMove = (event) => {
          const box = magnet.getBoundingClientRect();
          const cx = box.left + box.width / 2;
          const cy = box.top + box.height / 2;
          const dx = event.clientX - cx;
          const dy = event.clientY - cy;
          if (Math.hypot(dx, dy) > 140) {
            gsap.to(magnet, { x: 0, y: 0, duration: 0.5, ease: "power3.out" });
            return;
          }
          gsap.to(magnet, {
            x: dx * 0.28,
            y: dy * 0.28,
            duration: 0.35,
            ease: "power3.out",
          });
        };
        const reset = () =>
          gsap.to(magnet, { x: 0, y: 0, duration: 0.6, ease: "power3.out" });
        window.addEventListener("pointermove", onMove);
        magnet.addEventListener("pointerleave", reset);
        magnetCleanup = () => {
          window.removeEventListener("pointermove", onMove);
          magnet.removeEventListener("pointerleave", reset);
          reset();
        };
      }
    }, root);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);
    const fontsReady = document.fonts?.ready?.then(() => ScrollTrigger.refresh());

    return () => {
      magnetCleanup?.();
      window.removeEventListener("resize", onResize);
      fontsReady?.catch?.(() => {});
      ctx.revert();
    };
  }, []);

  const { editorial } = horizonPage;

  return (
    <div className="hz-experience" ref={rootRef}>
      <aside className="hz-rail" aria-hidden="true">
        <span data-hz-index>01</span>
        <span className="hz-rail__line">
          <i data-hz-progress />
        </span>
        <span className="hz-rail__scroll">{editorial.scroll}</span>
      </aside>

      <div className="hz-seal" aria-hidden="true">
        <svg viewBox="0 0 200 200" data-hz-seal>
          <defs>
            <path
              id="hz-seal-path"
              d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0"
            />
          </defs>
          <text>
            <textPath href="#hz-seal-path">{editorial.seal.repeat(2)}</textPath>
          </text>
          <path
            className="hz-seal__mark"
            d="M100 58 L108 86 L138 86 L114 104 L122 134 L100 116 L78 134 L86 104 L62 86 L92 86 Z"
          />
        </svg>
      </div>

      <div className="hz-flora" data-hz-flora>
        <video
          src="/horizon/flora.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      </div>

      {children}
    </div>
  );
}
