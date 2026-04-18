"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Mail, Lock, Chrome } from "lucide-react";

export default function LoginClient() {
  const { data:session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Get callbackUrl safely inside client component
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch (err) {
      setError("Failed to sign in with Google");
      setIsLoading(false);
    }
  };

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-krearte-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect if already logged in (extra safety)
  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-krearte-cream">
      {/* Back Navigation */}
      <div className="container mx-auto px-6 md:px-12 py-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-light text-krearte-gray-600 hover:text-krearte-black transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>
      </div>

      <section className="py-12 md:py-24">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="font-sans text-3xl md:text-4xl font-light mb-4">
                Welcome Back
              </h1>
              <p className="text-krearte-gray-600 font-light">
                Sign in to continue to Krearte
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-light rounded mb-6"
              >
                {error}
              </motion.div>
            )}

            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-krearte-gray-200 rounded-lg text-sm font-light text-krearte-black hover:bg-krearte-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              <Chrome className="w-5 h-5" />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-krearte-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-krearte-cream text-krearte-gray-500 font-light">
                  Or sign in with email
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-normal text-krearte-black mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-krearte-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light rounded-lg"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-normal text-krearte-black mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-krearte-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light rounded-lg"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link
                  href="/forgot-password"
                  className="text-krearte-black font-light hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-krearte-black text-krearte-white rounded-lg text-sm font-medium hover:bg-krearte-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Sign Up Link */}
            <p className="text-center text-sm font-light text-krearte-gray-600 mt-8">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-krearte-black font-normal hover:underline"
              >
                Create one
              </Link>
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}