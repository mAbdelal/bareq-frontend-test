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
                hostname: "entire-brigida-bareq-21a455bc.koyeb.app",
                port: "",
                pathname: "/api/v1/assets/**",
            },
        ],
    },
};

export default nextConfig;

