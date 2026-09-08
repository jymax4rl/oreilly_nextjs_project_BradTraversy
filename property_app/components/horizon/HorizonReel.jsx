"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

function cropClass(crop) {
  if (crop === "top") return " hz-media--top";
  if (crop === "bottom") return " hz-media--bottom";
  return "";
}

export default function HorizonReel({ images, hint = "Swipe" }) {
  const scrollerRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = images.length;

  const go = (next) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const slides = [...scroller.querySelectorAll("[data-hz-slide]")];
    const target = slides[Math.max(0, Math.min(count - 1, next))];
    target?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return undefined;

    const slides = [...scroller.querySelectorAll("[data-hz-slide]")];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const next = Number(visible.target.getAttribute("data-hz-slide"));
        if (!Number.isNaN(next)) setIndex(next);
      },
      { root: scroller, threshold: 0.55 },
    );
    slides.forEach((slide) => io.observe(slide));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches || paused || count < 2) return undefined;
    const id = window.setInterval(() => {
      go(index >= count - 1 ? 0 : index + 1);
    }, 5200);
    return () => window.clearInterval(id);
  }, [index, paused, count]);

  return (
    <div
      className="hz-reel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        ref={scrollerRef}
        className="hz-reel__scroller"
        tabIndex={0}
        aria-roledescription="carousel"
        aria-label="Horizon building stills"
      >
        {images.map((image, i) => (
          <figure
            className={`hz-reel__slide${cropClass(image.crop)}`}
            data-hz-slide={i}
            key={image.src}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(max-width: 720px) 88vw, 72vw"
              quality={90}
              unoptimized={image.width < 1100}
            />
            <figcaption>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {image.caption || image.alt}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="hz-reel__bar">
        <p className="hz-reel__hint">{hint}</p>
        <div className="hz-reel__dots" role="tablist" aria-label="Slides">
          {images.map((image, i) => (
            <button
              key={image.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show still ${i + 1}`}
              className={i === index ? "is-on" : undefined}
              onClick={() => go(i)}
            />
          ))}
        </div>
        <div className="hz-reel__arrows">
          <button
            type="button"
            aria-label="Previous still"
            onClick={() => go(index - 1)}
            disabled={index === 0}
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next still"
            onClick={() => go(index + 1)}
            disabled={index === count - 1}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
