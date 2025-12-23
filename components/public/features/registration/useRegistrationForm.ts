"use client";

import { useActionState, useCallback, useState } from "react";
import { submitRegistration, RegistrationState } from "@/lib/actions/public/registration";
import { RegistrationFormData, defaultFormData } from "./registration.types";

export function useRegistrationForm() {
    const [formData, setFormData] = useState<RegistrationFormData>(defaultFormData);

    const [state, formAction, isPending] = useActionState<RegistrationState | null, FormData>(
        submitRegistration,
        null
    );

    const handleChange = useCallback(
        (field: keyof RegistrationFormData) =>
            (
                event: React.ChangeEvent<
                    HTMLInputElement | HTMLTextAreaElement | { value: unknown }
                >
            ) => {
                const value =
                    "checked" in event.target
                        ? event.target.checked
                        : event.target.value;
                setFormData((prev) => ({ ...prev, [field]: value }));
            },
        []
    );

    const handleSelectChange = useCallback(
        (field: keyof RegistrationFormData) => (event: { target: { value: string } }) => {
            setFormData((prev) => ({ ...prev, [field]: event.target.value }));
        },
        []
    );

    const handleCheckboxChange = useCallback(
        (field: keyof RegistrationFormData) =>
            (event: React.ChangeEvent<HTMLInputElement>) => {
                setFormData((prev) => ({ ...prev, [field]: event.target.checked }));
            },
        []
    );

    const getFieldError = useCallback(
        (field: string): string | undefined => {
            return state?.errors?.[field]?.[0];
        },
        [state?.errors]
    );

    const reset = useCallback(() => {
        setFormData(defaultFormData);
    }, []);

    return {
        formData,
        formAction,
        isPending,
        state,
        handleChange,
        handleSelectChange,
        handleCheckboxChange,
        getFieldError,
        reset,
    };
}
