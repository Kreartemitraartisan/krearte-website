"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Settings as SettingsIcon, 
  Store, 
  User, 
  Truck, 
  CreditCard, 
  Search,
  Loader2,
  Save,
  Mail,
  Phone,
  MapPin,
  Globe,
  Instagram,
  Facebook,
  Twitter
} from "lucide-react";

export default function AdminSettingsPage() {
  const router = useRouter();
  const {  session, update: updateSession } = useSession();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("store");

  // Store Settings
  const [storeSettings, setStoreSettings] = useState({
    storeName: "Krearte",
    storeEmail: "hello@krearte.com",
    storePhone: "",
    storeAddress: "",
    storeDescription: "",
    currency: "IDR",
    timezone: "Asia/Jakarta",
  });

  // Social Media
  const [socialMedia, setSocialMedia] = useState({
    instagram: "",
    facebook: "",
    twitter: "",
    website: "",
  });

  // Shipping Settings
  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: 5000000,
    domesticShippingRate: 50000,
    internationalShippingRate: 500000,
    processingTime: "3-5",
  });

  // SEO Settings
  const [seoSettings, setSeoSettings] = useState({
    metaTitle: "Krearte | Luxury Wallcoverings & Accessories",
    metaDescription: "Handcrafted luxury wallcoverings and accessories. Made with passion, designed for elegant spaces.",
    keywords: "luxury, wallcovering, fashion, accessories, krearte",
    ogImage: "",
  });

  // Admin Profile
  const [adminProfile, setAdminProfile] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
    if (session?.user) {
      setAdminProfile(prev => ({
        ...prev,
        name: session.user.name || "",
        email: session.user.email || "",
      }));
    }
  }, [session]);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      const result = await response.json();

      if (result.success && result.settings) {
        const s = result.settings;
        setStoreSettings({
          storeName: s.storeName || "Krearte",
          storeEmail: s.storeEmail || "hello@krearte.com",
          storePhone: s.storePhone || "",
          storeAddress: s.storeAddress || "",
          storeDescription: s.storeDescription || "",
          currency: s.currency || "IDR",
          timezone: s.timezone || "Asia/Jakarta",
        });
        setSocialMedia({
          instagram: s.instagram || "",
          facebook: s.facebook || "",
          twitter: s.twitter || "",
          website: s.website || "",
        });
        setShippingSettings({
          freeShippingThreshold: s.freeShippingThreshold || 5000000,
          domesticShippingRate: s.domesticShippingRate || 50000,
          internationalShippingRate: s.internationalShippingRate || 500000,
          processingTime: s.processingTime || "3-5",
        });
        setSeoSettings({
          metaTitle: s.metaTitle || "Krearte | Luxury Wallcoverings",
          metaDescription: s.metaDescription || "",
          keywords: s.keywords || "",
          ogImage: s.ogImage || "",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleSaveStore = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "store",
          ...storeSettings,
          ...socialMedia,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Store settings saved!");
      } else {
        alert("❌ Failed to save: " + result.error);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("❌ Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveShipping = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "shipping",
          ...shippingSettings,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Shipping settings saved!");
      } else {
        alert("❌ Failed to save: " + result.error);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("❌ Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSeo = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "seo",
          ...seoSettings,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ SEO settings saved!");
      } else {
        alert("❌ Failed to save: " + result.error);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("❌ Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (adminProfile.newPassword && adminProfile.newPassword !== adminProfile.confirmPassword) {
      alert("❌ Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: adminProfile.name,
          email: adminProfile.email,
          currentPassword: adminProfile.currentPassword,
          newPassword: adminProfile.newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Profile updated!");
        setAdminProfile(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        await updateSession();
      } else {
        alert("❌ Failed to update: " + result.error);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("❌ Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const tabs = [
    { id: "store", label: "Store Settings", icon: Store },
    { id: "shipping", label: "Shipping", icon: Truck },
    { id: "seo", label: "SEO & Meta", icon: Search },
    { id: "profile", label: "Admin Profile", icon: User },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">Settings</h1>
        <p className="text-krearte-gray-600">Manage your store configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-krearte-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-krearte-black border-b-2 border-krearte-black"
                  : "text-krearte-gray-500 hover:text-krearte-black"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg p-8 shadow-sm border border-krearte-gray-200">
        {/* Store Settings */}
        {activeTab === "store" && (
          <div className="space-y-6">
            <h2 className="text-xl font-light mb-6 flex items-center gap-2">
              <Store className="w-5 h-5" />
              Store Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-normal mb-2">Store Name</label>
                <input
                  type="text"
                  value={storeSettings.storeName}
                  onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                  className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                />
              </div>

              <div>
                <label className="block text-sm font-normal mb-2">Store Email</label>
                <input
                  type="email"
                  value={storeSettings.storeEmail}
                  onChange={(e) => setStoreSettings({ ...storeSettings, storeEmail: e.target.value })}
                  className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                />
              </div>

              <div>
                <label className="block text-sm font-normal mb-2">Phone</label>
                <input
                  type="text"
                  value={storeSettings.storePhone}
                  onChange={(e) => setStoreSettings({ ...storeSettings, storePhone: e.target.value })}
                  className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                />
              </div>

              <div>
                <label className="block text-sm font-normal mb-2">Currency</label>
                <select
                  value={storeSettings.currency}
                  onChange={(e) => setStoreSettings({ ...storeSettings, currency: e.target.value })}
                  className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                >
                  <option value="IDR">IDR - Indonesian Rupiah</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-normal mb-2">Address</label>
                <input
                  type="text"
                  value={storeSettings.storeAddress}
                  onChange={(e) => setStoreSettings({ ...storeSettings, storeAddress: e.target.value })}
                  className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-normal mb-2">Description</label>
                <textarea
                  value={storeSettings.storeDescription}
                  onChange={(e) => setStoreSettings({ ...storeSettings, storeDescription: e.target.value })}
                  className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                  rows={4}
                />
              </div>
            </div>

            {/* Social Media */}
            <div className="mt-8 pt-8 border-t border-krearte-gray-200">
              <h3 className="text-lg font-light mb-4">Social Media</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-normal mb-2 flex items-center gap-2">
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={socialMedia.instagram}
                    onChange={(e) => setSocialMedia({ ...socialMedia, instagram: e.target.value })}
                    placeholder="https://instagram.com/krearte"
                    className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-normal mb-2 flex items-center gap-2">
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={socialMedia.facebook}
                    onChange={(e) => setSocialMedia({ ...socialMedia, facebook: e.target.value })}
                    placeholder="https://facebook.com/krearte"
                    className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-normal mb-2 flex items-center gap-2">
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </label>
                  <input
                    type="text"
                    value={socialMedia.twitter}
                    onChange={(e) => setSocialMedia({ ...socialMedia, twitter: e.target.value })}
                    placeholder="https://twitter.com/krearte"
                    className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-normal mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Website
                  </label>
                  <input
                    type="text"
                    value={socialMedia.website}
                    onChange={(e) => setSocialMedia({ ...socialMedia, website: e.target.value })}
                    placeholder="https://krearte.com"
                    className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={handleSaveStore}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-krearte-black text-white rounded-lg hover:bg-krearte-charcoal disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {loading ? "Saving..." : "Save Store Settings"}
              </button>
            </div>
          </div>
        )}

        {/* Shipping Settings */}
        {activeTab === "shipping" && (
          <div className="space-y-6">
            <h2 className="text-xl font-light mb-6 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Shipping Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-normal mb-2">Free Shipping Threshold (IDR)</label>
                <input
                  type="number"
                  value={shippingSettings.freeShippingThreshold}
                  onChange={(e) => setShippingSettings({ ...shippingSettings, freeShippingThreshold: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                />
                <p className="text-xs text-krearte-gray-500 mt-1">
                  Orders above {formatCurrency(shippingSettings.freeShippingThreshold)} get free shipping
                </p>
              </div>

              <div>
                <label className="block text-sm font-normal mb-2">Domestic Shipping Rate (IDR)</label>
                <input
                  type="number"
                  value={shippingSettings.domesticShippingRate}
                  onChange={(e) => setShippingSettings({ ...shippingSettings, domesticShippingRate: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                />
              </div>

              <div>
                <label className="block text-sm font-normal mb-2">International Shipping Rate (IDR)</label>
                <input
                  type="number"
                  value={shippingSettings.internationalShippingRate}
                  onChange={(e) => setShippingSettings({ ...shippingSettings, internationalShippingRate: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                />
              </div>

              <div>
                <label className="block text-sm font-normal mb-2">Processing Time (days)</label>
                <input
                  type="text"
                  value={shippingSettings.processingTime}
                  onChange={(e) => setShippingSettings({ ...shippingSettings, processingTime: e.target.value })}
                  placeholder="e.g., 3-5"
                  className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                />
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={handleSaveShipping}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-krearte-black text-white rounded-lg hover:bg-krearte-charcoal disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {loading ? "Saving..." : "Save Shipping Settings"}
              </button>
            </div>
          </div>
        )}

        {/* SEO Settings */}
        {activeTab === "seo" && (
          <div className="space-y-6">
            <h2 className="text-xl font-light mb-6 flex items-center gap-2">
              <Search className="w-5 h-5" />
              SEO & Meta Tags
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-normal mb-2">Meta Title</label>
                <input
                  type="text"
                  value={seoSettings.metaTitle}
                  onChange={(e) => setSeoSettings({ ...seoSettings, metaTitle: e.target.value })}
                  className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                />
                <p className="text-xs text-krearte-gray-500 mt-1">
                  {seoSettings.metaTitle.length} / 60 characters recommended
                </p>
              </div>

              <div>
                <label className="block text-sm font-normal mb-2">Meta Description</label>
                <textarea
                  value={seoSettings.metaDescription}
                  onChange={(e) => setSeoSettings({ ...seoSettings, metaDescription: e.target.value })}
                  className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                  rows={4}
                />
                <p className="text-xs text-krearte-gray-500 mt-1">
                  {seoSettings.metaDescription.length} / 160 characters recommended
                </p>
              </div>

              <div>
                <label className="block text-sm font-normal mb-2">Keywords</label>
                <input
                  type="text"
                  value={seoSettings.keywords}
                  onChange={(e) => setSeoSettings({ ...seoSettings, keywords: e.target.value })}
                  placeholder="luxury, wallcovering, fashion, accessories"
                  className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                />
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={handleSaveSeo}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-krearte-black text-white rounded-lg hover:bg-krearte-charcoal disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {loading ? "Saving..." : "Save SEO Settings"}
              </button>
            </div>
          </div>
        )}

        {/* Admin Profile */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <h2 className="text-xl font-light mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              Admin Profile
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-normal mb-2">Name</label>
                <input
                  type="text"
                  value={adminProfile.name}
                  onChange={(e) => setAdminProfile({ ...adminProfile, name: e.target.value })}
                  className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                />
              </div>

              <div>
                <label className="block text-sm font-normal mb-2">Email</label>
                <input
                  type="email"
                  value={adminProfile.email}
                  onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })}
                  className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-krearte-gray-200">
              <h3 className="text-lg font-light mb-4">Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-normal mb-2">Current Password</label>
                  <input
                    type="password"
                    value={adminProfile.currentPassword}
                    onChange={(e) => setAdminProfile({ ...adminProfile, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                  />
                </div>

                <div></div>

                <div>
                  <label className="block text-sm font-normal mb-2">New Password</label>
                  <input
                    type="password"
                    value={adminProfile.newPassword}
                    onChange={(e) => setAdminProfile({ ...adminProfile, newPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-normal mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={adminProfile.confirmPassword}
                    onChange={(e) => setAdminProfile({ ...adminProfile, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-krearte-black text-white rounded-lg hover:bg-krearte-charcoal disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {loading ? "Saving..." : "Save Profile Changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}