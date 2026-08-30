"use client";

import { useEffect, useRef } from "react";

/**
 * Soft fluorescent blobs — sized to the hero section only (parent).
 */
export default function LiquidPortalBackground() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches;

    if (reduce) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let running = true;

    const blobs = [
      { x: 0.4, y: 0.2, r: 0.3, vx: 0.00012, vy: 0.00008, hue: 172 },
      { x: 0.7, y: 0.45, r: 0.24, vx: -0.0001, vy: 0.00007, hue: 168 },
      { x: 0.22, y: 0.65, r: 0.26, vx: 0.00008, vy: -0.0001, hue: 175 },
      { x: 0.58, y: 0.75, r: 0.22, vx: -0.00009, vy: -0.00006, hue: 165 },
    ];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75);
      const parent = canvas.parentElement;
      w = parent?.clientWidth || window.innerWidth;
      h = parent?.clientHeight || Math.min(window.innerHeight * 0.85, 720);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t) => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);

      const speed = isMobile ? 0.5 : 1;
      for (const b of blobs) {
        b.x += b.vx * speed;
        b.y += b.vy * speed;
        if (b.x < 0.12 || b.x > 0.88) b.vx *= -1;
        if (b.y < 0.12 || b.y > 0.88) b.vy *= -1;

        const pulse = 1 + Math.sin(t * 0.0005 + b.hue) * 0.05;
        const radius = Math.max(w, h) * b.r * pulse;
        const gx = b.x * w;
        const gy = b.y * h;
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius);
        g.addColorStop(0, `hsla(${b.hue}, 42%, 38%, 0.18)`);
        g.addColorStop(0.45, `hsla(${b.hue}, 35%, 48%, 0.07)`);
        g.addColorStop(1, "hsla(0, 0%, 100%, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(gx, gy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      running = document.visibilityState === "visible";
      if (running) rafRef.current = requestAnimationFrame(draw);
      else cancelAnimationFrame(rafRef.current);
    };

    resize();
    rafRef.current = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="home-portal-bg" aria-hidden>
      <canvas ref={canvasRef} />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
