export async function register() {
    const required: { name: string; description: string }[] = [
        { name: "DATABASE_URL", description: "PostgreSQL connection string (e.g. postgresql://user:pass@host:5432/db)" },
        { name: "NEXTAUTH_SECRET", description: "Random secret for Auth.js session signing (generate with: openssl rand -base64 32)" },
        { name: "PUBLIC_JWT_SECRET", description: "Random secret for public user JWT tokens (generate with: openssl rand -base64 32)" },
        { name: "ENCRYPTION_KEY", description: "64-character hex string for AES-256 encryption (generate with: openssl rand -hex 32)" },
    ];

    const missing = required.filter((v) => !process.env[v.name]);

    if (missing.length > 0) {
        const details = missing
            .map((v) => `  - ${v.name}: ${v.description}`)
            .join("\n");
        throw new Error(
            `Missing required environment variables:\n${details}\n\nSee .env.example for reference.`,
        );
    }
}
