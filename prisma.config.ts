import { loadEnvFile } from "./lib/env";

loadEnvFile();

export default {
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL
  },
  migrations: {
    seed: "tsx prisma/seed.ts"
  }
};
