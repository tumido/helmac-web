import { z } from "zod";

export const registrationSchema = z.object({
    firstName: z
        .string()
        .min(1, "Jmeno je povinne")
        .max(50, "Jmeno je prilis dlouhe"),
    lastName: z
        .string()
        .min(1, "Prijmeni je povinne")
        .max(50, "Prijmeni je prilis dlouhe"),
    nickname: z.string().max(50, "Prezdivka je prilis dlouha").optional(),
    email: z.string().min(1, "Email je povinny").email("Neplatny format emailu"),
    phone: z
        .string()
        .max(20, "Telefonni cislo je prilis dlouhe")
        .optional()
        .or(z.literal("")),
    birthDate: z.string().optional().or(z.literal("")),
    experience: z.enum(["BEGINNER", "SOME", "EXPERIENCED", "VETERAN"], {
        message: "Vyberte uroven zkusenosti",
    }),
    faction: z.string().max(100, "Nazev frakce je prilis dlouhy").optional(),
    character: z
        .string()
        .max(2000, "Popis postavy je prilis dlouhy")
        .optional(),
    foodPreference: z.enum(["NORMAL", "VEGETARIAN", "VEGAN", "OTHER"], {
        message: "Vyberte stravovaci preferenci",
    }),
    allergies: z.string().max(500, "Alergie jsou prilis dlouhe").optional(),
    notes: z.string().max(2000, "Poznamky jsou prilis dlouhe").optional(),
    gdprConsent: z.boolean().refine((val) => val === true, {
        message: "Souhlas s GDPR je povinny",
    }),
    rulesConsent: z.boolean().refine((val) => val === true, {
        message: "Souhlas s pravidly je povinny",
    }),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const experienceLevelLabels: Record<string, string> = {
    BEGINNER: "Zacatecnik - nikdy jsem LARP nehral/a",
    SOME: "Trochu zkusenosti - par LARPu za sebou",
    EXPERIENCED: "Zkuseny/a - pravidelne hraji LARPy",
    VETERAN: "Veteran - letite zkusenosti",
};

export const foodPreferenceLabels: Record<string, string> = {
    NORMAL: "Bez omezeni",
    VEGETARIAN: "Vegetarian",
    VEGAN: "Vegan",
    OTHER: "Jine (uvedte v poznamkach)",
};
