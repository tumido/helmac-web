"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getPublicSession } from "@/lib/public-auth";
import { migrateFormData } from "@/lib/utils/form-migration";
import { getAllInputFields, MAX_ADDITIONAL_PEOPLE } from "@/lib/types/registration-form";
import type { AdditionalPersonData, InputField } from "@/lib/types/registration-form";
import { buildSubmissionSchema } from "@/lib/validators/registration-submission";

export interface UpdateRegistrationState {
    success: boolean;
    message?: string;
    errors?: Record<string, string[]>;
    apErrors?: Record<number, Record<string, string[]>>;
}

function isEditableNonPricing(field: InputField): boolean {
    return !!field.editable && !field.type.startsWith("pricing_");
}

function typeConvert(field: InputField, value: unknown): string | number | boolean {
    if (field.type === "checkbox") {
        return value === true || value === "true";
    }
    if (field.type === "number") {
        if (value === undefined || value === null || value === "") return "" as unknown as number;
        return Number(value);
    }
    return value == null ? "" : String(value);
}

export async function updatePublicRegistration(
    registrationId: string,
    formData: FormData,
): Promise<UpdateRegistrationState> {
    const session = await getPublicSession();
    if (!session) {
        return { success: false, message: "Nepovolený přístup" };
    }

    const registration = await db.registrationSubmission.findUnique({
        where: { id: registrationId },
        select: {
            id: true,
            publicUserId: true,
            status: true,
            data: true,
            year: { select: { registrationOpen: true } },
            form: { select: { fields: true } },
        },
    });

    if (!registration || registration.publicUserId !== session.sub) {
        return { success: false, message: "Nepovolený přístup" };
    }

    if (!registration.year.registrationOpen) {
        return { success: false, message: "Registrace ročníku je uzavřena" };
    }

    if (registration.status === "CANCELLED" || registration.status === "REJECTED") {
        return { success: false, message: "Registraci v tomto stavu nelze upravovat" };
    }

    const formDataStored = migrateFormData(registration.form?.fields);
    const allInputFields = getAllInputFields(formDataStored.fields);
    const editableFields = allInputFields.filter(isEditableNonPricing);

    if (editableFields.length === 0) {
        return { success: false, message: "Tento formulář nemá žádná upravitelná pole" };
    }

    const rawData: Record<string, unknown> = {};
    for (const field of editableFields) {
        rawData[field.name] = typeConvert(field, formData.get(field.name));
    }

    const schema = buildSubmissionSchema(editableFields);
    const result = schema.safeParse(rawData);

    if (!result.success) {
        const errors: Record<string, string[]> = {};
        result.error.issues.forEach((issue) => {
            const path = issue.path.join(".");
            if (!errors[path]) errors[path] = [];
            errors[path].push(issue.message);
        });
        return { success: false, message: "Nejsou vyplněna všechna povinná pole", errors };
    }

    const editableAPFields = editableFields.filter((f) => f.includeForAdditionalPeople === true);
    let editedAP: AdditionalPersonData[] = [];
    const apErrors: Record<number, Record<string, string[]>> = {};

    const rawAPJson = formData.get("__additionalPeople");
    if (rawAPJson && String(rawAPJson) !== "[]") {
        try {
            const parsed = JSON.parse(String(rawAPJson));
            if (!Array.isArray(parsed)) {
                return { success: false, message: "Neplatná data dalších osob" };
            }
            if (parsed.length > MAX_ADDITIONAL_PEOPLE) {
                return { success: false, message: `Maximální počet dalších osob je ${MAX_ADDITIONAL_PEOPLE}` };
            }
            editedAP = parsed as AdditionalPersonData[];
        } catch {
            return { success: false, message: "Neplatná data dalších osob" };
        }

        for (let i = 0; i < editedAP.length; i++) {
            const person = editedAP[i];
            const typed: Record<string, unknown> = {};
            for (const field of editableAPFields) {
                typed[field.name] = typeConvert(field, person[field.name]);
            }
            const apSchema = buildSubmissionSchema(editableAPFields);
            const apResult = apSchema.safeParse(typed);
            if (!apResult.success) {
                apErrors[i] = {};
                apResult.error.issues.forEach((issue) => {
                    const path = issue.path.join(".");
                    if (!apErrors[i][path]) apErrors[i][path] = [];
                    apErrors[i][path].push(issue.message);
                });
            }
            const cleaned: AdditionalPersonData = {};
            for (const field of editableAPFields) {
                cleaned[field.name] = typed[field.name] as string | number | boolean;
            }
            editedAP[i] = cleaned;
        }

        if (Object.keys(apErrors).length > 0) {
            return {
                success: false,
                message: "Nejsou vyplněna všechna povinná pole",
                apErrors,
            };
        }
    }

    const existingData = (typeof registration.data === "object" && registration.data !== null
        ? (registration.data as Record<string, unknown>)
        : {});

    const mergedData: Record<string, unknown> = { ...existingData };
    for (const field of editableFields) {
        mergedData[field.name] = rawData[field.name];
    }

    if (editableAPFields.length > 0) {
        const existingAP = Array.isArray(existingData.additionalPeople)
            ? (existingData.additionalPeople as AdditionalPersonData[])
            : [];
        const mergedAP: AdditionalPersonData[] = existingAP.map((person, idx) => {
            const edits = editedAP[idx];
            if (!edits) return person;
            const merged: AdditionalPersonData = { ...person };
            for (const field of editableAPFields) {
                if (Object.prototype.hasOwnProperty.call(edits, field.name)) {
                    merged[field.name] = edits[field.name];
                }
            }
            return merged;
        });
        mergedData.additionalPeople = mergedAP;
    }

    await db.registrationSubmission.update({
        where: { id: registration.id },
        data: { data: mergedData as object },
    });

    revalidatePath("/ucet");
    return { success: true };
}
