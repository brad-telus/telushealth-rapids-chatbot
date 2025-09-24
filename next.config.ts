import type {NextConfig} from "next";

const isProduction = process.env.NODE_ENV === "production";

export const basePath = isProduction ? "/rx" : "";

const nextConfig: NextConfig = {
    output: "standalone",
    basePath,
    trailingSlash: isProduction,
    productionBrowserSourceMaps: false,

    // Fix workspace root warning
    outputFileTracingRoot: __dirname,

    experimental: {
        // Package import optimization for common heavy dependencies
        optimizePackageImports: [
            '@radix-ui/react-icons',
            'lucide-react',
            '@radix-ui/react-select',
            'framer-motion',
            'react-syntax-highlighter'
        ],
    },

    // Webpack optimizations
    webpack: (config, { isServer }) => {
        // Optimize build performance
        config.optimization = {
            ...config.optimization,
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                    },
                },
            },
        };

        return config;
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
