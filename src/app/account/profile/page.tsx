"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, Mail, Phone, MapPin, Lock, Save, Loader2, ChevronLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  
  // Show password toggle
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile Form
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });

  // Password Form
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    wishlistItems: 0,
  });

  // Debug log
  console.log('🔍 ProfilePage render', {
    status,
    hasSession: !!session?.user,
    userEmail: session?.user?.email,
  });

  // ✅ Fetch user data from API
  const fetchUserData = async () => {
    try {
      console.log('📡 [STEP 1] fetchUserData called');
      console.log('📡 [STEP 2] Fetching from API...');
      
      const response = await fetch("/api/account/profile");
      console.log('📡 [STEP 3] Response received:', response.status);
      
      const result = await response.json();
      console.log('📡 [STEP 4] API result:', result);
      
      if (result.success && result.user) {
        console.log('📡 [STEP 5] Setting profile ', result.user);
        
        setProfileData({
          name: result.user.name || "",
          email: result.user.email || "",
          phone: result.user.phone || "",
          address: result.user.address || "",
          city: result.user.city || "",
          postalCode: result.user.postalCode || "",
        });
        
        console.log('✅ Profile data loaded successfully!');
        console.log('📋 Profile data:', {
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          address: result.user.address,
          city: result.user.city,
          postalCode: result.user.postalCode,
        });
      } else {
        console.error('❌ API returned success: false or no user');
      }
    } catch (error) {
      console.error('❌ Error fetching user ', error);
    }
  };

  // ✅ Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/account/stats");
      const result = await response.json();
      
      if (result.success) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // ✅ Simple approach - just fetch on mount
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/account/profile");
      return;
    }

    if (status === "authenticated") {
      console.log('📡 Authenticated, fetching profile data...');
      fetchUserData();
      fetchStats();
    }
  }, [status, router]);  // ← Remove session from dependencies

  // ✅ Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "profile",
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          postalCode: profileData.postalCode,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess("✅ Profile updated successfully!");
        await update();
      } else {
        setError(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "password",
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess("✅ Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setError(result.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Password update error:", error);
      setError("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-krearte-black" />
      </div>
    );
  }

  // Render
  return (
    <div className="min-h-screen bg-krearte-cream py-12">
      <div className="container mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm text-krearte-gray-600 hover:text-krearte-black mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to My Account
          </Link>
          <h1 className="font-sans text-4xl font-light mb-2">My Profile</h1>
          <p className="text-krearte-gray-600 font-light">
            Manage your account information and settings
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-600 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Profile Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-krearte-gray-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-krearte-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-krearte-gray-600" />
                </div>
                <div>
                  <h2 className="font-medium text-krearte-black">{profileData.name || "User"}</h2>
                  <p className="text-sm text-krearte-gray-500">{profileData.email}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-4 pt-4 border-t border-krearte-gray-200">
                <div className="flex justify-between">
                  <span className="text-sm text-krearte-gray-600">Total Orders</span>
                  <span className="font-medium text-krearte-black">{stats.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-krearte-gray-600">Total Spent</span>
                  <span className="font-medium text-krearte-black">{formatCurrency(stats.totalSpent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-krearte-gray-600">Wishlist Items</span>
                  <span className="font-medium text-krearte-black">{stats.wishlistItems}</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-krearte-gray-200">
              <h3 className="font-medium text-krearte-black mb-4">Quick Links</h3>
              <nav className="space-y-2">
                <Link
                  href="/account/orders"
                  className="block px-4 py-3 text-sm text-krearte-gray-600 hover:bg-krearte-gray-50 rounded-lg transition-colors"
                >
                  Order History
                </Link>
                <Link
                  href="/account/wishlist"
                  className="block px-4 py-3 text-sm text-krearte-gray-600 hover:bg-krearte-gray-50 rounded-lg transition-colors"
                >
                  Wishlist
                </Link>
              </nav>
            </div>
          </div>

          {/* RIGHT: Profile Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Information Form */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-krearte-gray-200">
              <h2 className="font-sans text-xl font-normal mb-6 flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </h2>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-normal text-krearte-black mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-krearte-gray-400" />
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        required
                        className="w-full pl-12 pr-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black font-light"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-krearte-black mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-krearte-gray-400" />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        required
                        className="w-full pl-12 pr-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black font-light"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-krearte-black mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-krearte-gray-400" />
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black font-light"
                        placeholder="+62 xxx xxxx xxxx"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-krearte-black mb-2">
                      City
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-krearte-gray-400" />
                      <input
                        type="text"
                        value={profileData.city}
                        onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black font-light"
                        placeholder="Jakarta"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-normal text-krearte-black mb-2">
                    Address
                  </label>
                  <textarea
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black font-light"
                    placeholder="Street address, apartment, suite, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-normal text-krearte-black mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={profileData.postalCode}
                    onChange={(e) => setProfileData({ ...profileData, postalCode: e.target.value })}
                    className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black font-light"
                    placeholder="12345"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-3 bg-krearte-black text-white font-medium rounded-lg hover:bg-krearte-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-krearte-gray-200">
              <h2 className="font-sans text-xl font-normal mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </h2>

              <form onSubmit={handlePasswordUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-normal text-krearte-black mb-2">
                    Current Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-krearte-gray-400" />
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                      className="w-full pl-12 pr-12 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black font-light"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-krearte-gray-400 hover:text-krearte-black"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-normal text-krearte-black mb-2">
                      New Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-krearte-gray-400" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        required
                        className="w-full pl-12 pr-12 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black font-light"
                        placeholder="Min. 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-krearte-gray-400 hover:text-krearte-black"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-krearte-black mb-2">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-krearte-gray-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        required
                        className="w-full pl-12 pr-12 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black font-light"
                        placeholder="Re-enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-krearte-gray-400 hover:text-krearte-black"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-3 bg-krearte-black text-white font-medium rounded-lg hover:bg-krearte-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Change Password
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}