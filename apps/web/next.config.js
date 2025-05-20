/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [{
                protocol: "https",
                hostname: "r2-us-west.photoai.com",
            },
            {
                protocol: "https",
                hostname: "r2-us-east.photoai.com",
            },
            {
                protocol: "https",
                hostname: "pub-ef34763ed7604da3af89117f48ad57b4.r2.dev",
            },
            {
                protocol: "https",
                hostname: "i0.wp.com",
            },
            {
                protocol: "https",
                hostname: "encrypted-tbn1.gstatic.com",
            },
            {
                protocol: "https",
                hostname: "v3.fal.media",
            },
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com",
            },
            {
                protocol: "https",
                hostname: "cloudflare-ipfs.com",
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
        ],
    },
};

export default nextConfig;