/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'fluent-ffmpeg', 'ffmpeg-static', '@ffprobe-installer/ffprobe'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
    ],
  },
  poweredByHeader: false,
}

export default nextConfig