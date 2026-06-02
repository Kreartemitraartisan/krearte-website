import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: false,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.krearte.id',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.krearte.id',
        pathname: '/videos/**',
      },
      // ✅ Tetap izinkan localhost untuk development
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      // ✅ Tambahkan VPS untuk gambar upload
      {
        protocol: 'https',
        hostname: 'assets.krearte.id', // Ganti dengan domain/IP VPS kamu
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;