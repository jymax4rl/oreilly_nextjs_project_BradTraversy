/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for multi-stage Docker images (copy .next/standalone + static + public).
  output: "standalone",
  // Vercel often stores the key as GOOGLE_MAPS_API_KEY (no NEXT_PUBLIC_).
  // Maps JS runs in the browser, so expose whichever name is set at build time.
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      "",
    NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ||
      process.env.GOOGLE_MAPS_MAP_ID ||
      "",
  },
  compiler: {
    styledComponents: true,
  },
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "**",
      },
    ],
  },
  turbopack: {},
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      async_hooks: false,
    };
    return config;
  },
};

export default nextConfig;
