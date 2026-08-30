"use client";
import React from "react";
import { SessionProvider } from "next-auth/react";

/**
 * Keep session basePath relative so local/prod hosts both work.
 * A mis-set NEXTAUTH_URL (e.g. OAuth callback path) must not break client session.
 */
const AuthProvider = ({ children }) => {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchInterval={0}
      // Relative URL — do not depend on NEXTAUTH_URL for client fetches
      basePath="/api/auth"
    >
      {children}
    </SessionProvider>
  );
};

export default AuthProvider;
