import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import {
    PUBLIC_SESSION_COOKIE,
    PUBLIC_SESSION_MAX_AGE,
    type PublicJWTPayload,
} from "./public-auth.config";
import { db } from "./db";

function getPublicJWTSecret(): Uint8Array {
    return new TextEncoder().encode(process.env.PUBLIC_JWT_SECRET!);
}

/**
 * Create a signed JWT for a public user.
 */
export async function signPublicJWT(payload: {
    sub: string;
    email: string;
}): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${PUBLIC_SESSION_MAX_AGE}s`)
        .sign(getPublicJWTSecret());
}

/**
 * Set the public session cookie.
 */
export async function setPublicSession(user: {
    id: string;
    email: string;
}): Promise<void> {
    const token = await signPublicJWT({
        sub: user.id,
        email: user.email,
    });

    const cookieStore = await cookies();
    cookieStore.set(PUBLIC_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: PUBLIC_SESSION_MAX_AGE,
        path: "/",
    });
}

/**
 * Clear the public session cookie.
 */
export async function clearPublicSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(PUBLIC_SESSION_COOKIE);
}

/**
 * Read and verify the public session cookie.
 * Returns the payload or null if no valid session.
 */
export async function getPublicSession(): Promise<PublicJWTPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(PUBLIC_SESSION_COOKIE)?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, getPublicJWTSecret());
        const session = payload as unknown as PublicJWTPayload;

        const user = await db.publicUser.findUnique({
            where: { id: session.sub },
            select: { id: true },
        });

        if (!user) {
            return null;
        }

        return session;
    } catch {
        return null;
    }
}

/**
 * Require a valid public session. Throws if not authenticated.
 */
export async function requirePublicAuth(): Promise<PublicJWTPayload> {
    const session = await getPublicSession();
    if (!session) {
        throw new Error("Nepřihlášen");
    }
    return session;
}
