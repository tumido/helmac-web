import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error("ENCRYPTION_KEY environment variable is not set");
    }
    if (key.length !== 64) {
        throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
    }
    return Buffer.from(key, "hex");
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns base64-encoded string in format: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");
    const authTag = cipher.getAuthTag();

    return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypt a ciphertext string encrypted with AES-256-GCM.
 * Expects base64-encoded string in format: iv:authTag:ciphertext
 */
export function decrypt(ciphertext: string): string {
    const key = getEncryptionKey();
    const parts = ciphertext.split(":");
    if (parts.length !== 3) {
        throw new Error("Invalid encrypted data format");
    }

    const iv = Buffer.from(parts[0], "base64");
    const authTag = Buffer.from(parts[1], "base64");
    const encrypted = parts[2];

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}
