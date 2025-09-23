import type {NextConfig} from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
    experimental: {
        ppr: true,
    },
    output: 'standalone',
    basePath: isProduction ? '/rx' : '',
    trailingSlash: isProduction,
    images: {
        unoptimized: true, // the Next image optimization API is not secure
        remotePatterns: [{
            hostname: "avatar.vercel.sh",
        }],
    },
};

export default nextConfig;
