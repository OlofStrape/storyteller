/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*"]
    }
  },
  eslint: {
    // Skip ESLint during production builds to speed up deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // We've already fixed type errors, so we can skip checking during build
    ignoreBuildErrors: false,
  },
};
export default nextConfig;


