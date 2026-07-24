export const CAMPAIGN_STATUS_CONFIG: Record<
    string,
    { label: string; color: "default" | "info" | "warning" | "success" }
> = {
    DRAFT: { label: "Koncept", color: "default" },
    SENDING: { label: "Odesílá se", color: "info" },
    PAUSED: { label: "Pozastaveno", color: "warning" },
    COMPLETED: { label: "Dokončeno", color: "success" },
};

export const REGISTRATION_STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: "PENDING", label: "Čeká" },
    { value: "CONFIRMED", label: "Potvrzeno" },
    { value: "WAITLIST", label: "Čekací listina" },
    { value: "CANCELLED", label: "Zrušeno" },
    { value: "REJECTED", label: "Zamítnuto" },
];
