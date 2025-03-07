/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Set to false to avoid double-renders in development
  images: {
    domains: [
      'res.cloudinary.com',
      'lh3.googleusercontent.com',
      'images.unsplash.com'
    ],
  },
  // Improve webpack performance
  webpack: (config, { isServer }) => {
    // Only enable Fast Refresh in development and when not in a server environment
    if (!isServer) {
      config.optimization.runtimeChunk = 'single';
    }
    return config;
  },
  // Prevent unnecessary Fast Refresh cycles
  onDemandEntries: {
    // Keep the pages in memory longer
    maxInactiveAge: 30 * 1000,
    // Don't dispose of pages too quickly
    pagesBufferLength: 5,
  }
};

export default nextConfig;
