/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'fluent-ffmpeg', 'ffmpeg-static', '@ffprobe-installer/ffprobe', '@paddle/paddle-node-sdk'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
    ],
  },
  poweredByHeader: false,
}

export default nextConfig