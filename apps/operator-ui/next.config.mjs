/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  basePath: '/operator',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'https://openclaw-deploy.prin7r.com',
    COLD_IRON_API_TOKEN: process.env.COLD_IRON_API_TOKEN ?? '',
  },
};

export default nextConfig;
