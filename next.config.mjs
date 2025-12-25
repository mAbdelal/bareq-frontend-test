/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "http",
                hostname: "localhost",
                port: "8080",
                pathname: "/api/v1/assets/**",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
            },
            {
                protocol: "https",
                hostname: "dangerous-darcie-bareq-4a27d84a.koyeb.app",
                port: "8080",
                pathname: "/api/v1/assets/**",
            },
        ],
    },
};

export default nextConfig;

