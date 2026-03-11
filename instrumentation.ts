export async function register() {
    const required: { name: string; description: string }[] = [
        { name: "DATABASE_URL", description: "PostgreSQL connection string (e.g. postgresql://user:pass@host:5432/db)" },
        { name: "NEXTAUTH_SECRET", description: "Random secret for Auth.js session signing (generate with: openssl rand -base64 32)" },
        { name: "PUBLIC_JWT_SECRET", description: "Random secret for public user JWT tokens (generate with: openssl rand -base64 32)" },
        { name: "SMTP_HOST", description: "SMTP server hostname (e.g. smtp.seznam.cz)" },
        { name: "SMTP_PORT", description: "SMTP server port (e.g. 465)" },
        { name: "SMTP_USER", description: "SMTP authentication username/email" },
        { name: "SMTP_PASS", description: "SMTP authentication password" },
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
