import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// 🎨 CLASSNAME MERGER (Combine Tailwind classes cleanly)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 💰 FORMAT CURRENCY (IDR format)
export function formatCurrency(amount: number, currency: "IDR" | "USD" = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// 📦 FORMAT PRODUCT SLUG (From name to URL-friendly)
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// 🖼️ OPTIMIZE IMAGE URL (Cloudinary transformation)
export function getOptimizedImageUrl(
  url: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string {
  if (!url.includes("cloudinary")) return url;
  
  const { width = 800, height = 800, quality = 80 } = options || {};
  return url.replace(
    "/upload/",
    `/upload/w_${width},h_${height},q_${quality},c_fill/`
  );
}

// 📱 CHECK MOBILE DEVICE
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

// 📦 GENERATE UNIQUE ORDER NUMBER
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `KR-${timestamp}-${random}`.toUpperCase();
}