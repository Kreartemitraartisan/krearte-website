"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 [LOGIN] Form submitted:', { email });
    
    setError("");
    setIsLoading(true);

    // ✅ Get callback URL
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    console.log('🔐 [LOGIN] Callback URL:', callbackUrl);

    try {
      console.log('🔐 [LOGIN] Calling signIn...');
      
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,  // ← Jangan auto redirect
      });

      console.log('🔐 [LOGIN] Result:', result);

      if (result?.error) {
        console.error('❌ [LOGIN] Error:', result.error);
        setError("Invalid email or password");
      } else {
        console.log('✅ [LOGIN] Success! Forcing hard reload...');
        
        // ✅ Force HARD RELOAD dengan timestamp untuk bypass cache
        // Ini akan force browser reload dan NextAuth re-fetch session dari cookie
        const redirectUrl = callbackUrl + '?t=' + Date.now();
        console.log('📍 [LOGIN] Redirecting to:', redirectUrl);
        
        window.location.href = redirectUrl;
        
        // Alternative: Kalau window.location tidak work, coba ini:
        // router.push(redirectUrl);
        // router.refresh();
      }
    } catch (err) {
      console.error('❌ [LOGIN] Exception:', err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Login Form */}
      <section className="py-12 md:py-24">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Header */}
              <div className="text-center mb-12">
                <h1 className="font-sans text-3xl md:text-4xl font-light mb-4">
                  Welcome Back
                </h1>
                <p className="text-krearte-gray-600 font-light">
                  Sign in to continue to your account
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-light rounded"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Email */}
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
                      className="w-full pl-12 pr-6 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-normal text-krearte-black mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-krearte-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-12 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-krearte-gray-400 hover:text-krearte-black transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-light text-krearte-gray-600 hover:text-krearte-black transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 text-sm font-medium transition-all duration-300 ${
                    isLoading
                      ? "bg-krearte-gray-300 cursor-not-allowed"
                      : "bg-krearte-black text-krearte-white hover:bg-krearte-charcoal"
                  }`}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>

                {/* Register Link */}
                <p className="text-center text-sm font-light text-krearte-gray-600">
                  Don't have an account?{" "}
                  <Link
                    href="/register"
                    className="text-krearte-black font-medium hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </form>

              {/* Divider */}
              <div className="relative my-12">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-krearte-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-krearte-cream text-krearte-gray-500 font-light">
                    or continue as guest
                  </span>
                </div>
              </div>

              {/* Guest Checkout */}
              <Link
                href="/checkout"
                className="w-full py-4 border border-krearte-black text-krearte-black text-sm font-medium hover:bg-krearte-black hover:text-krearte-white transition-all duration-300 text-center block"
              >
                Continue as Guest
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}