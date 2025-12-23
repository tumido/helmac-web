import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Find active year
    const activeYear = await prisma.year.findFirst({
        where: { isActive: true, isArchived: false },
    });

    if (!activeYear) {
        console.log("No active year found. Creating a test year...");
        const year = await prisma.year.create({
            data: {
                year: 2025,
                title: "Helmac 2025",
                subtitle: "Testovaci rocnik",
                isActive: true,
                isArchived: false,
            },
        });
        console.log("Created year:", year.id);
    }

    const year = await prisma.year.findFirst({
        where: { isActive: true, isArchived: false },
    });

    if (!year) {
        throw new Error("Could not find or create active year");
    }

    console.log("Using year:", year.year, "-", year.title);

    // Create program days
    const days = [
        { date: new Date("2025-07-10"), label: "Den 1", sortOrder: 0 },
        { date: new Date("2025-07-11"), label: "Den 2", sortOrder: 1 },
        { date: new Date("2025-07-12"), label: "Den 3", sortOrder: 2 },
    ];

    for (const dayData of days) {
        const existingDay = await prisma.programDay.findUnique({
            where: {
                yearId_date: {
                    yearId: year.id,
                    date: dayData.date,
                },
            },
        });

        if (existingDay) {
            console.log(`Day ${dayData.label} already exists, skipping...`);
            continue;
        }

        const day = await prisma.programDay.create({
            data: {
                yearId: year.id,
                ...dayData,
            },
        });
        console.log(`Created day: ${day.label}`);

        // Create events for this day
        const events = [
            {
                startTime: "09:00",
                title: "Snidane",
                description: "Spolecna snidane pro vsechny ucastniky. Pripraveno bude tradicni ceske menu vcetne vegetarianskych alternativ.",
                location: "Hlavni stan",
                tags: ["Jidlo", "Spolecne"],
                isPublished: true,
                sortOrder: 0,
            },
            {
                startTime: "10:00",
                title: "Zahajeni turnaje",
                description: "Slavnostni zahajeni hlavniho turnaje. Predstaveni pravidel, rozdeleni do skupin a losovani prvnich zapasu.",
                location: "Arena",
                tags: ["Turnaj", "Hlavni program"],
                isPublished: true,
                sortOrder: 1,
                storyContent: {
                    paragraphs: [
                        "Vitejte na hlavnim turnaji Helmac 2025! Tento rok se utkame v tradicnim formatu, ktery zname a milujeme.",
                        "Kazdy tym bude mit moznost prokazat sve dovednosti v boji jeden na jednoho i v tyovych strelbach.",
                        "Vitez odnese nejen vecnou slavu, ale i specialni cenu pripravenou organizatory.",
                    ],
                },
            },
            {
                startTime: "12:30",
                title: "Obed",
                description: "Poledni prestavka s teplyim jidlem. Menu bude zverejneno den predem.",
                location: "Jidelna",
                tags: ["Jidlo"],
                isPublished: true,
                sortOrder: 2,
            },
            {
                startTime: "14:00",
                title: "Workshop: Zaklady semu",
                description: "Naucte se zaklady historickeho semu pod vedenim zkusenych lektoru. Workshop je vhodny pro zacatecniky i pokrocile.",
                location: "Cviciste",
                tags: ["Workshop", "Sem"],
                isPublished: true,
                sortOrder: 3,
                storyContent: {
                    sections: [
                        {
                            title: "Co se naucite",
                            text: "Zakladni postoje, udery a obranu. Bezpecnostni pravidla a etiketu.",
                        },
                        {
                            title: "Co si vzit",
                            text: "Pohodlne obleceni a pevnou obuv. Zbrane budou k dispozici.",
                        },
                    ],
                },
            },
            {
                startTime: "18:00",
                title: "Vecere",
                description: "Spolecna vecere s grilovackou. Maso i vegetarianske alternativy.",
                location: "Hlavni stan",
                tags: ["Jidlo", "Spolecne"],
                isPublished: true,
                sortOrder: 4,
            },
            {
                startTime: "20:00",
                title: "Vecerni program u ohne",
                description: "Posezeni u taboraku s hudbou a vypravenem. Prinesete si vlastni pribehy a pisne!",
                location: "Taboriste",
                tags: ["Spolecne", "Zabava"],
                isPublished: true,
                sortOrder: 5,
            },
        ];

        for (const eventData of events) {
            await prisma.programEvent.create({
                data: {
                    dayId: day.id,
                    ...eventData,
                },
            });
        }
        console.log(`  Created ${events.length} events for ${day.label}`);
    }

    console.log("\nDone! Test program data created successfully.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
