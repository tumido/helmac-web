import { z } from "zod";
import { contentBlocksSchema } from "./content-blocks";

const RESERVED_SLUGS = [
    "program",
    "galerie",
    "novinky",
    "archiv",
    "registrace",
    "ucet",
    "prihlaseni",
    "nahled",
    "gdpr",
    "obnoveni-hesla",
    "overeni-emailu",
    "vytvorit-ucet",
    "zapomenute-heslo",
];

// --- Section schemas ---

export const createSectionSchema = z.object({
    title: z
        .string()
        .min(1, "Název je povinný")
        .max(200, "Název je příliš dlouhý"),
    subtitle: z.string().max(200, "Podtitulek je příliš dlouhý").optional(),
    icon: z.string().optional(),
    content: z
        .string()
        .min(2, "Obsah je povinný")
        .transform((val, ctx) => {
            try {
                return JSON.parse(val);
            } catch {
                ctx.addIssue({
                    code: "custom",
                    message: "Neplatný formát obsahu",
                });
                return z.NEVER;
            }
        })
        .pipe(contentBlocksSchema),
    showToc: z.coerce.boolean().optional(),
});

export const updateSectionSchema = z.object({
    title: z
        .string()
        .min(1, "Název je povinný")
        .max(200, "Název je příliš dlouhý")
        .optional(),
    subtitle: z.string().max(200, "Podtitulek je příliš dlouhý").optional(),
    icon: z.string().optional(),
    content: z
        .string()
        .min(2, "Obsah je povinný")
        .transform((val, ctx) => {
            try {
                return JSON.parse(val);
            } catch {
                ctx.addIssue({
                    code: "custom",
                    message: "Neplatný formát obsahu",
                });
                return z.NEVER;
            }
        })
        .pipe(contentBlocksSchema)
        .optional(),
    showToc: z.coerce.boolean().optional(),
});

// --- SectionType schemas ---

export const createSectionTypeSchema = z.object({
    label: z
        .string()
        .min(1, "Název je povinný")
        .max(100, "Název je příliš dlouhý"),
    slug: z
        .string()
        .min(1, "Slug je povinný")
        .max(100, "Slug je příliš dlouhý")
        .regex(
            /^[a-z0-9-]+$/,
            "Slug může obsahovat pouze malá písmena, číslice a pomlčky"
        )
        .refine(
            (val) => !RESERVED_SLUGS.includes(val),
            "Tento slug je vyhrazený pro systémové stránky"
        ),
    icon: z.string().optional(),
    pageTitle: z.string().max(200).optional(),
    pageSubtitle: z.string().max(200).optional(),
    metaTitle: z.string().max(200).optional(),
    metaDescription: z.string().max(500).optional(),
});

export const updateSectionTypeSchema = z.object({
    label: z
        .string()
        .min(1, "Název je povinný")
        .max(100, "Název je příliš dlouhý")
        .optional(),
    slug: z
        .string()
        .min(1, "Slug je povinný")
        .max(100, "Slug je příliš dlouhý")
        .regex(
            /^[a-z0-9-]+$/,
            "Slug může obsahovat pouze malá písmena, číslice a pomlčky"
        )
        .refine(
            (val) => !RESERVED_SLUGS.includes(val),
            "Tento slug je vyhrazený pro systémové stránky"
        )
        .optional(),
    icon: z.string().optional(),
    pageTitle: z.string().max(200).optional(),
    pageSubtitle: z.string().max(200).optional(),
    metaTitle: z.string().max(200).optional(),
    metaDescription: z.string().max(500).optional(),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type CreateSectionTypeInput = z.infer<typeof createSectionTypeSchema>;
export type UpdateSectionTypeInput = z.infer<typeof updateSectionTypeSchema>;
