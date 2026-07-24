import type { RegistrationStatus } from "@prisma/client";
import type {
    OrderDetailPerson,
    OrderBankTransaction,
    V2PricingDef,
} from "@/lib/services/v2";

export const STATUS_OPTIONS: {
    value: RegistrationStatus;
    label: string;
}[] = [
    { value: "PENDING", label: "Čeká" },
    { value: "CONFIRMED", label: "Potvrzeno" },
    { value: "WAITLIST", label: "Čekací listina" },
    { value: "CANCELLED", label: "Zrušeno" },
    { value: "REJECTED", label: "Zamítnuto" },
];

export interface FieldMeta {
    id: string;
    name: string;
    label: string;
    type: string;
    isActive: boolean;
    options: string[];
    pricingDefinitionId: string | null;
    includeForAP: boolean;
    sortOrder: number;
}

export interface PersonState {
    personIndex: number;
    values: Record<string, string>;
    quantities: Record<
        string,
        Record<string, number>
    >;
    multiSelects: Record<string, string[]>;
}

export interface FormSection {
    heading: string | null;
    fieldNames: string[];
}

export interface SerializedOrder {
    id: string;
    legacySubmissionId: string | null;
    status: RegistrationStatus;
    isPaid: boolean;
    paidAt: string | null;
    totalPrice: number | null;
    variableSymbol: string | null;
    emailSent: boolean;
    emailSentAt: string | null;
    adminNote: string | null;
    isTest: boolean;
    createdAt: string;
    yearId: string;
    yearNumber: number;
    yearTitle: string;
    pricingSummary: unknown;
    bankTransactions: (Omit<OrderBankTransaction, "date"> & {
        date: string;
    })[];
    people: OrderDetailPerson[];
    pricingDefinitions: V2PricingDef[];
    priceTiers: {
        id: string;
        deadline: string | null;
        sortOrder: number;
    }[];
    formLayout: unknown;
    allFields: {
        id: string;
        name: string;
        label: string;
        type: string;
        isActive: boolean;
        sortOrder: number;
        options: string[];
        pricingDefinitionId: string | null;
        includeForAdditionalPeople: boolean;
    }[];
}

export interface SubmissionDetailProps {
    order: SerializedOrder;
    yearId: string;
    readOnly: boolean;
}
