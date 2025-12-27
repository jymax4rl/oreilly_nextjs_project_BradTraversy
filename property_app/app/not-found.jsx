import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 px-4 text-center">
      {/* Container */}
      <div className="relative z-10 max-w-md w-full">
        {/* Background '404' Text Effect */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 select-none pointer-events-none">
          <span className="text-[12rem] font-black text-gray-900 leading-none">
            404
          </span>
        </div>

        {/* Content */}
        <div className="relative space-y-6 pt-12">
          <div className="mx-auto h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center ring-8 ring-white shadow-sm mb-6">
            <svg
              className="h-10 w-10 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Page not found
            </h2>
            <p className="text-gray-500">
              Sorry, we couldn't find the page you're looking for. It might have
              been moved or doesn't exist.
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
            >
              <svg
                className="h-4 w-4 transition-transform group-hover:-translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Return Home
            </Link>
          </div>
        </div>
      </div>

      {/* Footer / Support Link (Optional) */}
      <div className="absolute bottom-8 text-center text-sm text-gray-400">
        <p>
          Need help?{" "}
          <a href="#" className="underline hover:text-gray-600">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
