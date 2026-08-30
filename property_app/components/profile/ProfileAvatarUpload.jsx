"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Camera, Loader2 } from "lucide-react";

/**
 * Profile avatar with camera overlay → POST /api/user/profile/avatar.
 * Calls session.update() so Navbar picks up the new image.
 */
export default function ProfileAvatarUpload({
  initialImage,
  initialName = "U",
}) {
  const { update } = useSession();
  const inputRef = useRef(null);
  const [image, setImage] = useState(initialImage || null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const displaySrc = preview || image;
  const initial = (initialName || "U").charAt(0).toUpperCase();

  const onPick = () => {
    if (uploading) return;
    inputRef.current?.click();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file (JPEG, PNG, WebP, or GIF).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    setError("");
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const body = new FormData();
      body.append("avatar", file);
      const res = await fetch("/api/user/profile/avatar", {
        method: "POST",
        body,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }
      const data = await res.json();
      const next = data.image || data.profile?.image;
      if (next) setImage(next);
      setPreview(null);
      await update();
    } catch (err) {
      setError(err.message || "Could not upload photo");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={onPick}
        disabled={uploading}
        className="kama-focus-ring group relative h-[88px] w-[88px] overflow-hidden rounded-2xl ring-2 ring-[var(--kama-accent-soft)] disabled:opacity-70"
        aria-label="Change profile photo"
      >
        {displaySrc ? (
          <Image
            src={displaySrc}
            alt=""
            width={88}
            height={88}
            className="h-full w-full object-cover"
            unoptimized={Boolean(preview)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-[var(--kama-accent)] text-3xl font-semibold text-white">
            {initial}
          </span>
        )}

        <span className="absolute inset-0 flex items-center justify-center bg-[rgba(12,26,26,0.45)] opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
          {uploading ? (
            <Loader2
              className="h-7 w-7 animate-spin text-white"
              aria-hidden
            />
          ) : (
            <Camera className="h-7 w-7 text-white" aria-hidden />
          )}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={onFile}
      />

      <button
        type="button"
        onClick={onPick}
        disabled={uploading}
        className="text-xs font-medium text-[var(--kama-accent)] hover:underline disabled:opacity-60"
      >
        {uploading ? "Uploading…" : displaySrc ? "Change photo" : "Add photo"}
      </button>

      {error && (
        <p className="max-w-[12rem] text-xs text-[var(--kama-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
