export default function Loading() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-24"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
        aria-hidden
      />
      <span className="sr-only">Loading</span>
    </div>
  );
}
