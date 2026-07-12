import "dotenv/config";

import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/db";
import { siteConfig } from "../lib/site-config";

async function main() {
  const passwordHash = await bcrypt.hash("Password", 12);

  await prisma.user.upsert({
    where: { email: siteConfig.adminEmail },
    update: {
      name: "Sunspark Admin",
      email: siteConfig.adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      phone: siteConfig.phone
    },
    create: {
      name: "Sunspark Admin",
      email: siteConfig.adminEmail,
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

  await prisma.reportSettings.upsert({
    where: { id: "default" },
    update: {
      enabled: false,
      recipient: siteConfig.reportEmail,
      reportTime: "20:00",
      weekdays: "1,2,3,4,5",
      timezone: "Africa/Nairobi"
    },
    create: {
      id: "default",
      enabled: false,
      recipient: siteConfig.reportEmail,
      reportTime: "20:00",
      weekdays: "1,2,3,4,5",
      timezone: "Africa/Nairobi"
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
