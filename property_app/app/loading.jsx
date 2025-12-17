export default function Loading() {
  return (
    <div className="flex items-center gap-3 flex-col justify-center py-24">
      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <h3 className="text-1xl">Loading Kama Properties...</h3>
    </div>
  );
}
