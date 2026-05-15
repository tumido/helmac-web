import { useState, useCallback } from "react";
import type {
    SubmissionData,
    AdditionalPersonData,
} from "@/lib/types/registration-form";
import { sendPreviewConfirmation } from "@/lib/actions/preview-send-confirmation";
import {
    getPreviewSuccessData,
    type PreviewSuccessResult,
} from "@/lib/actions/preview-success-data";

export function usePreviewActions(
    previewYearId: string | undefined,
    values: SubmissionData,
    additionalPeople: AdditionalPersonData[]
) {
    const [previewSnackbar, setPreviewSnackbar] = useState<{
        open: boolean;
        severity: "info" | "success" | "error";
        message: string;
    }>({
        open: false,
        severity: "info",
        message: "",
    });
    const [previewSending, setPreviewSending] = useState(false);
    const [successPreview, setSuccessPreview] =
        useState<Extract<
            PreviewSuccessResult,
            { success: true }
        > | null>(null);
    const [loadingSuccessPreview, setLoadingSuccessPreview] =
        useState(false);

    const handleSendPreviewEmail = useCallback(async () => {
        if (!previewYearId) return;
        setPreviewSending(true);
        try {
            const result = await sendPreviewConfirmation({
                yearId: previewYearId,
                submissionData: values,
                additionalPeople,
            });
            if (result.success) {
                const condCount =
                    result.conditionalSentCount ?? 0;
                setPreviewSnackbar({
                    open: true,
                    severity: "success",
                    message:
                        condCount > 0
                            ? `Testovací email byl odeslán (včetně ${condCount} podmíněných).`
                            : "Testovací email byl odeslán.",
                });
            } else {
                setPreviewSnackbar({
                    open: true,
                    severity: "error",
                    message:
                        result.error ??
                        "Nepodařilo se odeslat email",
                });
            }
        } catch {
            setPreviewSnackbar({
                open: true,
                severity: "error",
                message: "Nepodařilo se odeslat email",
            });
        } finally {
            setPreviewSending(false);
        }
    }, [previewYearId, values, additionalPeople]);

    const handleShowSuccessPreview = useCallback(async () => {
        if (!previewYearId) return;
        setLoadingSuccessPreview(true);
        try {
            const result = await getPreviewSuccessData({
                yearId: previewYearId,
                submissionData: values,
                additionalPeople,
            });
            if ("success" in result && result.success) {
                setSuccessPreview(result);
            } else {
                setPreviewSnackbar({
                    open: true,
                    severity: "error",
                    message:
                        ("error" in result && result.error) ||
                        "Nepodařilo se načíst náhled",
                });
            }
        } catch {
            setPreviewSnackbar({
                open: true,
                severity: "error",
                message: "Nepodařilo se načíst náhled",
            });
        } finally {
            setLoadingSuccessPreview(false);
        }
    }, [previewYearId, values, additionalPeople]);

    const closePreviewSnackbar = useCallback(() => {
        setPreviewSnackbar((s) => ({ ...s, open: false }));
    }, []);

    const clearSuccessPreview = useCallback(() => {
        setSuccessPreview(null);
    }, []);

    return {
        previewSnackbar,
        closePreviewSnackbar,
        previewSending,
        handleSendPreviewEmail,
        successPreview,
        clearSuccessPreview,
        loadingSuccessPreview,
        handleShowSuccessPreview,
    };
}
