export interface NavLink {
    label: string;
    href: string;
}

export const STATIC_NAV_BEFORE: NavLink[] = [
    { label: "Program", href: "/program" },
];

export const STATIC_NAV_AFTER: NavLink[] = [
    { label: "Galerie", href: "/galerie" },
    { label: "Novinky", href: "/novinky" },
    { label: "Archiv", href: "/archiv" },
];
