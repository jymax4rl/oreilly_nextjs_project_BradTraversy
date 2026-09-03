"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, LayoutGrid, Mic, X } from "lucide-react";

import { propertyImageUrl, propertyAudioUrl } from "@/utils/propertyImageUrl";
import PropertyShareButton from "@/components/PropertyShareButton";

function imageSrc(filename) {
  return propertyImageUrl(filename);
}

function GalleryOpenButton({ count, onClick, className = "" }) {
  if (count < 1) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-lg bg-black/55 px-2.5 py-2 text-white backdrop-blur-md transition hover:bg-black/70 ${className}`}
      aria-label={`View all ${count} media items`}
    >
      <LayoutGrid size={18} strokeWidth={2} aria-hidden />
      {count > 1 ? (
        <span className="text-xs font-semibold tabular-nums">{count}</span>
      ) : null}
    </button>
  );
}

function PropertyImageCarousel({ slides, propertyName, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const [touchStartX, setTouchStartX] = useState(null);
  const total = slides.length;

  const go = useCallback(
    (delta) => {
      setIndex((i) => (i + delta + total) % total);
    },
    [total],
  );

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [go, onClose]);

  const current = slides[index];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={`${propertyName} media`}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <p className="text-sm font-medium text-white/90">
          <span className="text-white">{index + 1}</span>
          <span className="text-white/50"> / {total}</span>
          {current?.kind === "audio" ? (
            <span className="ml-2 text-white/60">Audio tour</span>
          ) : null}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Close gallery"
        >
          <X size={22} />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16"
        onClick={onClose}
      >
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25 sm:left-4"
              aria-label="Previous"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25 sm:right-4"
              aria-label="Next"
            >
              <ChevronRight size={28} />
            </button>
          </>
        )}

        <div
          className="relative flex h-full w-full max-h-[min(70vh,720px)] max-w-5xl touch-pan-y items-center justify-center"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStartX == null) return;
            const delta = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(delta) > 50) go(delta > 0 ? -1 : 1);
            setTouchStartX(null);
          }}
        >
          {current?.kind === "audio" ? (
            <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl bg-white/10 px-6 py-10 text-white">
              <Mic className="h-10 w-10 text-[var(--kama-accent)]" aria-hidden />
              <p className="text-sm font-medium">Audio tour</p>
              <audio controls src={current.src} className="w-full" />
            </div>
          ) : (
            <div className="relative h-full w-full">
              <Image
                key={current?.key}
                src={current?.src}
                alt={`${propertyName} — photo ${index + 1}`}
                fill
                priority
                quality={90}
                sizes="100vw"
                className="object-contain"
                draggable={false}
              />
            </div>
          )}
        </div>
      </div>

      {total > 1 && (
        <div
          className="shrink-0 border-t border-white/10 px-4 py-3 sm:px-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto flex max-w-4xl gap-2 overflow-x-auto pb-1">
            {slides.map((slide, i) => (
              <button
                key={slide.key}
                type="button"
                onClick={() => setIndex(i)}
                className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-14 sm:w-20 ${
                  i === index
                    ? "border-[var(--kama-accent)]"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
                aria-label={
                  slide.kind === "audio"
                    ? "View audio tour"
                    : `View photo ${i + 1}`
                }
                aria-current={i === index}
              >
                {slide.kind === "audio" ? (
                  <span className="flex h-full w-full items-center justify-center bg-zinc-800 text-white">
                    <Mic size={18} aria-hidden />
                  </span>
                ) : (
                  <Image
                    src={slide.src}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PropertyImageGallery({
  images = [],
  propertyName,
  audio = null,
}) {
  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const galleryImages = useMemo(() => {
    const list = (images || []).filter(Boolean);
    return list.length > 0 ? list : ["default.jpg"];
  }, [images]);

  const audioSrc = useMemo(() => propertyAudioUrl(audio), [audio]);

  const slides = useMemo(() => {
    const imageSlides = galleryImages.map((file, i) => ({
      kind: "image",
      key:
        typeof file === "string"
          ? `${file}-${i}`
          : `${file?.url || file?.publicId || "image"}-${i}`,
      src: imageSrc(file),
      file,
    }));
    if (audioSrc) {
      imageSlides.push({
        kind: "audio",
        key: "audio-tour",
        src: audioSrc,
      });
    }
    return imageSlides;
  }, [galleryImages, audioSrc]);

  const openAt = (idx = 0) => {
    setStartIndex(idx);
    setOpen(true);
  };

  const count = galleryImages.length;
  const extraCount = Math.max(0, count - 4);

  return (
    <>
      {/* Mobile: single hero */}
      <div className="relative h-[min(56vw,260px)] overflow-hidden rounded-2xl bg-slate-100 md:hidden">
        <button
          type="button"
          onClick={() => openAt(0)}
          className="relative block h-full w-full cursor-pointer"
          aria-label="View photos"
        >
          <Image
            src={imageSrc(galleryImages[0])}
            alt={propertyName}
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover"
          />
        </button>
        <PropertyShareButton
          title={propertyName}
          variant="icon"
          className="left-3 top-3"
        />
        <GalleryOpenButton count={slides.length} onClick={() => openAt(0)} />
        {audioSrc ? (
          <button
            type="button"
            onClick={() => openAt(slides.length - 1)}
            className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-lg bg-black/55 px-2.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-black/70"
            aria-label="Play audio tour"
          >
            <Mic size={14} aria-hidden />
            Audio
          </button>
        ) : null}
      </div>

      {/* Desktop: bento */}
      <div className="hidden h-[400px] grid-cols-4 gap-3 overflow-hidden rounded-2xl md:grid lg:h-[460px]">
        <div className="group relative bg-slate-100 md:col-span-2">
          <button
            type="button"
            onClick={() => openAt(0)}
            className="relative block h-full w-full cursor-pointer"
            aria-label="View photos"
          >
            <Image
              src={imageSrc(galleryImages[0])}
              alt={propertyName}
              fill
              priority
              quality={90}
              sizes="50vw"
              className="object-cover transition duration-300 group-hover:scale-[1.01]"
            />
          </button>
          <PropertyShareButton
            title={propertyName}
            variant="icon"
            className="left-3 top-3"
          />
          <GalleryOpenButton count={slides.length} onClick={() => openAt(0)} />
          {audioSrc ? (
            <button
              type="button"
              onClick={() => openAt(slides.length - 1)}
              className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-lg bg-black/55 px-2.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-black/70"
              aria-label="Play audio tour"
            >
              <Mic size={14} aria-hidden />
              Audio tour
            </button>
          ) : null}
        </div>

        <div className="grid grid-rows-2 gap-3 md:col-span-1">
          {[1, 2].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => openAt(i)}
              className="group relative cursor-pointer bg-slate-100"
              aria-label={`View photo ${i + 1}`}
            >
              <Image
                src={imageSrc(galleryImages[i] || galleryImages[0])}
                alt=""
                fill
                quality={90}
                sizes="25vw"
                className="object-cover transition group-hover:scale-[1.02]"
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => openAt(Math.min(3, count - 1))}
          className="group relative cursor-pointer bg-slate-100 md:col-span-1"
          aria-label="View photos"
        >
          <Image
            src={imageSrc(galleryImages[3] || galleryImages[0])}
            alt=""
            fill
            quality={90}
            sizes="25vw"
            className="object-cover"
          />
          {extraCount > 0 && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/50 text-sm font-medium text-white">
              +{extraCount}
            </span>
          )}
        </button>
      </div>

      {open && (
        <PropertyImageCarousel
          slides={slides}
          propertyName={propertyName}
          initialIndex={startIndex}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
