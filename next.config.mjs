/** @type {import('next').NextConfig} */
const nextConfig = {
  // If you want the portal to live at ciamac.com/starving-artist (a path on your
  // existing site), set BASE_PATH="/starving-artist" as an env var in Vercel.
  // If you deploy it on its own (sub)domain like eats.ciamac.com, leave it unset.
  basePath: process.env.BASE_PATH || undefined,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
};

export default nextConfig;
