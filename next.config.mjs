import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL;
const storageHost = storageUrl
    ? new URL(storageUrl).hostname
    : undefined;

/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {
        root: __dirname,
    },
    images: {
        remotePatterns: storageHost
            ? [{ protocol: "https", hostname: storageHost }]
            : [],
    },
};

export default nextConfig;
