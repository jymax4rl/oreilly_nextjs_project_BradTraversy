"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { X } from "lucide-react";
import GoogleIcon from "@/components/auth/GoogleIcon";
import KamaLogo from "@/assets/images/Kama logo - blue.svg";
import heroImage from "@/assets/images/modernMansion01.png";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, callbackUrl, router]);

  const handleGoogleSignIn = () => {
    setLoading(true);
    signIn("google", { callbackUrl });
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 lg:flex-row">
      {/* Hero — desktop */}
      <div className="relative hidden min-h-dvh flex-1 overflow-hidden lg:block">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="50vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(8,10,40,0.35) 0%, rgba(79,70,229,0.55) 50%, rgba(7,8,28,0.85) 100%)",
          }}
          aria-hidden
        />
        <div className="relative z-10 flex h-full flex-col justify-end p-12 text-white">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
            Kama Properties
          </p>
          <h2 className="max-w-md text-4xl font-extrabold leading-tight">
            African stays.
            <br />
            <span className="text-amber-300">Global guests.</span>
          </h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-white/80">
            Book unique homes across the continent — or open your doors to
            travelers with Mobile Money–friendly payments.
          </p>
        </div>
      </div>

      {/* Auth panel */}
      <div className="relative flex flex-1 flex-col px-6 py-8 sm:px-10 lg:max-w-[520px] lg:px-14 lg:py-12">
        <Link
          href="/"
          className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 lg:left-6"
          aria-label="Close and return home"
        >
          <X className="h-5 w-5" />
        </Link>

        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center pt-10 lg:pt-0">
          <div className="mb-10 flex justify-center lg:justify-start">
            <Image
              src={KamaLogo}
              alt="Kama Properties"
              width={140}
              height={48}
              className="h-11 w-auto"
              priority
            />
          </div>

          <h1 className="text-center text-[1.65rem] font-semibold tracking-tight text-zinc-900 lg:text-left lg:text-3xl">
            Log in or sign up
          </h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-zinc-500 lg:text-left">
            One account for booking stays, saving favorites, messaging hosts,
            and listing your property.
          </p>

          {error ? (
            <div
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              Sign-in failed. Please try again.
            </div>
          ) : null}

          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border border-zinc-300 bg-white text-[15px] font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
              ) : (
                <GoogleIcon />
              )}
              {loading ? "Connecting…" : "Continue with Google"}
            </button>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-zinc-50 px-3 text-zinc-400">or</span>
            </div>
          </div>

          <Link
            href="/"
            className="flex h-[52px] w-full items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-[15px] font-medium text-zinc-700 transition hover:bg-zinc-200/80"
          >
            Browse without signing in
          </Link>

          <p className="mt-8 text-center text-xs leading-relaxed text-zinc-400 lg:text-left">
            By continuing, you agree to Kama Properties&apos; terms of service
            and privacy policy. We&apos;ll create an account automatically if
            you&apos;re new.
          </p>
        </div>

        {/* Mobile hero strip */}
        <div className="relative mt-8 h-32 overflow-hidden rounded-2xl lg:hidden">
          <Image
            src={heroImage}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 to-indigo-900/20" />
          <p className="absolute bottom-4 left-4 right-4 text-sm font-medium text-white/90">
            Made for Africans, by Africans.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-zinc-50">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
