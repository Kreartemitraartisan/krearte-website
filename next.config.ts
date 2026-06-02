import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: false,
  
  // ✅ API Configuration: Increase upload size limit
  api: {
    bodyParser: {
      sizeLimit: "10mb", // ✅ Increase from default 1mb to 10mb
    },
    responseLimit: "10mb",
  },
  
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
      // ✅ Tambahkan VPS IP/Domain untuk gambar upload
      {
        protocol: 'https',
        hostname: 'your-vps-ip-or-domain.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'your-vps-ip-or-domain.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;