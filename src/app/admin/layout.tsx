// app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { 
  Package, ShoppingCart, Users, BarChart3, Settings,
  LogOut, Menu, X, Image as ImageIcon, Home
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        
        if (!data?.user) {
          router.push("/login?callbackUrl=/admin");
          return;
        }
        
        if (data.user.role !== "admin") {
          router.push("/");
          return;
        }
        
        setSession(data);
      } catch (error) {
        console.error("Error fetching session:", error);
        router.push("/login?callbackUrl=/admin");
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-krearte-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-krearte-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: BarChart3 },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Gallery", href: "/admin/gallery", icon: ImageIcon },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-krearte-cream">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-krearte-black text-krearte-white transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-krearte-gray-800">
            <Link href="/admin" className="font-sans text-xl font-normal">KREARTE ADMIN</Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-krearte-gray-400"><X className="w-6 h-6" /></button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-3 text-sm font-light rounded-lg transition-colors ${isActive ? "bg-krearte-gray-800 text-krearte-white" : "text-krearte-gray-300 hover:bg-krearte-gray-800"}`}>
                  <Icon className="w-5 h-5" />{item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-krearte-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-krearte-gray-700 rounded-full flex items-center justify-center">
                <span className="text-sm">{session?.user?.name?.charAt(0).toUpperCase() || "A"}</span>
              </div>
              <div>
                <p className="text-sm font-medium">{session?.user?.name || "Admin"}</p>
                <p className="text-xs text-krearte-gray-400">{session?.user?.email}</p>
              </div>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-krearte-gray-300 hover:bg-krearte-gray-800 rounded-lg">
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-krearte-white border-b border-krearte-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu className="w-6 h-6" /></button>
            <Link href="/" target="_blank" className="text-sm text-krearte-gray-600 flex items-center gap-2">
              <Home className="w-4 h-4" /> View Website
            </Link>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}