/** @type {import('next').NextStyle}.Config */
const nextConfig = {
  typescript: {
    // ⚠️ Tells Next.js to ignore TypeScript errors so Vercel builds NO MATTER WHAT
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignores ESLint errors during builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;