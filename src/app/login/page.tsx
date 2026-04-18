import { Suspense } from "react";
import LoginClient from "./login-client";

// ⚠️ Login needs dynamic data (sessions, callbacks)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-krearte-black border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginClient />
    </Suspense>
  );
}