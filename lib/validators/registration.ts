import { z } from "zod";

export const registrationSchema = z.object({
    firstName: z
        .string()
        .min(1, "Jméno je povinné")
        .max(50, "Jméno je příliš dlouhé"),
    lastName: z
        .string()
        .min(1, "Příjmení je povinné")
        .max(50, "Příjmení je příliš dlouhé"),
    nickname: z.string().max(50, "Přezdívka je příliš dlouhá").optional(),
    email: z.string().min(1, "Email je povinný").email("Neplatný formát emailu"),
    phone: z
        .string()
        .max(20, "Telefonní číslo je příliš dlouhé")
        .optional()
        .or(z.literal("")),
    birthDate: z.string().optional().or(z.literal("")),
    experience: z.enum(["BEGINNER", "SOME", "EXPERIENCED", "VETERAN"], {
        message: "Vyberte uroven zkusenosti",
    }),
    faction: z.string().max(100, "Název frakce je příliš dlouhý").optional(),
    character: z
        .string()
        .max(2000, "Popis postavy je příliš dlouhý")
        .optional(),
    foodPreference: z.enum(["NORMAL", "VEGETARIAN", "VEGAN", "OTHER"], {
        message: "Vyberte stravovaci preferenci",
    }),
    allergies: z.string().max(500, "Alergie jsou příliš dlouhé").optional(),
    notes: z.string().max(2000, "Poznámky jsou příliš dlouhé").optional(),
    gdprConsent: z.boolean().refine((val) => val === true, {
        message: "Souhlas s GDPR je povinný",
    }),
    rulesConsent: z.boolean().refine((val) => val === true, {
        message: "Souhlas s pravidly je povinný",
    }),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const experienceLevelLabels: Record<string, string> = {
    BEGINNER: "Začátečník - nikdy jsem LARP nehrál/a",
    SOME: "Trochu zkušeností - pár LARPů za sebou",
    EXPERIENCED: "Zkušený/á - pravidelně hraji LARPy",
    VETERAN: "Veterán - letité zkušenosti",
};

export const foodPreferenceLabels: Record<string, string> = {
    NORMAL: "Bez omezeni",
    VEGETARIAN: "Vegetarian",
    VEGAN: "Vegan",
    OTHER: "Jine (uvedte v poznamkach)",
};
