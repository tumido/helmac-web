import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { DatePickerProvider } from "@/components/ui/date-picker-provider";
import "./globals.css";

export const metadata: Metadata = {
    title: "Helmáč",
    description: "Helmáč - Event website",
    icons: {
        icon: [
            { url: "/images/helmac-logo-centered.svg", type: "image/svg+xml" },
            // { url: "/favicon.ico", sizes: "any" },
        ],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="cs">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Roboto:wght@300;400;500;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <AppRouterCacheProvider>
                    <DatePickerProvider>{children}</DatePickerProvider>
                </AppRouterCacheProvider>
            </body>
        </html>
    );
}
