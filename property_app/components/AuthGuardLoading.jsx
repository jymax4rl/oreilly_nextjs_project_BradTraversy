"use client";
import { useSession } from "next-auth/react";

// LOCK ICON
const LockIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const AuthLoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full bg-gray-50/50">
      {/* Inject custom animations scoped to this component */}
      <style>{`
        @keyframes progress-indeterminate {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 70%; margin-left: 30%; }
          100% { width: 0%; margin-left: 100%; }
        }
        .animate-progress-indeterminate {
          animation: progress-indeterminate 1.5s infinite ease-in-out;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite ease-in-out;
        }
      `}</style>

      <div className="relative flex items-center justify-center">
        {/* Decorative background glow */}
        <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>

        {/* Outer Ring - Static */}
        <div className="w-24 h-24 border-4 border-blue-100 rounded-full"></div>

        {/* Active Ring - Spinning */}
        <div className="absolute w-24 h-24 border-4 border-transparent border-t-blue-600 border-r-blue-600 rounded-full animate-spin"></div>

        {/* Inner Icon - Pulsing */}
        <div className="absolute text-blue-600">
          <LockIcon className="w-8 h-8 animate-bounce-subtle" />
        </div>
      </div>

      <div className="mt-12 space-y-3 text-center">
        <h2 className="text-xl font-semibold text-gray-900 animate-pulse">
          Verifying Session
        </h2>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Please wait while we securely log you in.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mt-8 h-1 w-48 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 animate-progress-indeterminate"></div>
      </div>
    </div>
  );
};
// --- Main Export ---

export default function AuthGuard({ children }) {
  // requires: true forces a signin if unauthenticated
  const { status } = useSession({ required: true });

  if (status === "loading") {
    return <AuthLoadingScreen />;
  }

  return children;
}
