import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

// ============================================
// Stable IDs for cross-referencing
// ============================================

// Form field IDs
const F = {
    heading1: "f-heading-1",
    name: "f-name",
    nickname: "f-nickname",
    group: "f-group",
    email: "f-email",
    birthDate: "f-birth-date",
    address: "f-address",
    memberMlarp: "f-member-mlarp",
    heading2: "f-heading-2",
    typUcasti: "f-typ-ucasti",
    vyberStrany: "f-vyber-strany",
    vyberNaroduSvetla: "f-vyber-narodu-svetla",
    vyberNaroduTemna: "f-vyber-narodu-temna",
    zdravotniOmezeni: "f-zdravotni-omezeni",
    zdravotniOmezeniJake: "f-zdravotni-jake",
    zajemVypomoc: "f-zajem-vypomoc",
    zajemZdravotnik: "f-zajem-zdravotnik",
    heading3: "f-heading-3",
    parkování: "f-parkovani",
    chciParkovat: "f-chci-parkovat",
    mazlicek: "f-mazlicek",
    detiDo6: "f-deti-do-6",
    detiDo6Kolik: "f-deti-do-6-kolik",
    deti7az12: "f-deti-7-12",
    deti7az12Kolik: "f-deti-7-12-kolik",
    vzkaz: "f-vzkaz",
    souhlasRules: "f-souhlas-pravidla",
    bojujiciCena: "f-bojujici-cena",
    nebojujiciCena: "f-nebojujici-cena",
    predStredou: "f-pred-stredou",
};

// Condition IDs
const C = {
    bojujici: "c-typ-ucasti-bojujici",
    nebojujici: "c-typ-ucasti-nebojujici",
    svetla: "c-vyber-strany-svetla",
    temna: "c-vyber-strany-temna",
    zdravotniAno: "c-zdravotni-ano",
    parkAno: "c-park-ano",
    detiDo6Ano: "c-deti-do-6-ano",
    deti7az12Ano: "c-deti-7-12-ano",
};

// Condition block IDs
const CB = {
    bojujici: "cb-bojujici",
    nebojujici: "cb-nebojujici",
    svetla: "cb-svetla",
    temna: "cb-temna",
    zdravotniAno: "cb-zdravotni-ano",
    parkAno: "cb-park-ano",
    detiDo6Ano: "cb-deti-do-6-ano",
    deti7az12Ano: "cb-deti-7-12-ano",
    bojujiciCena: "cb-bojujici-cena",
    nebojujiciCena: "cb-nebojujici-cena",
};

// Pricing definition IDs
const P = {
    memberMlarp: "p-member-mlarp",
    parking: "p-parking",
    pet: "p-pet",
    children7to12: "p-children-7-12",
    fighter: "p-fighter",
    nonFighter: "p-non-fighter",
    earlyArrival: "p-early-arrival",
};

// ============================================
// Registration form data
// ============================================

const registrationFormData = {
    priceTiers: [] as string[],
    conditions: [
        {
            id: C.bojujici,
            name: "Typ účasti je Bojující",
            rules: [
                {
                    type: "field_value" as const,
                    fieldId: F.typUcasti,
                    operator: "equals" as const,
                    value: "Bojující",
                },
            ],
        },
        {
            id: C.nebojujici,
            name: "Typ účasti je Nebojující",
            rules: [
                {
                    type: "field_value" as const,
                    fieldId: F.typUcasti,
                    operator: "equals" as const,
                    value: "Nebojující",
                },
            ],
        },
        {
            id: C.svetla,
            name: "Výběr strany je Světlá",
            rules: [
                {
                    type: "field_value" as const,
                    fieldId: F.vyberStrany,
                    operator: "equals" as const,
                    value: "Světlá",
                },
            ],
        },
        {
            id: C.temna,
            name: "Výběr strany je Temná",
            rules: [
                {
                    type: "field_value" as const,
                    fieldId: F.vyberStrany,
                    operator: "equals" as const,
                    value: "Temná",
                },
            ],
        },
        {
            id: C.zdravotniAno,
            name: "Zdravotní omezení je Ano",
            rules: [
                {
                    type: "field_value" as const,
                    fieldId: F.zdravotniOmezeni,
                    operator: "equals" as const,
                    value: "Ano",
                },
            ],
        },
        {
            id: C.parkAno,
            name: "Parkování auta je Ano",
            rules: [
                {
                    type: "field_value" as const,
                    fieldId: F.parkování,
                    operator: "equals" as const,
                    value: "Ano",
                },
            ],
        },
        {
            id: C.detiDo6Ano,
            name: "Berete děti do 6 let (včetně)? je Ano",
            rules: [
                {
                    type: "field_value" as const,
                    fieldId: F.detiDo6,
                    operator: "equals" as const,
                    value: "Ano",
                },
            ],
        },
        {
            id: C.deti7az12Ano,
            name: "Berete děti 7–12 let (včetně)? je Ano",
            rules: [
                {
                    type: "field_value" as const,
                    fieldId: F.deti7az12,
                    operator: "equals" as const,
                    value: "Ano",
                },
            ],
        },
    ],
    pricingDefinitions: [
        {
            id: P.memberMlarp,
            name: "Členství v Moravian LARP, o.s.",
            usePriceTiers: false,
            options: [
                {
                    id: "po-mlarp-ne",
                    name: "Ne",
                    description: "",
                    prices: [0],
                },
                {
                    id: "po-mlarp-ano",
                    name: "Ano",
                    description: "Sleva 200 Kč",
                    prices: [-200],
                },
            ],
        },
        {
            id: P.parking,
            name: "Chci parkovat",
            usePriceTiers: false,
            options: [
                {
                    id: "po-park-ano",
                    name: "Ano, chci parkovat",
                    description: "Poplatek za parkování na louce",
                    prices: [200],
                },
            ],
        },
        {
            id: P.pet,
            name: "Domácí mazlíček",
            usePriceTiers: false,
            options: [
                {
                    id: "po-pet-ne",
                    name: "Ne",
                    description: "",
                    prices: [0],
                },
                {
                    id: "po-pet-ano",
                    name: "Ano",
                    description: "Poplatek za mazlíčka",
                    prices: [100],
                },
            ],
        },
        {
            id: P.children7to12,
            name: "Děti 7–12 let (včetně)",
            usePriceTiers: false,
            options: [
                {
                    id: "po-deti-1",
                    name: "1 dítě",
                    description: "",
                    prices: [300],
                },
                {
                    id: "po-deti-2",
                    name: "2 děti",
                    description: "",
                    prices: [550],
                },
                {
                    id: "po-deti-3",
                    name: "3 děti",
                    description: "",
                    prices: [750],
                },
                {
                    id: "po-deti-4",
                    name: "4 děti",
                    description: "",
                    prices: [900],
                },
                {
                    id: "po-deti-5",
                    name: "5 dětí",
                    description: "",
                    prices: [1000],
                },
            ],
        },
        {
            id: P.fighter,
            name: "Bojujici ucastnik",
            usePriceTiers: false,
            options: [
                {
                    id: "po-fighter-std",
                    name: "Bojující",
                    description: "Standardní vstupné",
                    prices: [600],
                },
                {
                    id: "po-fighter-org",
                    name: "Jsem org",
                    description: "",
                    prices: [0],
                },
            ],
        },
        {
            id: P.nonFighter,
            name: "Nebojujici ucastnik",
            usePriceTiers: false,
            options: [
                {
                    id: "po-nonfighter-std",
                    name: "Nebojující",
                    description: "Standardní vstupné",
                    prices: [400],
                },
            ],
        },
        {
            id: P.earlyArrival,
            name: "Chci přijet před středou",
            usePriceTiers: false,
            options: [
                {
                    id: "po-early-ne",
                    name: "Ne",
                    description: "",
                    prices: [0],
                },
                {
                    id: "po-early-ano",
                    name: "Ano",
                    description: "Příplatek za dřívější příjezd",
                    prices: [700],
                },
            ],
        },
    ],
    capacityLimits: [
        {
            id: "cl-svetla",
            fieldId: F.vyberStrany,
            value: "Světlá",
            maxCount: 100,
        },
        {
            id: "cl-temna",
            fieldId: F.vyberStrany,
            value: "Temná",
            maxCount: 100,
        },
    ],
    showOptionCounts: [] as string[],
    infoStatsConfig: { enabled: false, stats: [] },
    fields: [
        { type: "heading", id: F.heading1, text: "Základní údaje" },
        {
            type: "text",
            id: F.name,
            name: "Jméno a Příjmení",
            label: "Jméno a Příjmení",
            required: true,
            includeForAdditionalPeople: true,
        },
        {
            type: "text",
            id: F.nickname,
            name: "Přezdívka",
            label: "Přezdívka",
            required: false,
            includeForAdditionalPeople: true,
        },
        {
            type: "text",
            id: F.group,
            name: "Skupina",
            label: "Skupina",
            required: false,
            includeForAdditionalPeople: true,
        },
        {
            type: "email",
            id: F.email,
            name: "Email",
            label: "Email",
            required: true,
        },
        {
            type: "birth_date",
            id: F.birthDate,
            name: "Datum narození",
            label: "Datum narození",
            required: true,
            includeForAdditionalPeople: true,
        },
        {
            type: "text",
            id: F.address,
            name: "Trvalé bydliště",
            label: "Trvalé bydliště",
            required: true,
        },
        {
            type: "pricing_select",
            id: F.memberMlarp,
            name: "Členství v Moravian LARP, o.s.",
            label: "Členství v Moravian LARP, o.s.",
            required: true,
            pricingId: P.memberMlarp,
            includeForAdditionalPeople: true,
        },
        { type: "heading", id: F.heading2, text: "Role na akci" },
        {
            type: "radio",
            id: F.typUcasti,
            name: "Typ účasti",
            label: "Typ účasti",
            required: true,
            options: ["Bojující", "Nebojující"],
            includeForAdditionalPeople: true,
        },
        {
            type: "condition",
            id: CB.bojujici,
            conditionId: C.bojujici,
            children: [
                {
                    type: "radio",
                    id: F.vyberStrany,
                    name: "Výběr strany",
                    label: "Výběr strany",
                    required: true,
                    options: ["Světlá", "Temná"],
                    includeForAdditionalPeople: true,
                },
            ],
        },
        {
            type: "condition",
            id: CB.svetla,
            conditionId: C.svetla,
            children: [
                {
                    type: "radio",
                    id: F.vyberNaroduSvetla,
                    name: "Výběr národu",
                    label: "Výběr národu",
                    required: true,
                    options: ["Elf", "Člověk", "Trpaslík"],
                    includeForAdditionalPeople: true,
                },
            ],
        },
        {
            type: "condition",
            id: CB.temna,
            conditionId: C.temna,
            children: [
                {
                    type: "radio",
                    id: F.vyberNaroduTemna,
                    name: "Výběr strany",
                    label: "Výběr strany",
                    required: true,
                    options: ["Skřet", "Harad", "Nemrtví"],
                    includeForAdditionalPeople: true,
                },
            ],
        },
        {
            type: "radio",
            id: F.zdravotniOmezeni,
            name: "Zdravotní omezení",
            label: "Zdravotní omezení",
            required: true,
            options: ["Ano", "Ne"],
            includeForAdditionalPeople: true,
        },
        {
            type: "condition",
            id: CB.zdravotniAno,
            conditionId: C.zdravotniAno,
            children: [
                {
                    type: "text",
                    id: F.zdravotniOmezeniJake,
                    name: "Jaké?",
                    label: "Jaké?",
                    required: true,
                    includeForAdditionalPeople: true,
                },
            ],
        },
        {
            type: "radio",
            id: F.zajemVypomoc,
            name: "Máte zájem o výpomoc? (budete kontaktování mailem)",
            label: "Máte zájem o výpomoc? (budete kontaktování mailem)",
            required: true,
            options: ["Ano", "Ne"],
            includeForAdditionalPeople: true,
        },
        {
            type: "radio",
            id: F.zajemZdravotnik,
            name: "Máte zájem o pozici zdravotníka",
            label: "Máte zájem o pozici zdravotníka",
            required: true,
            options: ["Ano", "Ne"],
            includeForAdditionalPeople: true,
        },
        {
            type: "heading",
            id: F.heading3,
            text: "Děti, mazlíčci a auta",
        },
        {
            type: "radio",
            id: F.parkování,
            name: "Parkování auta",
            label: "Parkování auta",
            required: true,
            options: ["Ano", "Ne"],
        },
        {
            type: "condition",
            id: CB.parkAno,
            conditionId: C.parkAno,
            children: [
                {
                    type: "pricing_select",
                    id: F.chciParkovat,
                    name: "Chci parkovat",
                    label: "Chci parkovat",
                    required: true,
                    pricingId: P.parking,
                },
            ],
        },
        {
            type: "pricing_select",
            id: F.mazlicek,
            name: "Domácí mazlíček",
            label: "Domácí mazlíček",
            required: true,
            pricingId: P.pet,
        },
        {
            type: "radio",
            id: F.detiDo6,
            name: "Berete děti do 6 let (včetně)?",
            label: "Berete děti do 6 let (včetně)?",
            required: true,
            options: ["Ano", "Ne"],
        },
        {
            type: "condition",
            id: CB.detiDo6Ano,
            conditionId: C.detiDo6Ano,
            children: [
                {
                    type: "number",
                    id: F.detiDo6Kolik,
                    name: "Kolik?",
                    label: "Kolik?",
                    required: true,
                },
            ],
        },
        {
            type: "radio",
            id: F.deti7az12,
            name: "Berete děti 7–12 let (včetně)?",
            label: "Berete děti 7–12 let (včetně)?",
            required: true,
            options: ["Ano", "Ne"],
        },
        {
            type: "condition",
            id: CB.deti7az12Ano,
            conditionId: C.deti7az12Ano,
            children: [
                {
                    type: "pricing_select",
                    id: F.deti7az12Kolik,
                    name: "Kolik?",
                    label: "Kolik?",
                    required: true,
                    pricingId: P.children7to12,
                },
            ],
        },
        {
            type: "textarea",
            id: F.vzkaz,
            name: "Vzkaz pro organizátory",
            label: "Vzkaz pro organizátory",
            required: false,
        },
        {
            type: "checkbox",
            id: F.souhlasRules,
            name: "Souhlas s pravidly",
            label: "Souhlas s pravidly",
            required: true,
        },
        {
            type: "condition",
            id: CB.bojujiciCena,
            conditionId: C.bojujici,
            children: [
                {
                    type: "pricing_select",
                    id: F.bojujiciCena,
                    name: "Bojujici ucastnik",
                    label: "Bojujici ucastnik",
                    required: true,
                    pricingId: P.fighter,
                    includeForAdditionalPeople: true,
                },
            ],
        },
        {
            type: "condition",
            id: CB.nebojujiciCena,
            conditionId: C.nebojujici,
            children: [
                {
                    type: "pricing_select",
                    id: F.nebojujiciCena,
                    name: "Nebojujici ucastnik",
                    label: "Nebojujici ucastnik",
                    required: true,
                    pricingId: P.nonFighter,
                    includeForAdditionalPeople: true,
                },
            ],
        },
        {
            type: "pricing_select",
            id: F.predStredou,
            name: "Chci přijet před středou",
            label: "Chci přijet před středou",
            required: true,
            pricingId: P.earlyArrival,
            includeForAdditionalPeople: true,
        },
    ],
};

// ============================================
// Seed functions
// ============================================

async function seedAdmin() {
    const passwordHash = await argon2.hash("admin123456");
    const admin = await prisma.user.create({
        data: {
            email: "admin@helmac.cz",
            name: "Admin",
            passwordHash,
            role: "SUPER_ADMIN",
        },
    });
    console.log("Admin user:", admin.email);
    return admin;
}

async function seedYear() {
    const year2026 = await prisma.year.create({
        data: {
            year: 2026,
            title: "Helmáč 2026",
            subtitle: "Bitva o Dol Guldur",
            isActive: true,
            startDate: new Date("2026-07-29"),
            endDate: new Date("2026-08-02"),
            registrationOpen: false,
            registrationStartDate: new Date("2026-05-14"),
            headerPhoto:
                "/uploads/seed-1773960844595-idebyi.webp",
            heroPhoto:
                "/uploads/seed-1773960850206-tuiuf3.webp",
        },
    });
    console.log("Year 2026:", year2026.title);
    return year2026;
}

async function seedPages(yearId: string) {
    const pages = [
        { slug: "uvod", title: "Úvod", sortOrder: 0 },
        { slug: "program", title: "Program", sortOrder: 1 },
        { slug: "co-nabizime", title: "Co nabízíme", sortOrder: 2 },
        { slug: "info", title: "Info", sortOrder: 3 },
        { slug: "pravidla", title: "Pravidla", sortOrder: 4 },
        { slug: "galerie", title: "Galerie", sortOrder: 5 },
        { slug: "novinky", title: "Novinky", sortOrder: 6 },
    ];
    for (const page of pages) {
        await prisma.page.create({
            data: {
                ...page,
                yearId,
                content: { sections: [] },
                isPublished: true,
            },
        });
    }
    console.log("Pages created (7)");
}

async function seedProgram(yearId: string) {
    // Day 1: Středa
    const streda = await prisma.programDay.create({
        data: {
            yearId,
            date: new Date("2026-07-29"),
            label: "Středa",
            sortOrder: 0,
        },
    });
    const stredaEvents = [
        {
            startTime: "13:00",
            title: "1v1",
            description: "Souboj jednotlivců 1v1",
            location: "Náměstí",
            tags: [],
            sortOrder: 0,
        },
        {
            startTime: "15:00",
            title: "Jugger",
            description:
                "Jugger je rychlý týmový sport, ve kterém proti sobě stojí dva týmy a každý se snaží získat co nejvíce bodů umístěním míče do soupeřovy branky.",
            location: "Náměstí",
            tags: [],
            sortOrder: 1,
        },
        {
            startTime: "18:00",
            title: "Workshop - Kekel",
            description:
                'Jde o boj na blízko, který bývá velmi dynamický, někdy označovaný jako "bezhlavá bitka". Bojuje se s měkčenými zbraněmi, ale s důrazem na plný kontakt (full-kontakt).',
            location: "Louka",
            tags: ["Workshop"],
            sortOrder: 2,
        },
        {
            startTime: "19:00",
            title: "Workshop - Irské tance",
            description:
                "Pod vedením zkušené Melkie se nejprve naučíš základní kroky irského tance, které pak využiješ v rámci tzv. ceílí tanců, což jsou irské “společenské” tance.",
            location: "Pódium",
            tags: ["Workshop"],
            sortOrder: 3,
        },
        {
            startTime: "20:00",
            title: "Rituál",
            description:
                "Bílá rada\n\nRada byla svolána, protože stín v Temném hvozdu sílí.\nDol Guldur už není jen šeptem ve větru.",
            location: "Pódium",
            tags: [],
            sortOrder: 4,
        },
        {
            startTime: "21:00",
            title: "Přednáška Tam a zase zpátky",
            description:
                "Svět Středozemě na Helmáči ožívá každý rok a letos k němu přibude i hlas, který ho umí skvěle vyprávět. Podcast Tam a zase zpátky, známý mezi fanoušky Tolkiena svými hlubšími rozbory a nadšeným povídáním, dorazí přímo mezi nás!",
            location: "Pódium",
            tags: [],
            sortOrder: 5,
        },
    ];
    for (const event of stredaEvents) {
        await prisma.programEvent.create({
            data: { dayId: streda.id, ...event, isPublished: true },
        });
    }

    // Day 2: Čtvrtek
    const ctvrtek = await prisma.programDay.create({
        data: {
            yearId,
            date: new Date("2026-07-30"),
            label: "Čtvrtek",
            sortOrder: 1,
        },
    });
    const ctvrtekEvents = [
        {
            startTime: "10:00",
            title: "Arénka 1v1",
            description: "Souboj jednotlivců 1v1",
            location: "Náměstí",
            tags: [],
            sortOrder: 0,
        },
        {
            startTime: "11:00",
            title: "Arénka dýky",
            description: "Souboj jednotlivců na dýky",
            location: "Náměstí",
            tags: [],
            sortOrder: 1,
        },
        {
            startTime: "14:00",
            title: "Workshop - Pomaluj se henou",
            description:
                "Chceš mít originální malování do bitvy či jen zkrášlit svůj zevnějšek? Přijď do Harému, tamější ženy tě to rády naučí.",
            location: "Harém",
            tags: ["Workshop"],
            sortOrder: 2,
        },
        {
            startTime: "15:00",
            title: "Arénka All for one",
            description:
                "Souboj 1v1 v rámci skupin o 3 lidech (případně jeden náhradník)",
            location: "Náměstí",
            tags: [],
            sortOrder: 3,
        },
        {
            startTime: "15:00",
            title: "Workshop - Dřevěná dílna",
            description:
                "Voní ti dřevo? Máš chuť se naučit se pracovat se dřevem? Chceš vytvořit a zanechat za sebou něco hmatatelného? Ať už jsi pokročilý nebo naprostý začátečník, tak tenhle workshop je přímo stvořený pro tebe, vše o dřevě ti vysvětlí mistr Wooden.",
            location: "Bude upřesněno",
            tags: ["Workshop"],
            sortOrder: 4,
        },
        {
            startTime: "17:00",
            title: "Workshop - Párová masáž",
            description:
                "Toužíš po odpočinku, po uvolnění bolavých svalů a zároveň se chceš něčemu přiučit? Nabízíme ti workshop, kde se pod taktovkou zkušené Merry naučíš, jak správně namasírovat, uvolnit svého drahého, milou či osobu tobě blízkou.",
            location: "Harém",
            tags: ["Workshop"],
            sortOrder: 5,
        },
        {
            startTime: "18:00",
            title: "Arénka Kekel",
            description:
                'Jde o boj na blízko, který bývá velmi dynamický, někdy označovaný jako "bezhlavá bitka". Bojuje se s měkčenými zbraněmi, ale s důrazem na plný kontakt (full-kontakt).',
            location: "Náměstí",
            tags: [],
            sortOrder: 6,
        },
        {
            startTime: "18:00",
            title: "Diskuse o zbraních",
            description:
                "Chceš si popovídat o měkčených zbraních? O tom, jaké jsou na Helmáči povolené a proč? Máš pocit, že některým pravidlům vůbec nerozumíš? To jsi tady správně! My také ne! A proto si o tom můžeme společně erudovaně popovídat.",
            location: "Bude upřesněno",
            tags: [],
            sortOrder: 7,
        },
        {
            startTime: "21:00",
            title: "Lucrezia Borgia",
            description:
                "Soubor se od roku 2000 zaobírá hudbou inspirovanou středověkými či renesančními motivy, moravsko-keltskou melodikou i balkánskými rytmy, k jejichž interpretaci používá repliky dobových nástrojů.",
            location: "Pódium",
            tags: ["Koncert"],
            sortOrder: 8,
        },
    ];
    for (const event of ctvrtekEvents) {
        await prisma.programEvent.create({
            data: { dayId: ctvrtek.id, ...event, isPublished: true },
        });
    }

    // Day 3: Pátek
    const patek = await prisma.programDay.create({
        data: {
            yearId,
            date: new Date("2026-07-31"),
            label: "Pátek",
            sortOrder: 2,
        },
    });
    const patekEvents = [
        {
            startTime: "10:00",
            title: "Arénka 1v1",
            description: "Souboj jednotlivců 1v1",
            location: "Náměstí",
            tags: [],
            sortOrder: 0,
        },
        {
            startTime: "11:00",
            title: "Workshop - Tajemný Workshop",
            description:
                "Umíš něco, co ostatní ne? Chceš se ukázat? Máš chuť ostatním předat svoje dovednosti ať už jsou jakékoliv? Chceš svůj vlastní workshop? Napiš nám na helmac@email.cz s poznámkou “Workshopy”.",
            location: "Bude upřesněno",
            tags: ["Workshop"],
            sortOrder: 1,
        },
        {
            startTime: "14:00",
            title: "Arénka 1v1 - Finále",
            description: "Finále souboje jednotlivců 1v1",
            location: "Náměstí",
            tags: [],
            sortOrder: 2,
        },
        {
            startTime: "14:00",
            title: "Arénka dýky - finále",
            description: "Finále souboje na dýky",
            location: "Náměstí",
            tags: [],
            sortOrder: 3,
        },
        {
            startTime: "14:00",
            title: "Workshop - Pojkování",
            description:
                "Chceš si to hodit? Myslíš si, že tři jsou moc? Máme pro tebe řešení. Přijď na žonglovací workshop!\nU poi se budeme věnovat především pendulums, kde si projdeme tuto techniku od základů postupně k složitějším trikům.",
            location: "Louka",
            tags: ["Workshop"],
            sortOrder: 4,
        },
        {
            startTime: "15:00",
            title: "Domination",
            description:
                "Hráči jsou rozmístění u hradby ve dvou týmech. Bojují o vládu nad vlajkami.",
            location: "Hradba",
            tags: [],
            sortOrder: 5,
        },
        {
            startTime: "18:00",
            title: "Arénka Brutálek",
            description:
                "Brutálek je turnaj založený na zápasech beze zbraní. Cílem je donutit soupeře se vzdát, nebo jej 3x dostat mimo prostor hřiště v daném časovém limitu a to za pomocí škrcení (případně páčení).",
            location: "Hradba",
            tags: [],
            sortOrder: 6,
        },
        {
            startTime: "20:00",
            title: "Rituál",
            description:
                "Říká se, že každá cesta má svůj konec.\nA každé rozhodnutí svůj okamžik, kdy už jej nelze vzít zpět.\nSpojené síly elfů, lidí a trpaslíků kráčely.",
            location: "Hradba",
            tags: [],
            sortOrder: 7,
        },
        {
            startTime: "21:00",
            title: "Aukce",
            description: "Aukce kde je možné utratit své Helmíky.",
            location: "Pódium",
            tags: [],
            sortOrder: 8,
        },
    ];
    for (const event of patekEvents) {
        await prisma.programEvent.create({
            data: { dayId: patek.id, ...event, isPublished: true },
        });
    }

    // Day 4: Sobota
    const sobota = await prisma.programDay.create({
        data: {
            yearId,
            date: new Date("2026-08-01"),
            label: "Sobota",
            sortOrder: 3,
        },
    });
    const sobotaEvents = [
        {
            startTime: "12:00",
            title: "Schvalování zbrojí a kostýmů",
            description: "Schvalování zbrojí a kostýmů",
            location: "Hradba",
            tags: [],
            sortOrder: 0,
        },
        {
            startTime: "13:00",
            title: "Bitva",
            description: "Bitva o Dol Guldur",
            location: "Hradba",
            tags: [],
            sortOrder: 1,
        },
        {
            startTime: "21:00",
            title: "Koncert Marta a Rasputin",
            description:
                "Tříčlenné hudební těleso z Trutnova hrající folkovou a lidovou muziku výhradně na akustické nástroje. Hudba je to velmi živá a energická, protože máme rádi tanec a zábavu.",
            location: "Pódium",
            tags: ["Koncert"],
            sortOrder: 2,
        },
    ];
    for (const event of sobotaEvents) {
        await prisma.programEvent.create({
            data: { dayId: sobota.id, ...event, isPublished: true },
        });
    }

    // Day 5: Neděle
    const nedele = await prisma.programDay.create({
        data: {
            yearId,
            date: new Date("2026-08-02"),
            label: "Neděle",
            sortOrder: 4,
        },
    });
    await prisma.programEvent.create({
        data: {
            dayId: nedele.id,
            startTime: "10:00",
            title: "Odjezd",
            description: "Odjezd z Helmáče",
            location: "Kdekoliv",
            tags: [],
            sortOrder: 0,
            isPublished: true,
        },
    });

    console.log("Program: 5 days, 28 events");
}

async function seedSections(yearId: string) {
    const offerType = await prisma.sectionType.create({
        data: {
            yearId,
            label: "Co nabízíme",
            slug: "co-nabizime",
            sortOrder: 0,
            pageTitle: "Co nabízíme",
            pageSubtitle: "Co vám naše akce nabízí",
            metaTitle: "Co nabízíme | Helmáč",
            metaDescription: "Co vám naše akce nabízí",
        },
    });

    const infoType = await prisma.sectionType.create({
        data: {
            yearId,
            label: "Info",
            slug: "info",
            sortOrder: 1,
            pageTitle: "Informace",
            pageSubtitle: "Důležité informace pro účastníky",
            metaTitle: "Info | Helmáč",
            metaDescription: "Důležité informace pro účastníky akce Helmáč",
        },
    });

    const rulesType = await prisma.sectionType.create({
        data: {
            yearId,
            label: "Pravidla",
            slug: "pravidla",
            sortOrder: 2,
            pageTitle: "Pravidla",
            pageSubtitle: "Herní pravidla a pokyny pro účastníky",
            metaTitle: "Pravidla | Helmáč",
            metaDescription: "Pravidla akce Helmáč - herní pravidla a pokyny pro účastníky",
        },
    });

    console.log("Section types: 3");

    // Seed offers
    const offers = [
        {
            title: "Bitva",
            sortOrder: 0,
            content: `<h3><strong>Bitva</strong></h3><p>Bitva u nás není jen o tom, že si hradbu představujeme. Je to prostor, který vznikl tak, aby působil skutečně, a aby vás vtáhl.</p><p>Dominantou Helmáče je reálná hradba, která dává střetům jasný směr i napětí. Kolem ní se odehrávají útoky, obrany i momenty, kdy se rozhoduje o každém kroku. Do akce se zapojuje i dobývací věž, která boji přidává nový rozměr.</p><p>Celý prostor je navržený tak, aby v něm každý našel svoje. Najdete tu takzvanou „funky" louku — místo, kde se potkává nadsázka, kreativita a zábava.</p><p>A pak jsou tu stroje. Trebuchet, balisty i vrhací balvany dodávají celé scéně sílu a autenticitu.</p>`,
        },
        {
            title: "Arénky",
            sortOrder: 1,
            content: `<h3><strong>Arénky</strong></h3><p>Na Helmáči si můžeš vyzkoušet různé typy soubojů — od klasických duelů až po skupinové turnaje. Ať už chceš poměřit síly, nebo si jen vyzkoušet něco nového, arénky jsou otevřené všem, kdo mají chuť bojovat.</p><h2>1 vs 1</h2><p>Klasický duel jeden na jednoho, který prověří tvoje bojové schopnosti i taktiku.</p><h2>Souboj na dýky</h2><p>Rychlá a kontaktní varianta duelu, kde se bojuje s umělými dýkami.</p><h2>Kekel</h2><p>Souboj v plné zbroji pro ty, kteří chtějí otestovat výdrž i sílu.</p><h2>Brutálek</h2><p>Zápasnický turnaj inspirovaný historickými styly boje.</p>`,
        },
        {
            title: "Rituál",
            sortOrder: 2,
            content: `<h3><strong>Rituál</strong></h3><p>Dva večery v průběhu akce nepatří jen programu. Jsou vyhrazeny představení a rituálu, které otevřou bránu do světa, ve kterém se po zbytek času budeme pohybovat. Nejde jen o to dívat se. Jde o to vstoupit.</p><p>Každé z těchto vystoupení je pečlivě vystavěné jako začátek kapitoly se svou atmosférou, napětím i příběhem. Světla, hudba, postavy i prostor se propojí v jeden celek, který vás vtáhne dřív, než si to stihnete uvědomit.</p><p>Tahle představení nejsou jen úchvatná na pohled — jsou to vstupní brány. A jakmile jimi projdete, příběh už vás nepustí.</p>`,
        },
        {
            title: "Workshopy",
            sortOrder: 3,
            content: `<p>Jednou z novinek ročníku 2026 jsou Helmáčovské workshopy. Pro bojující i nebojující jsme si připravili nabídku rozličných aktivit k vyzkoušení či osvojení. Zapojit se budete moci do taneční zábavy v hobitím (až irském) stylu, zdokonalit své zásahy pod vedením organizátorů turnajů, nebo tvořit při malování henou či v dřevěné dílně.</p><p>Na workshopy bude možné se registrovat. Pro pohodlí mistrů svého řemesla i všech účastníků budou nastavené početní stropy. Registrace bude probíhat přes registrační systém.</p>`,
        },
        {
            title: "Kapely",
            sortOrder: 4,
            content: `<h3><strong>Lucrezia Borgia</strong></h3><p>Kapela <strong>Lucrezia Borgia</strong> se od roku 2000 zaobírá hudbou inspirovanou středověkými či renesančními motivy, moravsko-keltskou melodikou i balkánskými rytmy, k jejichž interpretaci používá repliky dobových nástrojů. Písně jsou v češtině, ale i v němčině, latině a španělštině.</p><h3><strong>Marta a Rasputin</strong></h3><p>Letošní čerstvou novinkou sobotního koncertování bude kapela Marta a Rasputin. Tříčlenné hudební těleso z Trutnova hrající folkovou a lidovou muziku výhradně na akustické nástroje.</p>`,
        },
        {
            title: "Harém",
            sortOrder: 5,
            content: `<h3><strong>Harém — Helmáčovská oáza klidu</strong></h3><p>Harém je místem odpočinku, pohodlí a bezpečí, kde můžeš na chvíli odložit zbroj, starosti i únavu z bitev. V tlumeném světle, mezi polštáři, krásnými bytostmi a vůní bylin zde najdeš prostor pro zklidnění, regeneraci i příjemnou společnost.</p><p>Harém je určen účastníkům ve věku <strong>16+</strong> a funguje výhradně jako prostor klidu a komfortu.</p><p><strong>Nabídka obsahuje:</strong></p><ul><li><p>Masáže</p></li><li><p>Malování henou</p></li><li><p>Kvalitní čaj/káva</p></li><li><p>Šachy, karty</p></li><li><p>Dýmky od profesionálů</p></li></ul>`,
        },
        {
            title: "Podcast talk",
            sortOrder: 6,
            content: `<p><strong>Podcast talk</strong></p><p>Svět Středozemě na Helmáči ožívá každý rok a letos k němu přibude i hlas, který ho umí skvěle vyprávět. Podcast <strong>Tam a zase zpátky</strong>, známý mezi fanoušky Tolkiena svými hlubšími rozbory a nadšeným povídáním, dorazí přímo mezi nás!</p><p>Na Helmáči se můžete těšit na jejich povídání o <strong>bitvě v Dol Gulduru</strong>, kde se ponoří do kontextu, souvislostí i zajímavostí, které běžně nezazní.</p>`,
        },
        {
            title: "Stánky",
            sortOrder: 7,
            content: `<p>Seznam letošních stánkařů dáváme ještě dohromady, brzy vás budeme informovat.</p>`,
        },
        {
            title: "Elrondův dům - program pro děti",
            sortOrder: 8,
            content: `<h3><strong>Elrondův dům - program pro děti</strong></h3><p><em>Zatímco Elfí muži a ženy bojují s temnými silami na jihu u pevnosti Dol Guldur, ti, kteří ještě do boje nemohou, se rozhodli přesunout dále od nepokojů směrem na sever.</em></p><p>Jsme Elfové ze skupinky s názvem <strong>Avari</strong> a už několik let se na Helmáči staráme o ty nejmladší. Letos jsme se rozhodli své dveře otevřít i pro děti účastníků.</p><p>Aktuálně se zvládneme postarat až o <strong>12 dětí</strong> ve věku <strong>3 až 12 let</strong>. Otevřeno máme od středy do soboty.</p>`,
        },
        {
            title: "Vodní dýmky",
            sortOrder: 9,
            content: `<h3><strong>Vodní dýmky</strong></h3><p>Helmáč není jen o bitvě, turnaji anebo ruchu na louce. Je to místo, kde se setkávají lidé, přátelé, skupiny lidí. K něčemu takovému by mohla přijít vhod vodní dýmka.</p><p>Pozvali jsme dva šikovné mládence, kteří spolupracují s Cloud Brno (bar s vodními dýmkami). Můžete se těšit na pečlivě připravené dýmky, zajímavé kombinace chutí i servis.</p><ul><li><p>Dýmka tmavá 450,-</p></li><li><p>Dýmka šedá 450,-</p></li><li><p>Vaše dýmka, náš tabák 350,-</p></li><li><p>Váš tabák, naše dýmka 300,-</p></li></ul>`,
        },
    ];

    for (const offer of offers) {
        await prisma.section.create({ data: { sectionTypeId: offerType.id, ...offer } });
    }
    console.log("Offer sections: 10");

    // Seed info sections
    const sections = [
        {
            title: "Organizační věci",
            sortOrder: 0,
            content: `<h3><strong>Vítejte,</strong></h3><p><strong>u informačního souhrnu pro nadcházející ročník bitvy Helmáč.</strong></p><h2><strong>1. Termín a časový harmonogram</strong></h2><ol><li><p><strong>Oficiální délka akce:</strong> Středa 29. 7. 2026 – neděle 2. 8. 2026.</p></li><li><p><strong>Hlavní program:</strong> Středa až pátek jsou věnovány turnajům a doprovodnému programu.</p></li><li><p><strong>Koncerty</strong>: Budou ve čtvrtek a sobotu večer.</p></li><li><p><strong>Hlavní bitva</strong> proběhne v <strong>sobotu odpoledne</strong>.</p></li></ol><h2><strong>2. Doprava a lokalita</strong></h2><ul><li><p><strong>Místo:</strong> Louka u vesnice <strong>Rozkoš</strong> (pomezí Znojemska a Třebíčska).</p></li><li><p><strong>Navigace:</strong> Cesta z vesnice bude značena šipkami.</p></li><li><p><strong>Parkování:</strong> Vyhrazená louka u Pulkovského mlýna.</p></li></ul><h2><strong>3. Podmínky účasti</strong></h2><ul><li><p><strong>Věk:</strong> Minimální věk pro účast je <strong>13 let</strong>. Účastníci ve věku 13–15 let musí mít doprovod osoby starší 18 let.</p></li></ul>`,
        },
        {
            title: "Kontakt",
            sortOrder: 1,
            content: `<p>Oficiální email akce – <a href="mailto:helmac@email.cz">helmac@email.cz</a></p><p>Koordinátor akce – <a href="mailto:helmac@email.cz">helmac@email.cz</a></p><p>Registrace – <a href="mailto:helmac.registrace@email.cz">helmac.registrace@email.cz</a></p><p>Dobrovolníci – <a href="mailto:helmac.otrokar@email.cz">helmac.otrokar@email.cz</a></p>`,
        },
        {
            title: "Podpoř Helmáč",
            sortOrder: 2,
            content: `<h3><strong>Podpoř Helmáč</strong></h3><p>Helmáč už dávno není jen bitva, pomalu se rozrůstá do větších měřítek. Stal se z něho festival, který se snaží mít nabitý program. Připravili jsme pro vás <strong>donorské</strong> (podporovatelské) a <strong>zážitkové balíčky</strong>, díky kterým se můžete stát součástí Helmáče o něco víc.</p><p><strong>Donorské balíčky</strong> jsou pro ty, kdo chtějí Helmáči pomoct a zároveň si odnést něco navíc.</p><p><strong>Zážitkové balíčky</strong> pak otevírají dveře tam, kam se běžně nedostanete.</p>`,
        },
        {
            title: "Bojující strany",
            sortOrder: 3,
            content: `<h2><strong>Světlá strana</strong></h2><h3><strong>Gondor</strong></h3><p>Bílý strom stále vlaje na praporech Gondoru a jeho stráž bdí nad západními zeměmi lidí. Na výzvu proti stínu v Dol Gulduru odpověděli nejen Gondorští, ale i jejich spojenci.</p><h3><strong>Trpaslíci</strong></h3><p>Trpasličí říše utrpěly mnohé rány. Staré dluhy budou splaceny ocelí a ohněm.</p><h3><strong>Elfové</strong></h3><p>Výpravu proti Dol Gulduru vedou elfové z Lothlórienu pod vedením Galadriel.</p><h2><strong>Temná strana</strong></h2><h3><strong>Skřeti</strong></h3><p>V hlubinách Mlžných hor přežívají skřeti. Nekromant z Dol Gulduru začíná svolávat své služebníky.</p><h3><strong>Nemrtví</strong></h3><p>Z hrobek a stínů vystupují ti, kteří měli dávno spočinout.</p><h3><strong>Harad</strong></h3><p>Z dalekého jihu přicházejí válečníci Haradu, vedení slibem moci a odměny.</p>`,
        },
        {
            title: "Zdravotníci",
            sortOrder: 4,
            content: `<h3><strong>Zdravotní pomoc</strong></h3><p>Na festivalu bude po celou dobu zajištěna přítomnost zdravotníků, kteří jsou připraveni pomoci v případě zdravotních obtíží. Obrátit se na ně můžete při úrazech, kolapsech, dehydrataci, alergických reakcích nebo jiných náhlých potížích.</p><p>Doporučujeme vzít si s sebou osobní lékárničku s nejzákladnějšími věcmi – rukavice, náplast, dezinfekce na kůži, obvaz, elastické obinadlo, pinzeta, gázové čtverce.</p>`,
        },
        {
            title: "Psychická pomoc - krizový intervent",
            sortOrder: 5,
            content: `<h3><strong>První psychická pomoc</strong></h3><p>Helmáč je plný hudby, energie, lidí a silných zážitků. Někdy ale může být všeho moc. Právě proto je na festivalu k dispozici psychická první pomoc.</p><p>Tým tvoří proškolení dobrovolníci (interventi), kteří vědí, jak naslouchat bez hodnocení a pomoci ti najít zpět pocit klidu a bezpečí. Vše je diskrétní a respektující.</p><p>Neboj se přijít či napsat zprávu. Pamatuj si, že k tomu přijít nemusíš mít „vážný problém". Stačí, že se necítíš dobře.</p>`,
        },
        {
            title: "Poděkování",
            sortOrder: 6,
            content: `<p>Během pořádání všech ročníků Helmáče jsme se neobešli bez pomoci všeho druhu. Tímto bychom chtěli poděkovat těm, kteří poskytli součinnost, zboží, služby a nebo jinou hodnotu. Jsou to:</p><ul><li><p>Všichni organizátoři, spoluorganizátoři a účastníci</p></li><li><p>Zemědělské družstvo Biskupice</p></li><li><p>obec Radkovice</p></li><li><p>město Jevišovice</p></li><li><p>Turistický oddíl mládeže „Čtverka"</p></li><li><p>Moravian LARP, z.s.</p></li></ul>`,
        },
    ];

    for (const section of sections) {
        await prisma.section.create({
            data: { sectionTypeId: infoType.id, ...section },
        });
    }
    console.log("Info sections: 7");

    // Seed rules
    const rules = [
        {
            title: "Bitva",
            sortOrder: 0,
            showToc: true,
            content: `<h3>PRAVIDLA PRO ROČNÍK 2026</h3><p><em><u>„vyhrazujeme si právo v případě potřeby následující pravidla jakkoliv a kdykoliv poupravit pro vyvážení hry"</u></em></p><p>-> 1,0) ORGanizátor má vždycky hlavní slovo a má vždy pravdu. Nehádejte se s ním!</p><p>-> 1,1) Hraje a bojuje se fair-play.</p><p>-> 1,2) Hráči jsou povinni přečíst si pravidla a řídit se jimi.</p><p>-> 1,3) Je zakázáno před bitvou a v průběhu bitvy požívat jakékoliv omamné látky.</p><p>-> 2,0) <em><u>NESENÁ VÝZBROJ A VÝSTROJ</u></em> – JE ZAKÁZÁNO NÉST S SEBOU DO BITVY NOŽE A DALŠÍ OSTRÉ PŘEDMĚTY.</p><p>-> 2,1) <em><u>BEZPEČNOST a SCHVALOVÁNÍ ZBRANÍ</u></em> -> každá zbraň musí projít schvalováním a musí být od ORGů označena jako schválená.</p>`,
        },
        {
            title: "1 v 1",
            sortOrder: 1,
            content: `<h2>Souboj 1v1</h2><p>Typ: Souboj jednotlivců, 1v1</p><p>Cíl: Třikrát zasáhnout soupeře.</p><p>Místo: Kruhová aréna</p><p>Maximální počet účastníků: 64</p><p>Potřebné vybavení:</p><ul><li><p>Zbraň (viz bod 3 pravidel)</p></li></ul><p>Pravidla:</p><ol><li><p>Soubojový systém v aréně je stejný jako v pravidlech pro bitvu.</p></li><li><p>Po platném uděleném zásahu od sebe soupeři odstupují.</p></li><li><p>Na začátku souboje má účastník přesně 3 životy.</p></li></ol>`,
        },
        {
            title: "Souboj na dýky",
            sortOrder: 2,
            content: `<h2>Souboj na dýky</h2><p>Typ: Souboj jednotlivců, 1v1</p><p>Cíl: Třikrát zasáhnout soupeře.</p><p>Místo: Kruhová aréna</p><p>Maximální počet účastníků: 32</p><p>Potřebné vybavení:</p><ul><li><p>Dýka (účastníkům budou zapůjčeny)</p></li></ul><p>Pravidla:</p><ol><li><p>Soubojový systém v aréně je stejný jako v pravidlech pro bitvu.</p></li><li><p>Je povoleno používat pouze dýky dodané organizátory.</p></li><li><p>Na začátku souboje má účastník přesně 3 životy.</p></li></ol>`,
        },
        {
            title: "Kekel",
            sortOrder: 3,
            content: `<h2>Kekel</h2><p>Typ: Souboj jednotlivců, 1v1</p><p>Souboj v plné zbroji. Na rozdíl od jiných arének zde nerozhoduje jeden zásah — počítá se jejich množství.</p><p>Účastníci se snaží zasáhnout soupeře co nejvíckrát v daném čase.</p>`,
        },
        {
            title: "Brutálek",
            sortOrder: 4,
            content: `<h2>Brutálek</h2><p>Maximální počet účastníků: muži 32, ženy 16</p><p>Typ: Souboj jednotlivců, 1v1.</p><p>Cíl: Dát soupeři K.O. v časovém limitu.</p><p>Místo: Písková aréna o velikosti cca 2 x 2 metrů.</p><p>Brutálek je turnaj založený na zápasech beze zbraní. Cílem je donutit soupeře se vzdát, nebo jej 3x dostat mimo prostor hřiště.</p><p>Pravidla:</p><ol><li><p>Jednotlivci jsou rozděleni do skupin podle váhy a pohlaví.</p></li><li><p>Boj trvá jedno kolo = 3 minuty</p></li><li><p>Škrcení je povoleno</p></li></ol>`,
        },
        {
            title: "Lukostřelba",
            sortOrder: 5,
            content: `<h2>Lukostřelba</h2><p>Maximální počet účastníků: 64</p><p>Typ: Souboj jednotlivců</p><p>Cíl: Trefit co nejvíce terčů v co nejkratším čase</p><p>Místo: Střelecká dráha</p><p>Hráči postupně prochází střeleckou dráhou a snaží se trefit co nejvíce terčů. Na každý terč mají právě jeden pokus.</p><p>Potřebné vybavení:</p><ul><li><p>Luk a šípy</p></li></ul>`,
        },
        {
            title: "Domination",
            sortOrder: 6,
            content: `<h2>Domination</h2><p>Typ: Souboj týmů</p><p>Cíl: Získat co nejvíce bodů</p><p>Místo: Hradba</p><p>Maximální počet účastníků: neomezeno</p><p>Hráči jsou rozmístění u hradby ve dvou týmech. Bojují o vládu nad vlajkami.</p><p>Pravidla:</p><ol><li><p>Jakýkoliv platný zásah ubírá přesně 1 život (bez ohledu na zbroj).</p></li><li><p>Každý bojující jednotlivec má přesně 2 životy.</p></li><li><p>Cílem hry je přetáčet vlajky na vlajky své barvy.</p></li></ol>`,
        },
        {
            title: "Jugger",
            sortOrder: 7,
            content: `<h2>Jugger</h2><p>Typ: Souboj týmů o minimálně 5 členech a maximálně 10 členech.</p><p>Cíl: Získat více juggů (bodů) za herní dobu.</p><p>Místo: Hřiště o velikosti cca 20 x 40 metrů.</p><p>Vybavení pro tuto disciplínu máme k dispozici a bude možné si jej zapůjčit přímo na místě.</p>`,
        },
        {
            title: "All for one - one for all",
            sortOrder: 8,
            content: `<h2>All for one - one for all</h2><p>Typ: Souboj 1v1 v rámci skupin o 3 lidech (případně jeden náhradník)</p><p>Cíl: Získat 26 bodů (za zásah je jeden bod).</p><p>Místo: Aréna cca 5 metrů v průměru.</p><p>Maximální počet skupin: 16</p><p>Skupině je vybraná druhá skupina. Dále se bojuje 1v1 každý s každým. Boj probíhá 90 vteřin nebo do limitu zásahů.</p>`,
        },
    ];

    for (const rule of rules) {
        await prisma.section.create({ data: { sectionTypeId: rulesType.id, ...rule } });
    }
    console.log("Rule sections: 9");
}

async function seedNews(yearId: string, authorId: string) {
    const articles = [
        {
            slug: "podcast-talk",
            title: "Podcast talk",
            excerpt: "Na Helmáč dorazí tvůrci podcastu Tam a zase zpátky",
            content:
                "<p><strong>PODCAST TALK</strong></p><p>Na Helmáč dorazí tvůrci podcastu <strong>Tam a zase zpátky</strong>, kteří vás vezmou hlouběji do světa Středozemě. Těšit se můžete na povídání o bitvě v Dol Guldur i prostor pro vlastní otázky a diskusi.</p>",
            isPublished: true,
            publishedAt: new Date("2026-05-02"),
        },
        {
            slug: "elronduv-dum-program-pro-deti",
            title: "Elrondův dům - program pro děti",
            excerpt: "Elrondův dům otevírá své brány dětem účastníků",
            content:
                "<p><strong>ELRONDŮV DŮM – PROGRAM PRO DĚTI</strong></p><p>Elrondův dům otevírá své brány dětem účastníků! Elfové se postarají o vaše ratolesti hravou a tematickou formou, zatímco si vy užijete Helmáč naplno.</p><p>Čeká je pestrý program inspirovaný Pánem prstenů, spousta her, tvoření i dobrodružství pod vedením zkušených elfů. Kapacita je omezená.</p>",
            isPublished: true,
            publishedAt: new Date("2026-05-02"),
        },
        {
            slug: "workshopy",
            title: "Workshopy",
            excerpt: "Na Helmáči 2026 poprvé rozjíždíme workshopy",
            content:
                "<p><strong>WORKSHOPY</strong></p><p>Na Helmáči 2026 poprvé rozjíždíme workshopy – a je z čeho vybírat. Čekají vás tance, bojové dovednosti, kejklířství, tvoření i odpočinek, ať už jste akční, nebo spíš kreativní duše.</p><p>Chcete se něco naučit, vyzkoušet nebo rovnou ukázat, co ve vás je? Mrkněte na nabídku a zarezervujte si své místo včas.</p>",
            isPublished: true,
            publishedAt: new Date("2026-05-02"),
        },
        {
            slug: "podpor-helmac",
            title: "Podpoř Helmáč",
            excerpt:
                "Helmáč stojí hlavně na lidech a teď můžete být jeho součástí ještě o něco víc",
            content:
                "<p>Helmáč stojí hlavně na lidech a teď můžete být jeho součástí ještě o něco víc i Vy. Připravili jsme pro vás podporovatelské a zážitkové balíčky, díky kterým ho můžete podpořit a zároveň si odnést nebo zažít něco navíc.</p><p>Vyberte si svou cestu – přiložte kámen do hradby, nebo si otevřete dveře k unikátním zážitkům.</p>",
            isPublished: true,
            publishedAt: new Date("2026-05-02"),
        },
    ];

    for (const article of articles) {
        await prisma.news.create({
            data: { yearId, authorId, ...article },
        });
    }
    console.log("News: 4 articles");
}

async function seedAlbums(yearId: string) {
    const albums = [
        {
            yearId,
            title: "Helmáč 2025 - Fraglin Fraglinovič",
            slug: "helmac-2025-fraglin",
            description: "Fotogalerie od Fraglina Fraglinoviče",
            externalUrl: "https://www.rajce.idnes.cz/fraglin/album/helmac-2025",
            coverImage:
                "/uploads/seed-1777836163116-8rj5js.png",
            isPublished: true,
            sortOrder: 0,
        },
        {
            yearId,
            title: "Helmáč 2025 - Jakub Drachmáč Řezníček",
            slug: "helmac-2025-jakub",
            description: "Fotogalerie od Jakuba Drachmáče Řezníčka",
            externalUrl: "https://photos.app.goo.gl/hxhESsTYCZhLM25U8",
            coverImage:
                "/uploads/seed-1777835692484-dv4s3s.jpg",
            isPublished: true,
            sortOrder: 1,
        },
        {
            yearId,
            title: "Helmáč 2025 - Libor Ječný",
            slug: "helmac-2025-libor",
            description: "Fotogalerie od Libora Ječného",
            externalUrl: "https://eu.zonerama.com/Bitvy/Album/13659000",
            coverImage:
                "/uploads/seed-1777836068372-cu85su.jpg",
            isPublished: true,
            sortOrder: 2,
        },
    ];

    for (const album of albums) {
        await prisma.album.create({ data: album });
    }
    console.log("Albums: 3");
}

async function seedRegistrationForm(yearId: string) {
    await prisma.registrationForm.create({
        data: {
            yearId,
            fields: registrationFormData,
        },
    });
    console.log("Registration form created");
}

async function seedGdpr() {
    await prisma.siteSetting.create({
        data: {
            key: "gdpr_text",
            value: `<p>Zásady ochrany osobních údajů</p>
<p>Správce osobních údajů:</p>
<p>BaaTorské Království z.s.</p>
<p>IČO: 04050754</p>
<p>E-mail: <a href="mailto:helmac@email.cz">helmac@email.cz</a></p>
<p>(dále jen „správce")</p>
<p>Tyto zásady ochrany osobních údajů popisují, jakým způsobem správce zpracovává osobní údaje v souvislosti s provozem webových stránek www.helmac.cz a organizací akce HELMAC.</p>
<p>---</p>
<p>1. Jaké osobní údaje zpracováváme</p>
<p>a) Registrace na akci: e-mailová adresa, jméno a příjmení, datum narození, další údaje vyplněné ve formuláři.</p>
<p>b) Uživatelský účet: e-mailová adresa, heslo (uloženo výhradně v zahashované podobě pomocí algoritmu Argon2).</p>
<p>c) Platební údaje: celková cena registrace, variabilní symbol platby, stav platby, datum zaplacení.</p>
<p>d) Technické údaje (cookies): Relace přihlášeného uživatele (30 dní), Relace administrátora (24 hodin), Souhlas s cookies (1 rok). Všechny cookies jsou nezbytné pro fungování webu.</p>
<p>---</p>
<p>2. Účely zpracování: Registrace a organizace akce, Správa uživatelského účtu, Zasílání potvrzovacích e-mailů, Vedení účetních dokladů, Zajištění bezpečnosti webu.</p>
<p>---</p>
<p>3. Doba uchovávání: Registrační údaje nejdéle 3 roky od konání ročníku. Uživatelský účet po dobu jeho existence. Platební údaje dle daňových předpisů (zpravidla 5 let).</p>
<p>---</p>
<p>4. Vaše práva: Právo na přístup, opravu, výmaz, omezení zpracování, přenositelnost údajů a právo podat stížnost u ÚOOÚ.</p>
<p>---</p>
<p>5. Kontakt: helmac@email.cz</p>`,
        },
    });
    console.log("GDPR site setting created");
}

// ============================================
// Main
// ============================================

async function cleanDatabase() {
    await prisma.bankTransaction.deleteMany();
    await prisma.registrationSubmission.deleteMany();
    await prisma.formPreview.deleteMany();
    await prisma.registrationForm.deleteMany();
    await prisma.emailVerificationToken.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.publicUser.deleteMany();
    await prisma.programEvent.deleteMany();
    await prisma.programDay.deleteMany();
    await prisma.news.deleteMany();
    await prisma.album.deleteMany();
    await prisma.section.deleteMany();
    await prisma.sectionType.deleteMany();
    await prisma.page.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.session.deleteMany();
    await prisma.year.deleteMany();
    await prisma.user.deleteMany();
    await prisma.siteSetting.deleteMany();
    console.log("Database cleaned");
}

async function main() {
    console.log("Seeding database...\n");

    await cleanDatabase();

    const admin = await seedAdmin();
    const year2026 = await seedYear();

    await seedPages(year2026.id);
    await seedProgram(year2026.id);
    await seedSections(year2026.id);
    await seedNews(year2026.id, admin.id);
    await seedAlbums(year2026.id);
    await seedRegistrationForm(year2026.id);
    await seedGdpr();

    console.log("\nSeeding completed!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
