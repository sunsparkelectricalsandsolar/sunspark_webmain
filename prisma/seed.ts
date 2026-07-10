import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import { siteConfig } from "../lib/site-config";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password", 12);

  await prisma.user.upsert({
    where: { email: siteConfig.email },
    update: {
      name: "Sunspark Admin",
      role: UserRole.ADMIN
    },
    create: {
      name: "Sunspark Admin",
      email: siteConfig.email,
      passwordHash,
      role: UserRole.ADMIN,
      phone: siteConfig.phone
    }
  });

  const categories = [
    {
      name: "Electricals",
      slug: "electricals",
      description: "Cables, switches, breakers, fittings, and installation essentials.",
      sortOrder: 1
    },
    {
      name: "Electronics",
      slug: "electronics",
      description: "Reliable electronics and accessories for home and business.",
      sortOrder: 2
    },
    {
      name: "Solar",
      slug: "solar",
      description: "Panels, inverters, batteries, charge controllers, and complete kits.",
      sortOrder: 3
    }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category
    });
  }

  await prisma.checkoutSettings.upsert({
    where: { id: "default" },
    update: {
      whatsappEnabled: true,
      mpesaEnabled: false,
      whatsappPhone: siteConfig.whatsappPhone
    },
    create: {
      id: "default",
      whatsappEnabled: true,
      mpesaEnabled: false,
      whatsappPhone: siteConfig.whatsappPhone
    }
  });

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {
      name: siteConfig.name,
      phone: siteConfig.phone,
      email: siteConfig.email,
      facebookUrl: siteConfig.facebookUrl,
      mapUrl: siteConfig.mapUrl,
      location: siteConfig.location
    },
    create: {
      id: "default",
      name: siteConfig.name,
      phone: siteConfig.phone,
      email: siteConfig.email,
      facebookUrl: siteConfig.facebookUrl,
      mapUrl: siteConfig.mapUrl,
      location: siteConfig.location
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
