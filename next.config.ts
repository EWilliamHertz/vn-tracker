import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'uploads.mangadex.org' },
      { protocol: 'https', hostname: '*.mangadex.network' },
      { protocol: 'https', hostname: 'cihuklgqvwaiqvsxdgap.supabase.co' },
    ],
  },
};

export default nextConfig;
