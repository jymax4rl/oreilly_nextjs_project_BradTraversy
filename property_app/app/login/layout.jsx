import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in or sign up",
  description:
    "Sign in to Kama Properties with Google to book stays, save favorites, message hosts, or list your property.",
};

export default function LoginLayout({ children }) {
  return children;
}
