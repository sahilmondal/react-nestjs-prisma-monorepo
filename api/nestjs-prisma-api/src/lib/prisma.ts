import { config } from "dotenv";
import { PrismaClient } from "../generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"

// Load .env before NestJS bootstrap so DATABASE_URL is available at module-init time
config();

const rawDatabaseUrl = process.env.DATABASE_URL
const databaseUrl = (rawDatabaseUrl ?? "").trim()
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required")
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
})

export const prismaClientOptions = { adapter }

export function createPrismaClient() {
  return new PrismaClient(prismaClientOptions)
}
