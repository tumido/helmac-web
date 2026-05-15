export interface SerializedRegistration {
    id: string;
    data: unknown;
    status: string;
    isPaid: boolean;
    isTest: boolean;
    paidAt: string | null;
    totalPrice: number | null;
    pricingSummary: unknown;
    variableSymbol: string | null;
    createdAt: string;
    year: {
        year: number;
        title: string;
        registrationOpen: boolean;
    };
    form: {
        fields: unknown;
    } | null;
}

export interface PaymentInfo {
    bankAccount: string;
    spaydStrings: Record<string, string>;
}

export interface RegistrationHistoryTableProps {
    registrations: SerializedRegistration[];
    paymentInfo?: PaymentInfo;
}
