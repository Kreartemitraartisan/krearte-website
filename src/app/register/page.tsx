"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      // ⚠️ TODO: Replace with actual API call to create user
      // This is a demo implementation
      
      // Simulate registration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Auto sign in after registration
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Registration failed. Please try again.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
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

      {/* Register Form */}
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
                  Create Account
                </h1>
                <p className="text-krearte-gray-600 font-light">
                  Join Krearte for exclusive access and faster checkout
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

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-normal text-krearte-black mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-krearte-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-6 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-normal text-krearte-black mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-krearte-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
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
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
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

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-normal text-krearte-black mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-krearte-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-12 py-4 bg-krearte-white border border-krearte-gray-200 focus:outline-none focus:border-krearte-black transition-colors font-light"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-krearte-gray-400 hover:text-krearte-black transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    className="mt-1 w-4 h-4 border-krearte-gray-300 rounded focus:ring-krearte-black"
                  />
                  <label htmlFor="terms" className="text-sm font-light text-krearte-gray-600">
                    I agree to the{" "}
                    <Link href="/terms" className="text-krearte-black font-medium hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-krearte-black font-medium hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
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
                  {isLoading ? "Creating Account..." : "Create Account"}
                </button>

                {/* Login Link */}
                <p className="text-center text-sm font-light text-krearte-gray-600">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-krearte-black font-medium hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </form>

              {/* Benefits */}
              <div className="mt-12 pt-12 border-t border-krearte-gray-200">
                <h3 className="font-sans text-sm font-normal mb-6 text-center">
                  Why create an account?
                </h3>
                <ul className="space-y-4">
                  {[
                    "Faster checkout experience",
                    "Order history and tracking",
                    "Exclusive access to new collections",
                    "Save your favorite items",
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3 text-sm font-light text-krearte-gray-600">
                      <div className="w-1.5 h-1.5 bg-krearte-black rounded-full" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}