"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function login(
    prevState: { error?: string } | null,
    formData: FormData
) {
    try {
        await signIn("credentials", {
            email: formData.get("email"),
            password: formData.get("password"),
            redirectTo: "/admin",
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Neplatne prihlasovaci udaje" };
                default:
                    return { error: "Nastala chyba pri prihlasovani" };
            }
        }
        throw error;
    }

    return null;
}
