import { z } from "zod";

export const createYearSchema = z.object({
    year: z.coerce
        .number()
        .min(2000, "Rok musi byt vetsi nez 2000")
        .max(2100, "Rok musi byt mensi nez 2100"),
    title: z
        .string()
        .min(1, "Nazev je povinny")
        .max(200, "Nazev je prilis dlouhy"),
    subtitle: z.string().max(500, "Podtitulek je prilis dlouhy").optional(),
    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
});

export const updateYearSchema = createYearSchema.partial();

export type CreateYearInput = z.infer<typeof createYearSchema>;
export type UpdateYearInput = z.infer<typeof updateYearSchema>;
