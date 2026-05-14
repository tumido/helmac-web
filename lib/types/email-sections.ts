import type { FormCondition } from "@/lib/types/registration-form";
import type { EmailAttachment } from "@/lib/validators/email-attachment";

export interface EmailConditionalSection {
    id: string;
    condition: FormCondition;
    body: string;
    sortOrder: number;
    attachments: EmailAttachment[];
}
