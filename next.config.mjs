/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "coms-app-sigma.vercel.app" }],
        destination: "https://coms-emmaschickenhouse.vercel.app/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
