import { ThemeWrapper } from "@/components/public/layout/ThemeWrapper";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ThemeWrapper>{children}</ThemeWrapper>;
}
