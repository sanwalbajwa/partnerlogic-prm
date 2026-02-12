/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Azure App Service deployment
  output: 'standalone',
  
  // Disable lint and TypeScript errors during build for Azure
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
