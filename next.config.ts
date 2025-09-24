import type {NextConfig} from "next";

const isProduction = process.env.NODE_ENV === "production";

export const basePath = isProduction ? "/rx" : "";

const nextConfig: NextConfig = {
    output: "standalone",
    basePath,
    trailingSlash: isProduction,
    productionBrowserSourceMaps: false,
    experimental: {
        optimizeCss: true,
    },
    images: {
        unoptimized: true, // the Next image optimization API is not secure
        remotePatterns: [
            {
                hostname: "main.rapidspoc.com",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;
