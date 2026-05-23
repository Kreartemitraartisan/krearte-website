import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: false, // ✅ Mencegah infinite loop di production
  
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '72.62.120.245', // ✅ Izinkan gambar dari VPS kamu
        port: '',
        pathname: '/images/**',
      },
      {
        protocol: 'http',
        hostname: '72.62.120.245',
        port: '',
        pathname: '/videos/**',
      },
    ],
  },
};

export default nextConfig;