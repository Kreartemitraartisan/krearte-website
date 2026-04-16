import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/ui/smooth-scroll";
import { Header } from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { CartProvider } from "@/lib/cart/context";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SessionProvider } from "@/lib/auth/session-provider";
import { WishlistProvider } from "@/lib/wishlist/context";

// 🎨 Font Setup (Elegant pairing: Inter + Playfair Display)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

// 📄 Metadata (SEO)
export const metadata: Metadata = {
  title: "Krearte | Luxury Wallcoverings & Accessories",
  description: "Handcrafted luxury wallcoverings and accessories. Made with passion, designed for elegant spaces.",
  keywords: ["luxury", "wallcovering", "fashion", "accessories", "krearte"],
  authors: [{ name: "Krearte" }],
  openGraph: {
    title: "Krearte | Luxury Wallcoverings & Accessories",
    description: "Handcrafted luxury wallcoverings and accessories.",
    type: "website",
    locale: "en_US",
  },
};

// 🏗️ Root Layout
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased text-krearte-black bg-krearte-cream">
        <SessionProvider>
          <CartProvider>
            <WishlistProvider>
              <SmoothScroll>
                <Header />
                <main className="pt-16 md:pt-20 min-h-screen">
                  {children}
                </main>
                <Footer />
                <CartDrawer />
              </SmoothScroll>
            </WishlistProvider>
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}