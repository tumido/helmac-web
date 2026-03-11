import { jwtVerify } from "jose";

// Edge-safe config for public user authentication
// Can be imported in middleware without Node.js APIs

export const PUBLIC_SESSION_COOKIE = "public-session";
export const PUBLIC_SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export interface PublicJWTPayload {
    sub: string;
    email: string;
    emailVerified: boolean;
    iat: number;
    exp: number;
}

function getPublicJWTSecret(): Uint8Array {
    const secret = process.env.PUBLIC_JWT_SECRET;
    if (!secret) {
        throw new Error("PUBLIC_JWT_SECRET is not set");
    }
    return new TextEncoder().encode(secret);
}

/**
 * Verify a public JWT token (Edge-compatible).
 * Returns the payload or null if invalid/expired.
 */
export async function verifyPublicJWTEdge(
    token: string,
): Promise<PublicJWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getPublicJWTSecret());
        return payload as unknown as PublicJWTPayload;
    } catch {
        return null;
    }
}
