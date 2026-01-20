"use client";

import { useSnackbar, VariantType } from "notistack";
import { useCallback } from "react";

export function useToast() {
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const success = useCallback(
        (message: string) => {
            enqueueSnackbar(message, { variant: "success" });
        },
        [enqueueSnackbar]
    );

    const error = useCallback(
        (message: string) => {
            enqueueSnackbar(message, { variant: "error" });
        },
        [enqueueSnackbar]
    );

    const info = useCallback(
        (message: string) => {
            enqueueSnackbar(message, { variant: "info" });
        },
        [enqueueSnackbar]
    );

    const warning = useCallback(
        (message: string) => {
            enqueueSnackbar(message, { variant: "warning" });
        },
        [enqueueSnackbar]
    );

    const toast = useCallback(
        (message: string, variant: VariantType = "default") => {
            enqueueSnackbar(message, { variant });
        },
        [enqueueSnackbar]
    );

    return {
        success,
        error,
        info,
        warning,
        toast,
        close: closeSnackbar,
    };
}
