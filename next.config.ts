import type {NextConfig} from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
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

console.log("Next.js config:", nextConfig);

export default nextConfig;
