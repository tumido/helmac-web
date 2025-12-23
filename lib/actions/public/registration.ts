"use server";

import { db } from "@/lib/db";
import { registrationSchema } from "@/lib/validators/registration";

export interface RegistrationState {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>;
    registrationId?: string;
}

export async function submitRegistration(
    prevState: RegistrationState | null,
    formData: FormData
): Promise<RegistrationState> {
    // Get active year
    const activeYear = await db.year.findFirst({
        where: { isActive: true, isArchived: false },
        select: { id: true, title: true },
    });

    if (!activeYear) {
        return {
            success: false,
            message: "Registrace neni momentalne otevrena",
        };
    }

    // Parse form data
    const rawData = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        nickname: formData.get("nickname") || undefined,
        email: formData.get("email"),
        phone: formData.get("phone") || undefined,
        birthDate: formData.get("birthDate") || undefined,
        experience: formData.get("experience"),
        faction: formData.get("faction") || undefined,
        character: formData.get("character") || undefined,
        foodPreference: formData.get("foodPreference"),
        allergies: formData.get("allergies") || undefined,
        notes: formData.get("notes") || undefined,
        gdprConsent: formData.get("gdprConsent") === "true",
        rulesConsent: formData.get("rulesConsent") === "true",
    };

    // Validate
    const result = registrationSchema.safeParse(rawData);

    if (!result.success) {
        const errors: Record<string, string[]> = {};
        result.error.issues.forEach((issue) => {
            const path = issue.path.join(".");
            if (!errors[path]) errors[path] = [];
            errors[path].push(issue.message);
        });

        return {
            success: false,
            message: "Prosim opravte chyby ve formulari",
            errors,
        };
    }

    const data = result.data;

    // Check for duplicate registration
    const existingRegistration = await db.registration.findFirst({
        where: {
            yearId: activeYear.id,
            email: data.email.toLowerCase(),
        },
    });

    if (existingRegistration) {
        return {
            success: false,
            message: "Na tento email jiz existuje registrace",
            errors: {
                email: ["Na tento email jiz existuje registrace"],
            },
        };
    }

    // Create registration
    try {
        const registration = await db.registration.create({
            data: {
                yearId: activeYear.id,
                firstName: data.firstName,
                lastName: data.lastName,
                nickname: data.nickname || null,
                email: data.email.toLowerCase(),
                phone: data.phone || null,
                birthDate: data.birthDate ? new Date(data.birthDate) : null,
                experience: data.experience,
                faction: data.faction || null,
                character: data.character || null,
                foodPreference: data.foodPreference,
                allergies: data.allergies || null,
                notes: data.notes || null,
                status: "PENDING",
            },
        });

        return {
            success: true,
            message: `Dekujeme za registraci na ${activeYear.title}!`,
            registrationId: registration.id,
        };
    } catch (error) {
        console.error("Registration error:", error);
        return {
            success: false,
            message: "Nastala chyba pri zpracovani registrace. Zkuste to prosim znovu.",
        };
    }
}
