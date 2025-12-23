export interface RegistrationFormData {
    firstName: string;
    lastName: string;
    nickname: string;
    email: string;
    phone: string;
    birthDate: string;
    experience: string;
    faction: string;
    character: string;
    foodPreference: string;
    allergies: string;
    notes: string;
    gdprConsent: boolean;
    rulesConsent: boolean;
}

export const defaultFormData: RegistrationFormData = {
    firstName: "",
    lastName: "",
    nickname: "",
    email: "",
    phone: "",
    birthDate: "",
    experience: "BEGINNER",
    faction: "",
    character: "",
    foodPreference: "NORMAL",
    allergies: "",
    notes: "",
    gdprConsent: false,
    rulesConsent: false,
};
