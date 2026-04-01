"use client";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/cs";

interface DatePickerProviderProps {
    children: React.ReactNode;
}

export function DatePickerProvider({ children }: DatePickerProviderProps) {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
            {children}
        </LocalizationProvider>
    );
}
