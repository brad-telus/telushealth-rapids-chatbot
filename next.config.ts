import type {NextConfig} from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
    output: 'standalone',
    basePath: isProduction ? '/rx' : '',
    trailingSlash: isProduction,
    images: {
        unoptimized: true, // the Next image optimization API is not secure
    },
};

console.log("Next.js config:", nextConfig);

export default nextConfig;
