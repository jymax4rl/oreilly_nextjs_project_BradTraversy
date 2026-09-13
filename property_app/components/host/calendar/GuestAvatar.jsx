export default function GuestAvatar({ name, src, large = false }) {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <span className={`rc-av${large ? " rc-av--lg" : ""}`} aria-hidden>
      {src ? <img src={src} alt="" /> : initials}
    </span>
  );
}
