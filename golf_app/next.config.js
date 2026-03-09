/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-1c486a57008846a3b59a6e8350d95d8e.r2.dev',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig

