/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com', 'dtyioslt5.cloudinary.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
