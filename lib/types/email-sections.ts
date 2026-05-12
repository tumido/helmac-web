import type { FormCondition } from "@/lib/types/registration-form";

export interface EmailConditionalSection {
    id: string;
    condition: FormCondition;
    body: string;
    sortOrder: number;
}
