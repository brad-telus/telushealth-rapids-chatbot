import type {NextConfig} from "next";

const isProduction = process.env.NODE_ENV === "production";

export const basePath = isProduction ? '/rx' : '';

const nextConfig: NextConfig = {
    output: 'standalone',
    basePath,
    trailingSlash: isProduction,
    images: {
        unoptimized: true, // the Next image optimization API is not secure
        remotePatterns: [{
            hostname: "main.rapidspoc.com",
        }],
    },
};

console.log("Next.js config:", nextConfig);

export default nextConfig;
