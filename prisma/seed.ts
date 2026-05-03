import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

// ============================================
// Stable IDs for cross-referencing
// ============================================

// Form field IDs
const F = {
    heading: "f-heading-1",
    description: "f-desc-1",
    name: "f-name",
    group: "f-group",
    email: "f-email",
    birthDate: "f-birth-date",
    memberMlarp: "f-member-mlarp",
    typUcasti: "f-typ-ucasti",
    zaKohoBojujes: "f-za-koho",
    armadaTemna: "f-armada-temna",
    armadaSvetla: "f-armada-svetla",
    prijedesAutem: "f-prijedes-autem",
    spz: "f-spz",
    zaplatAuto: "f-zaplat-auto",
    pole14: "f-pole-14",
    gdpr: "f-gdpr",
    bojujiNebo: "f-bojuji-nebo",
    jakMocBohaty: "f-jak-moc-bohaty",
    darovatVip: "f-darovat-vip",
    komuVip: "f-komu-vip",
    vipDar: "f-vip-dar",
};

// Condition IDs
const C = {
    bojujici: "c-typ-ucasti-bojujici",
    temna: "c-za-koho-temna",
    svetla: "c-za-koho-svetla",
    autemAno: "c-autem-ano",
    darovatVipAno: "c-darovat-vip-ano",
};

// Condition block IDs
const CB = {
    bojujici: "cb-bojujici",
    temna: "cb-temna",
    svetla: "cb-svetla",
    autemAno: "cb-autem-ano",
    darovatVipAno: "cb-darovat-vip-ano",
};

// Pricing definition IDs
const P = {
    memberMlarp: "p-member-mlarp",
    vip: "p-vip",
    masAuto: "p-mas-auto",
    zaplatAuto: "p-zaplat-auto",
    bojujiNebo: "p-bojuji-nebo",
};

// ============================================
// Registration form data
// ============================================

const registrationFormData = {
    priceTiers: [
        "2026-04-01",
        "2026-04-08",
        "2026-04-17",
        "2026-04-18",
        "2026-05-04",
        "2026-07-01",
    ],
    conditions: [
        {
            id: C.bojujici,
            name: "Typ ucasti je Bojujici",
            rules: [
                {
                    type: "field_value" as const,
                    fieldId: F.typUcasti,
                    operator: "equals" as const,
                    value: "Bojujici",
                },
            ],
        },
        {
            id: C.temna,
            name: "Za koho bojujes je Temna",
            rules: [
                {
                    type: "field_value" as const,
                    fieldId: F.zaKohoBojujes,
                    operator: "equals" as const,
                    value: "Temna",
                },
            ],
        },
        {
            id: C.svetla,
            name: "Za koho bojujes je Svetla",
            rules: [
                {
                    type: "field_value" as const,
                    fieldId: F.zaKohoBojujes,
                    operator: "equals" as const,
                    value: "Svetla",
                },
            ],
        },
        {
            id: C.autemAno,
            name: "Prijedes autem je Ano",
            rules: [
                {
                    type: "field_value" as const,
                    fieldId: F.prijedesAutem,
                    operator: "equals" as const,
                    value: "Ano",
                },
            ],
        },
        {
            id: C.darovatVipAno,
            name: "Chci nekomu darovat VIP balicek je Ano",
            rules: [
                {
                    type: "field_value" as const,
                    fieldId: F.darovatVip,
                    operator: "equals" as const,
                    value: "Ano",
                },
            ],
        },
    ],
    pricingDefinitions: [
        {
            id: P.memberMlarp,
            name: "Clen Moravian LARP, o.s.",
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
                    description: "Sleva 200 Kc",
                    prices: [-200],
                },
            ],
        },
        {
            id: P.vip,
            name: "Chces byt VIP",
            usePriceTiers: true,
            options: [
                {
                    id: "po-vip-ne",
                    name: "Ne",
                    description: "I tak te mame radi",
                    prices: [0, 0, 0, 0, 0, 0, 0],
                },
                {
                    id: "po-vip-ano",
                    name: "Rad pomuzu",
                    description: "Jsme radi ze pomuzes",
                    prices: [1000, 1000, 1000, 1000, 1200, 1400, 1600],
                },
                {
                    id: "po-vip-bohaty",
                    name: "Jsem fakt bohaty",
                    description:
                        "No.... tak to uz si vyslouzi VIP kadibudku",
                    prices: [2000, 2000, 2000, 2000, 2500, 3000, 5000],
                },
            ],
        },
        {
            id: P.masAuto,
            name: "Mas auto",
            usePriceTiers: false,
            options: [
                {
                    id: "po-auto-ne",
                    name: "Ne",
                    description: "",
                    prices: [0],
                },
                {
                    id: "po-auto-ano",
                    name: "Ano",
                    description: "",
                    prices: [0],
                },
            ],
        },
        {
            id: P.zaplatAuto,
            name: "Zaplat auto",
            usePriceTiers: true,
            options: [
                {
                    id: "po-zaplat-auto",
                    name: "Parkovne",
                    description: "Poplatek za parkovani na louce",
                    prices: [100, 100, 100, 100, 150, 200, 300],
                },
            ],
        },
        {
            id: P.bojujiNebo,
            name: "Bojuji nebo taky na",
            usePriceTiers: true,
            options: [
                {
                    id: "po-bojuji",
                    name: "Bojuji",
                    description: "",
                    prices: [200, 200, 200, 200, 250, 300, 333],
                },
                {
                    id: "po-nebojuji",
                    name: "Nebojuji",
                    description: "",
                    prices: [100, 100, 100, 100, 150, 180, 200],
                },
                {
                    id: "po-org",
                    name: "jsem org",
                    description: "",
                    prices: [1, 2, 3, 3, 3, 3, 3],
                },
            ],
        },
    ],
    capacityLimits: [
        {
            id: "cl-temna",
            fieldId: F.zaKohoBojujes,
            value: "Temna",
            maxCount: 2,
        },
        {
            id: "cl-svetla",
            fieldId: F.zaKohoBojujes,
            value: "Svetla",
            maxCount: 120,
        },
        {
            id: "cl-vip",
            fieldId: F.vipDar,
            value: "Rad pomuzu",
            maxCount: 10,
        },
    ],
    showOptionCounts: [F.armadaTemna, F.armadaSvetla],
    infoStatsConfig: { enabled: false, stats: [] },
    fields: [
        { type: "heading", id: F.heading, text: "Helmac registrace" },
        {
            type: "description",
            id: F.description,
            text: "Jsme radi ze se jdete registrovat, bez vas by to neslo",
        },
        {
            type: "text",
            id: F.name,
            name: "Jmeno a Prijmeni",
            label: "Jmeno a Prijmeni",
            required: true,
            includeForAdditionalPeople: true,
        },
        {
            type: "text",
            id: F.group,
            name: "Skupina",
            label: "Skupina",
            required: true,
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
            name: "Datum narozeni",
            label: "Datum narozeni",
            required: true,
            includeForAdditionalPeople: true,
        },
        {
            type: "pricing_select",
            id: F.memberMlarp,
            name: "Clen Moravian LARP, o.s.",
            label: "Clen Moravian LARP, o.s.",
            required: true,
            pricingId: P.memberMlarp,
            includeForAdditionalPeople: true,
        },
        {
            type: "radio",
            id: F.typUcasti,
            name: "Typ ucasti",
            label: "Typ ucasti",
            required: true,
            options: ["Bojujici", "Nebojujici"],
            includeForAdditionalPeople: true,
        },
        {
            type: "condition",
            id: CB.bojujici,
            conditionId: C.bojujici,
            children: [
                {
                    type: "radio",
                    id: F.zaKohoBojujes,
                    name: "Za koho bojujes",
                    label: "Za koho bojujes",
                    required: true,
                    options: ["Temna", "Svetla"],
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
                    id: F.armadaTemna,
                    name: "Za jakou armadu bojujes",
                    label: "Za jakou armadu bojujes",
                    required: true,
                    options: ["Skret", "Harad", "Nekromant"],
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
                    id: F.armadaSvetla,
                    name: "Za jakou armadu bojujes",
                    label: "Za jakou armadu bojujes",
                    required: true,
                    options: ["Elf", "Clovek", "Trpaslik"],
                    includeForAdditionalPeople: true,
                },
            ],
        },
        {
            type: "radio",
            id: F.prijedesAutem,
            name: "Prijedes autem",
            label: "Prijedes autem",
            required: true,
            options: ["Ano", "Ne"],
            includeForAdditionalPeople: true,
        },
        {
            type: "condition",
            id: CB.autemAno,
            conditionId: C.autemAno,
            children: [
                {
                    type: "text",
                    id: F.spz,
                    name: "SPZ",
                    label: "SPZ",
                    required: true,
                },
                {
                    type: "pricing_select",
                    id: F.zaplatAuto,
                    name: "Zaplat auto",
                    label: "Zaplat auto",
                    required: true,
                    pricingId: P.zaplatAuto,
                },
            ],
        },
        {
            type: "checkbox",
            id: F.pole14,
            name: "Pole 14",
            label: "Pole 14",
            required: false,
        },
        {
            type: "checkbox",
            id: F.gdpr,
            name: "Souhlasim s GDPR https://registracka.cz/index.php?fm=gdpr",
            label: "Souhlasim s GDPR https://registracka.cz/index.php?fm=gdpr",
            required: true,
        },
        {
            type: "pricing_select",
            id: F.bojujiNebo,
            name: "Bojuji nebo taky na",
            label: "Bojuji nebo taky na",
            required: true,
            pricingId: P.bojujiNebo,
            includeForAdditionalPeople: true,
        },
        {
            type: "pricing_select",
            id: F.jakMocBohaty,
            name: "Jak moc bohaty se citis?",
            label: "Jak moc bohaty se citis?",
            required: true,
            pricingId: P.vip,
            includeForAdditionalPeople: true,
        },
        {
            type: "radio",
            id: F.darovatVip,
            name: "Chci nekomu darovat VIP balicek",
            label: "Chci nekomu darovat VIP balicek",
            required: false,
            options: ["Ne", "Ano"],
        },
        {
            type: "condition",
            id: CB.darovatVipAno,
            conditionId: C.darovatVipAno,
            children: [
                {
                    type: "text",
                    id: F.komuVip,
                    name: "Komu VIP",
                    label: "Komu VIP",
                    required: true,
                },
                {
                    type: "pricing_select",
                    id: F.vipDar,
                    name: "Chces byt VIP",
                    label: "Chces byt VIP",
                    required: true,
                    pricingId: P.vip,
                },
            ],
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

async function seedYears() {
    const year2026 = await prisma.year.create({
        data: {
            year: 2026,
            title: "Helmac 2026",
            subtitle: "vyzeneme zleho pana",
            isActive: true,
            startDate: new Date("2026-07-29"),
            endDate: new Date("2026-08-02"),
            registrationOpen: true,
            registrationStartDate: new Date("2026-03-12"),
        },
    });
    console.log("Year 2026:", year2026.title);

    const year2025 = await prisma.year.create({
        data: {
            year: 2025,
            title: "Helmac 2025",
            subtitle: "Navrat kralovstvi",
            isActive: false,
            isArchived: true,
            startDate: new Date("2025-07-30"),
            endDate: new Date("2025-08-02"),
        },
    });
    console.log("Year 2025 (archived):", year2025.title);

    return { year2026, year2025 };
}

async function seedPages(yearId: string) {
    const pages = [
        { slug: "uvod", title: "Uvod", sortOrder: 0 },
        { slug: "program", title: "Program", sortOrder: 1 },
        { slug: "registrace", title: "Registrace", sortOrder: 2 },
        { slug: "pravidla", title: "Pravidla", sortOrder: 3 },
        { slug: "galerie", title: "Galerie", sortOrder: 4 },
        { slug: "na-pamatku", title: "Na pamatku", sortOrder: 5 },
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
    console.log("Pages created (6)");
}

async function seedProgram(yearId: string) {
    // Day 1: Patek
    const patek = await prisma.programDay.create({
        data: {
            yearId,
            date: new Date("2026-07-31"),
            label: "Patek",
            sortOrder: 0,
        },
    });

    const patekEvents = [
        {
            startTime: "12:01",
            title: "Jidlo",
            description: "Obed pro vsechny ucastniky. Na vyber bude tradicni ceska kuchyne.",
            location: "Jidelna",
            tags: [],
            sortOrder: 0,
        },
        {
            startTime: "13:00",
            title: "Chill time",
            description: "Volny cas pro odpoledni odpocinek, hry a seznamovani.",
            location: "Kdekoliv",
            tags: ["Chill"],
            sortOrder: 1,
        },
        {
            startTime: "15:59",
            title: "Drevarnicka arenka",
            description: "Turnaj v drevarnicke arene. Prijdte si zasoutezit v soubojich jeden na jednoho.",
            location: "Namesti",
            tags: [],
            sortOrder: 2,
        },
    ];

    for (const event of patekEvents) {
        await prisma.programEvent.create({
            data: { dayId: patek.id, ...event, isPublished: true },
        });
    }

    // Day 2: Sobota
    const sobota = await prisma.programDay.create({
        data: {
            yearId,
            date: new Date("2026-08-01"),
            label: "Sobota",
            sortOrder: 1,
        },
    });

    const sobotaEvents = [
        {
            startTime: "00:00",
            title: "Vecerka",
            description: "Nocni posezeni v hospode. Pivo, medovina a dobre historky.",
            location: "Hospoda",
            tags: [],
            sortOrder: 0,
        },
        {
            startTime: "09:30",
            title: "Registrace, schvalovani zbrani",
            description:
                "Prezencni registrace ucastniku a kontrola bezpecnosti vsech zbrani organizatory.",
            location: "Podium",
            tags: [],
            sortOrder: 1,
        },
        {
            startTime: "11:00",
            title: "Brzky predbitevni obed",
            description: "Lehky obed pred bitvou. Naplnte si zaludek, bude to dlouhe odpoledne!",
            location: "Kdekoliv",
            tags: [],
            sortOrder: 2,
        },
        {
            startTime: "12:00",
            title: "Odchod na bojiste",
            description: "Spolecny presun na bojiste. Sraz u hlavni brany.",
            location: "Hradba",
            tags: [],
            sortOrder: 3,
        },
        {
            startTime: "12:59",
            title: "Bitva",
            description:
                "Hlavni bitva rocniku! Temna strana vs. Svetla strana. Bojujte za svou armadu a prinesite ji slavne vitezstvi.",
            location: "Hradba",
            tags: [],
            sortOrder: 4,
            storyContent: {
                paragraphs: [
                    "Hlavni bitva Helmac 2026 bude probíhat na legendární hradbe u Rozkoše.",
                    "Utkaji se dve velke armady — Temna strana (Skreti, Harad, Nekromanti) proti Svetle strane (Elfove, Lide, Trpaslici).",
                    "Bojuje se dle pravidel uvedenych v sekci Pravidla. Nezapomente si proverene zbrane a ochrannou vystroj!",
                ],
            },
        },
        {
            startTime: "21:00",
            title: "Koncert Valar",
            description: "Vecerni koncert kapely Valar. Stredoveky folk a fantasy hudba pod hvezdami.",
            location: "Podium",
            tags: ["Koncert"],
            sortOrder: 5,
        },
    ];

    for (const event of sobotaEvents) {
        await prisma.programEvent.create({
            data: { dayId: sobota.id, ...event, isPublished: true },
        });
    }

    console.log("Program: 2 days, 9 events");
}

async function seedOffers(yearId: string) {
    const offers = [
        {
            title: "Workshopy",
            sortOrder: 0,
            content: `<p>Na Helmaci si muzete vyzkouset ruzne workshopy vedene zkusenymi lektory.</p>
<h3>Vyroba zbrani</h3>
<p>Naucte se zaklady vyroby LARP zbrani z penovych materialu. Workshop je vhodny pro uplne zacatecniky i pokrocile, kteri si chteji zdokonalit techniku. K dispozici budou vsechny potrebne materialy a nastroje.</p>
<h3>Tvorba kostymu</h3>
<p>Chcete si vylepsit svuj kostym? Pod vedenim zkusenych kostymeru se naucite zakladni siti techniky, barveni latek a vyrobu doplnku. Privestte si svuj kostym a my vam poradime, jak ho posunout na dalsi uroven.</p>
<h3>Zaklady historickeho semu</h3>
<p>Workshop zamereny na bezpecne techniky boje s mecem, stitem a dalsi vyzbroji. Zbrane budou k dispozici na miste.</p>`,
        },
        {
            title: "Prednasky",
            sortOrder: 1,
            content: `<p>Behem akce se muzete zucastnit prednasek na ruzna temata spojena se svetem LARP a fantasy.</p>
<h3>Historie a inspirace</h3>
<p>Prezentace o historickych bitvach a udalostech, ktere nas inspirovaly pri tvorbe pribehove linie Helmace. Dozvite se, jak skutecne stredoveke valecnictvi ovlivnilo nase pravidla a scenare.</p>
<h3>LARP strategie a taktika</h3>
<p>Jak efektivne vest armadu na LARP bitvisci? Zkuseni velitele se podeli o sve zkusenosti s organizaci formaci, komunikaci v boji a taktikami, ktere rozhoduji bitvy.</p>
<h3>Svet Helmace</h3>
<p>Prednaska o lore a svete, ve kterem se Helmac odehrava. Poznejte pribeh Temne a Svetle strany, jejich historii a motivace.</p>`,
        },
        {
            title: "Prvni pomoc",
            sortOrder: 2,
            content: `<p>Bezpecnost nasi ucastniku je pro nas prioritou.</p>
<h3>Zdravotni stanoviste</h3>
<p>Po celou dobu akce bude k dispozici zdravotni stanoviste s vyskolenym personalem. V pripade zraneni nebo zdravotnich potizi se obracejte na zdravotniky oznacene cervenym krizem.</p>
<h3>Kde nas najdete</h3>
<p>Zdravotni stan se nachazi vedle hlavniho stanu, hned u vstupu do tabora. Je oznacen velkym cervenym krizem a je pristupny 24 hodin denne.</p>
<h3>Co delat v pripade zraneni</h3>
<p>Pri jakmkoliv zraneni behem bitvy okamzite ukoncete boj a vyhledejte nejblizsiho organizatora nebo zdravotnika. Nezapomente — bezpecnost je vzdy na prvnim miste!</p>`,
        },
    ];

    for (const offer of offers) {
        await prisma.offer.create({ data: { yearId, ...offer } });
    }
    console.log("Offers: 3 sections");
}

async function seedInfoSections(yearId: string) {
    const sections = [
        {
            title: "Organizační",
            sortOrder: 0,
            content: `<h3>Kdy?</h3>
<p>Helmac 2026 se kona od 29. cervence do 2. srpna 2026. Akce nema pevne stanoveny zacatek ani konec — prijedte, kdy vam to vyhovuje. Zavisí jen na vás, kolik si toho z cele akce budete chtit uzit. 🙂</p>
<h3>Kde?</h3>
<p>Misto konani je velice rozkosne krasou sve krajiny. Hradba je postavena na louce blizko vesnicky nesouci nazev ROZKOS. Je to na hranicich Znojemského a Trebicského okresu.</p>
<p><strong>POZOR letos se stanuje o louku vedle!</strong></p>
<h3>Jak se tam dostat?</h3>
<p>GPS souradnice: 49.0847N, 15.9456E. Z Brna smerem na Znojmo, odbocka na Rozkos. Sledujte znaceni „HELMAC" od hlavni silnice.</p>`,
        },
        {
            title: "O vybavení účastníka",
            sortOrder: 1,
            content: `<h3>Povinne vybaveni</h3>
<p>Kazdy ucastnik musi mit vlastni spacak, karimatku a stan (nebo se domluvit na sdileni). Dale je nutne mit pitnou vodu a osobni hygienu.</p>
<h3>Zbrane a vystroj</h3>
<p>Vsechny zbrane musi projit schvalovacim procesem organizatoru. Detailni pravidla pro zbrane naleznete v sekci Pravidla. Doporucujeme lehci vyzbroj — v cervenci byva horko!</p>
<h3>Co se hodi</h3>
<p>Svitilna, opalovaci krem, repelent, pohodlna obuv na presun po loukach, teplé obleceni na vecer, destniky nebo pláštěnky pro pripad deste.</p>`,
        },
        {
            title: "Kontakt",
            sortOrder: 2,
            content: `<h3>Organizacni tym</h3>
<p>Email: <a href="mailto:info@helmac.cz">info@helmac.cz</a></p>
<p>Facebook: <a href="https://www.facebook.com/helmac">facebook.com/helmac</a></p>
<p>Instagram: <a href="https://www.instagram.com/helmac_larp">@helmac_larp</a></p>
<h3>V pripade nouze na akci</h3>
<p>Obracejte se na kohokoliv z organizacniho tymu — budou oznaceni specialnim trikem s logem HELMAC a napisem ORG.</p>`,
        },
        {
            title: "Donatori",
            sortOrder: 3,
            content: `<h3>Dekujeme nasim podporovatelum!</h3>
<p>Helmac by se neobešel bez podpory skvělých lidi a organizaci, kteri nám pomahaji akci kazdy rok uskutecnit.</p>
<p>Chcete se stat donatorem nebo partnerem akce? Kontaktujte nas na <a href="mailto:info@helmac.cz">info@helmac.cz</a>.</p>`,
        },
    ];

    for (const section of sections) {
        await prisma.infoSection.create({
            data: { yearId, ...section },
        });
    }
    console.log("Info sections: 4");
}

async function seedRules(yearId: string) {
    const rules = [
        {
            title: "Bitva",
            sortOrder: 0,
            showToc: true,
            content: `<h3>1) Zakladni pravidla</h3>
<p>Organizator ma vzdycky hlavni slovo a ma vzdy pravdu. Nehádejte se s nim! Hraje a bojuje se fair-play.</p>
<p>Hráči jsou povinni přečíst si pravidla a řídit se jimi. Za jejich porušování můžete být z bitvy vyřazeni.</p>
<p>Je zakázáno před bitvou a v průběhu bitvy požívat jakékoliv omamné látky.</p>

<h3>2) Zbrane</h3>
<p>Každá zbraň musí projít schvalováním a musí být od ORGů označena jako schválená.</p>
<p><strong>Jednoruční</strong> — do 90 cm, lze kombinovat se štítem nebo druhou jednoruční zbraní.</p>
<p><strong>Jedenapůlruční</strong> — 90-110 cm, nelze kombinovat s ničím.</p>
<p><strong>Obouruční</strong> — 110-130 cm, musí být držena oběma rukama.</p>
<p><strong>Štít standardní</strong> — vejde se do obdélníku 60×50 cm.</p>

<h3>3) Boj</h3>
<p><strong>Útočit na hlavu, krk a rozkrok je ZAKÁZÁNO!</strong></p>
<p>Zásahy musí být vedeny se zřetelným nápřahem a musí se před dopadem tlumit.</p>
<p>Zásahy uznává vždy zasažený!</p>
<p>Platný zásah od zbraně na blízko ubírá <strong>-1 život</strong>.</p>
<p>Platný zásah střelou ze střelné zbraně ubírá <strong>-2 životy</strong>.</p>

<h3>4) Životy</h3>
<p>Základní počet jsou <strong>2 životy</strong>.</p>
<p>Za helmu: <strong>+1 život</strong>.</p>
<p>Za zbroj: <strong>až +3 životy</strong> (prošívaná +1, kroužková +2, plátová +3).</p>
<p>Maximální dosažitelný životový strop je <strong>6 životů</strong>.</p>

<h3>5) Smrt a oživování</h3>
<p>Jakmile máte 0 životů, jste mrtví. Jděte jako duch (s rukou na hlavě) ke standartě a oživte se.</p>`,
        },
        {
            title: "Dřevárnická arénka",
            sortOrder: 1,
            content: `<h3>Pravidla drevarnicke arenky</h3>
<p>Drevarnicka arenka je turnaj v soubojich jeden na jednoho s drevenymi zbranemi.</p>

<h3>Format</h3>
<p>Souboje probiha formou eliminacniho turnaje. Kazdy zapas trva maximalne 3 minuty. Vitezi hrac s vice platnych zasahu.</p>

<h3>Zbrane</h3>
<p>Pouzivaji se pouze standardni jednoruci drevarnicke zbrane do 90 cm. Stity nejsou povoleny.</p>

<h3>Zasahy</h3>
<p>Plati stejna zasahova pravidla jako ve velke bitve. Kazdy platny zasah = 1 bod. Vyhra na 3 body nebo vice bodu po uplynuti casu.</p>`,
        },
        {
            title: "Souboj na dýky",
            sortOrder: 2,
            content: `<h3>Pravidla souboje na dyky</h3>
<p>Specialni disciplina pro odvazne — souboj na kratke zbrane (dyky) do 40 cm.</p>

<h3>Bezpecnost</h3>
<p>Dyky musi byt rádně vyměkčené a schválené organizátory. Bodné útoky jsou zakázány — pouze sečné údery.</p>

<h3>Format</h3>
<p>Souboj na 1 zivot. Prvni platny zasah rozhoduje. Zasahy do hlavy, krku a rozkroku jsou zakazany.</p>

<h3>Registrace</h3>
<p>Do turnaje se muzete registrovat na miste u organizatoru arenky. Pocet mist je omezen.</p>`,
        },
        {
            title: "Brutálek",
            sortOrder: 3,
            content: `<h3>Pravidla Brutalku</h3>
<p>Brutalek je specialni bojovy format zaméreny na skupinovy boj v uzavrenem prostoru.</p>

<h3>Jak to funguje</h3>
<p>Dve skupiny (5-10 hracu) se utkaji v male arene. Boj probiha na eliminaci — kdo padne, odchazi z areny. Posledni stojici tym vitezi.</p>

<h3>Pravidla</h3>
<p>Kazdy hrac ma 2 zivoty (bez bonusu za zbroj). Povoleny jsou pouze jednoruci zbrane. Stity nejsou povoleny. Plati standardni zasahova pravidla.</p>

<h3>Specialni pravidla</h3>
<p>V Brutalku plati pravidlo „posledniho stojiciho" — pokud zustane posledni hrac z tymu, ziska navic +1 zivot jako bonus za odvahu.</p>`,
        },
    ];

    for (const rule of rules) {
        await prisma.rule.create({ data: { yearId, ...rule } });
    }
    console.log("Rules: 4 sections");
}

async function seedNews(yearId: string, authorId: string) {
    const articles = [
        {
            slug: "web-funguje",
            title: "Web funguje",
            excerpt: "Tohle se opravdu deje",
            content: "<p>Tada</p>",
            isPublished: true,
            publishedAt: new Date("2026-02-27"),
        },
        {
            slug: "datum-helmace",
            title: "Datum helmace",
            excerpt: "Helmac letos bude a bude od 29.7 do 1.8",
            content:
                "<p>Letos se Helmac kona od <strong>29. cervence do 2. srpna 2026</strong>. Tak si to zapiste do kalendaru a zacnete se pripravovat!</p><p>Taboreni bude jako obvykle na louce u Rozkoše. Letos se stanuje o louku vedle, takze bude vice prostoru.</p>",
            isPublished: true,
            publishedAt: new Date("2026-03-11"),
        },
        {
            slug: "spoustime-registraci",
            title: "Spoustime registraci",
            excerpt: "Je to tak",
            content:
                "<p>Registrace na Helmac 2026 je oficialně otevrena! 🎉</p><p>Neváhejte a zaregistrujte se co nejdrive — vcasná registrace znamena nizsi cenu. Detaily o ceniku najdete primo v registracnim formulari.</p><p>Tesime se na vas!</p>",
            isPublished: true,
            publishedAt: new Date("2026-03-11"),
        },
    ];

    for (const article of articles) {
        await prisma.news.create({
            data: { yearId, authorId, ...article },
        });
    }
    console.log("News: 3 articles");
}

async function seedAlbums(
    yearId2026: string,
    yearId2025: string
) {
    const albums = [
        {
            yearId: yearId2026,
            title: "Kalendar",
            slug: "kalendar",
            description: "Lokace 2024",
            externalUrl: "https://photos.google.com",
            isPublished: true,
            sortOrder: 0,
        },
        {
            yearId: yearId2026,
            title: "Helmac 2025 fotky",
            slug: "helmac-2025-fotky",
            description: "Fotogalerie z minuleho rocniku",
            externalUrl: "https://photos.google.com",
            isPublished: true,
            sortOrder: 1,
        },
        {
            yearId: yearId2025,
            title: "Helmac 2025",
            slug: "helmac-2025",
            description: "Oficialni fotogalerie rocniku 2025",
            externalUrl: "https://photos.google.com",
            isPublished: true,
            sortOrder: 0,
        },
    ];

    for (const album of albums) {
        await prisma.album.create({ data: album });
    }
    console.log("Albums: 3 (2 for 2026, 1 for 2025)");
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

async function seedPublicUsersAndSubmissions(yearId: string) {
    const form = await prisma.registrationForm.findUnique({
        where: { yearId },
    });
    if (!form) {
        console.log("Skipping submissions — no registration form");
        return;
    }

    const passwordHash = await argon2.hash("test123456");

    const users = [
        {
            email: "test1@helmac.cz",
            passwordHash,
            emailVerified: true,
            emailVerifiedAt: new Date("2026-03-01"),
            gdprConsentAt: new Date("2026-03-01"),
        },
        {
            email: "test2@helmac.cz",
            passwordHash,
            emailVerified: true,
            emailVerifiedAt: new Date("2026-03-05"),
            gdprConsentAt: new Date("2026-03-05"),
        },
        {
            email: "test3@helmac.cz",
            passwordHash,
            emailVerified: true,
            emailVerifiedAt: new Date("2026-03-10"),
            gdprConsentAt: new Date("2026-03-10"),
        },
    ];

    const publicUsers = [];
    for (const u of users) {
        const pu = await prisma.publicUser.create({ data: u });
        publicUsers.push(pu);
    }
    console.log("Public users: 3");

    const submissions = [
        {
            yearId,
            formId: form.id,
            publicUserId: publicUsers[0].id,
            status: "CONFIRMED" as const,
            variableSymbol: "1234567890",
            totalPrice: 1200,
            isPaid: true,
            paidAt: new Date("2026-03-15"),
            gdprConsentAt: new Date("2026-03-10"),
            createdAt: new Date("2026-03-10"),
            data: {
                "Jmeno a Prijmeni": "Jan Novak",
                "Skupina": "Druzina mecu",
                "Email": "test1@helmac.cz",
                "Datum narozeni": "1995-06-15",
                "Clen Moravian LARP, o.s.": "Ne",
                "Typ ucasti": "Bojujici",
                "Za koho bojujes": "Svetla",
                "Za jakou armadu bojujes": "Elf",
                "Prijedes autem": "Ne",
                "Souhlasim s GDPR https://registracka.cz/index.php?fm=gdpr":
                    true,
                "Bojuji nebo taky na": "Bojuji",
                "Jak moc bohaty se citis?": "Rad pomuzu",
            },
            pricingSummary: {
                tiers: [
                    { tierDate: "2026-04-01", totalPrice: 1200 },
                    { tierDate: "2026-04-08", totalPrice: 1200 },
                    { tierDate: "2026-04-17", totalPrice: 1200 },
                    { tierDate: "2026-04-18", totalPrice: 1200 },
                    { tierDate: "2026-05-04", totalPrice: 1450 },
                    { tierDate: "2026-07-01", totalPrice: 1700 },
                    { tierDate: null, totalPrice: 1933 },
                ],
                applicableTierIndex: 0,
                totalPrice: 1200,
            },
        },
        {
            yearId,
            formId: form.id,
            publicUserId: publicUsers[1].id,
            status: "CONFIRMED" as const,
            variableSymbol: "2345678901",
            totalPrice: 200,
            isPaid: true,
            paidAt: new Date("2026-03-18"),
            gdprConsentAt: new Date("2026-03-12"),
            createdAt: new Date("2026-03-12"),
            data: {
                "Jmeno a Prijmeni": "Petra Svobodova",
                "Skupina": "Lesni elfove",
                "Email": "test2@helmac.cz",
                "Datum narozeni": "1998-11-22",
                "Clen Moravian LARP, o.s.": "Ano",
                "Typ ucasti": "Nebojujici",
                "Prijedes autem": "Ne",
                "Souhlasim s GDPR https://registracka.cz/index.php?fm=gdpr":
                    true,
                "Bojuji nebo taky na": "Nebojuji",
                "Jak moc bohaty se citis?": "Ne",
            },
            pricingSummary: {
                tiers: [
                    { tierDate: "2026-04-01", totalPrice: -100 },
                    { tierDate: "2026-04-08", totalPrice: -100 },
                    { tierDate: "2026-04-17", totalPrice: -100 },
                    { tierDate: "2026-04-18", totalPrice: -100 },
                    { tierDate: "2026-05-04", totalPrice: -50 },
                    { tierDate: "2026-07-01", totalPrice: -20 },
                    { tierDate: null, totalPrice: 0 },
                ],
                applicableTierIndex: 0,
                totalPrice: -100,
            },
        },
        {
            yearId,
            formId: form.id,
            publicUserId: publicUsers[2].id,
            status: "PENDING" as const,
            variableSymbol: "3456789012",
            totalPrice: 2200,
            isPaid: false,
            gdprConsentAt: new Date("2026-03-20"),
            createdAt: new Date("2026-03-20"),
            data: {
                "Jmeno a Prijmeni": "Tomas Kral",
                "Skupina": "BaaTor",
                "Email": "test3@helmac.cz",
                "Datum narozeni": "1992-03-08",
                "Clen Moravian LARP, o.s.": "Ne",
                "Typ ucasti": "Bojujici",
                "Za koho bojujes": "Temna",
                "Za jakou armadu bojujes": "Harad",
                "Prijedes autem": "Ano",
                "SPZ": "2B4 1234",
                "Zaplat auto": "Parkovne",
                "Souhlasim s GDPR https://registracka.cz/index.php?fm=gdpr":
                    true,
                "Bojuji nebo taky na": "Bojuji",
                "Jak moc bohaty se citis?": "Jsem fakt bohaty",
            },
            pricingSummary: {
                tiers: [
                    { tierDate: "2026-04-01", totalPrice: 2300 },
                    { tierDate: "2026-04-08", totalPrice: 2300 },
                    { tierDate: "2026-04-17", totalPrice: 2300 },
                    { tierDate: "2026-04-18", totalPrice: 2300 },
                    { tierDate: "2026-05-04", totalPrice: 2900 },
                    { tierDate: "2026-07-01", totalPrice: 3500 },
                    { tierDate: null, totalPrice: 5633 },
                ],
                applicableTierIndex: 0,
                totalPrice: 2300,
            },
        },
        {
            yearId,
            formId: form.id,
            publicUserId: publicUsers[0].id,
            status: "PENDING" as const,
            variableSymbol: "4567890123",
            totalPrice: 800,
            isPaid: false,
            gdprConsentAt: new Date("2026-03-25"),
            createdAt: new Date("2026-03-25"),
            data: {
                "Jmeno a Prijmeni": "Lucie Kralova",
                "Skupina": "Druzina mecu",
                "Email": "test1@helmac.cz",
                "Datum narozeni": "1997-01-30",
                "Clen Moravian LARP, o.s.": "Ano",
                "Typ ucasti": "Bojujici",
                "Za koho bojujes": "Svetla",
                "Za jakou armadu bojujes": "Clovek",
                "Prijedes autem": "Ne",
                "Souhlasim s GDPR https://registracka.cz/index.php?fm=gdpr":
                    true,
                "Bojuji nebo taky na": "Bojuji",
                "Jak moc bohaty se citis?": "Rad pomuzu",
            },
            pricingSummary: {
                tiers: [
                    { tierDate: "2026-04-01", totalPrice: 1000 },
                    { tierDate: "2026-04-08", totalPrice: 1000 },
                    { tierDate: "2026-04-17", totalPrice: 1000 },
                    { tierDate: "2026-04-18", totalPrice: 1000 },
                    { tierDate: "2026-05-04", totalPrice: 1250 },
                    { tierDate: "2026-07-01", totalPrice: 1500 },
                    { tierDate: null, totalPrice: 1733 },
                ],
                applicableTierIndex: 0,
                totalPrice: 1000,
            },
        },
        {
            yearId,
            formId: form.id,
            publicUserId: publicUsers[1].id,
            status: "CONFIRMED" as const,
            variableSymbol: "5678901234",
            totalPrice: 400,
            isPaid: true,
            paidAt: new Date("2026-04-01"),
            gdprConsentAt: new Date("2026-03-28"),
            createdAt: new Date("2026-03-28"),
            data: {
                "Jmeno a Prijmeni": "Martin Dvorak",
                "Skupina": "Nocni vlci",
                "Email": "test2@helmac.cz",
                "Datum narozeni": "2000-07-14",
                "Clen Moravian LARP, o.s.": "Ne",
                "Typ ucasti": "Bojujici",
                "Za koho bojujes": "Svetla",
                "Za jakou armadu bojujes": "Trpaslik",
                "Prijedes autem": "Ne",
                "Souhlasim s GDPR https://registracka.cz/index.php?fm=gdpr":
                    true,
                "Bojuji nebo taky na": "Bojuji",
                "Jak moc bohaty se citis?": "Ne",
            },
            pricingSummary: {
                tiers: [
                    { tierDate: "2026-04-01", totalPrice: 200 },
                    { tierDate: "2026-04-08", totalPrice: 200 },
                    { tierDate: "2026-04-17", totalPrice: 200 },
                    { tierDate: "2026-04-18", totalPrice: 200 },
                    { tierDate: "2026-05-04", totalPrice: 250 },
                    { tierDate: "2026-07-01", totalPrice: 300 },
                    { tierDate: null, totalPrice: 333 },
                ],
                applicableTierIndex: 0,
                totalPrice: 200,
            },
        },
    ];

    for (const sub of submissions) {
        await prisma.registrationSubmission.create({ data: sub });
    }
    console.log("Registration submissions: 5");
}

async function seedGdpr() {
    await prisma.siteSetting.create({
        data: {
            key: "gdpr_text",
            value: `<h2>Zpracování osobních údajů</h2>
<p>Správcem osobních údajů je organizační tým akce Helmac. Vaše osobní údaje (jméno, email, datum narození) zpracováváme za účelem organizace akce a komunikace s účastníky.</p>
<p>Údaje jsou uchovávány po dobu nezbytnou pro organizaci akce a následně po dobu stanovenou právními předpisy. Máte právo na přístup ke svým údajům, jejich opravu, výmaz a další práva dle GDPR.</p>
<p>Kontakt pro dotazy ohledně zpracování osobních údajů: <a href="mailto:info@helmac.cz">info@helmac.cz</a></p>`,
        },
    });
    console.log("GDPR site setting created");
}

async function seedArchivedYearContent(yearId: string, authorId: string) {
    // Pages for archived year
    const pages = [
        { slug: "uvod", title: "Uvod", sortOrder: 0 },
        { slug: "program", title: "Program", sortOrder: 1 },
        { slug: "galerie", title: "Galerie", sortOrder: 2 },
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

    // News for archived year
    await prisma.news.create({
        data: {
            yearId,
            authorId,
            slug: "helmac-2025-se-konal",
            title: "Helmac 2025 se konal!",
            excerpt: "Dekujeme vsem ucastnikum za skvely rocnik",
            content:
                "<p>Helmac 2025 je za nami! Dekujeme vsem, kteri prisjeli a udelali z letosniho rocniku nezapomenutelny zazitek. Tesime se na vas zase pristi rok!</p>",
            isPublished: true,
            publishedAt: new Date("2025-08-05"),
        },
    });

    console.log("Archived year 2025: 3 pages, 1 news");
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
    await prisma.offer.deleteMany();
    await prisma.infoSection.deleteMany();
    await prisma.rule.deleteMany();
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
    const { year2026, year2025 } = await seedYears();

    await seedPages(year2026.id);
    await seedProgram(year2026.id);
    await seedOffers(year2026.id);
    await seedInfoSections(year2026.id);
    await seedRules(year2026.id);
    await seedNews(year2026.id, admin.id);
    await seedAlbums(year2026.id, year2025.id);
    await seedRegistrationForm(year2026.id);
    await seedPublicUsersAndSubmissions(year2026.id);
    await seedGdpr();

    await seedArchivedYearContent(year2025.id, admin.id);

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
