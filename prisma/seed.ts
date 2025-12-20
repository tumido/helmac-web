import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create super admin
  const passwordHash = await argon2.hash("admin123456");

  const admin = await prisma.user.upsert({
    where: { email: "admin@helmac.cz" },
    update: {},
    create: {
      email: "admin@helmac.cz",
      name: "Admin",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Created admin user:", admin.email);

  // Create first year
  const year = await prisma.year.upsert({
    where: { year: 2025 },
    update: {},
    create: {
      year: 2025,
      title: "Helmac 2025",
      isActive: true,
    },
  });

  console.log("Created year:", year.title);

  // Create default pages
  const defaultPages = [
    { slug: "uvod", title: "Uvod", sortOrder: 0 },
    { slug: "program", title: "Program", sortOrder: 1 },
    { slug: "registrace", title: "Registrace", sortOrder: 2 },
    { slug: "pravidla", title: "Pravidla", sortOrder: 3 },
    { slug: "galerie", title: "Galerie", sortOrder: 4 },
    { slug: "na-pamatku", title: "Na pamatku", sortOrder: 5 },
  ];

  for (const page of defaultPages) {
    await prisma.page.upsert({
      where: {
        yearId_slug: {
          yearId: year.id,
          slug: page.slug,
        },
      },
      update: {},
      create: {
        ...page,
        yearId: year.id,
        content: { sections: [] },
        isPublished: true,
      },
    });
  }

  console.log("Created default pages");
  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
