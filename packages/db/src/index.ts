import fs from "fs";
import path from "path";
import { config } from "dotenv";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

// Dynamically load the root .env by walking up from the current working directory to find the monorepo root
function loadRootEnv() {
  let currentDir = process.cwd();
  for (let i = 0; i < 10; i++) {
    const lockPath = path.join(currentDir, "bun.lock");
    if (fs.existsSync(lockPath)) {
      config({ path: path.join(currentDir, ".env") });
      return;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }
  // Fallback to default dotenv behavior if bun.lock is not found
  config();
}

loadRootEnv();

const rawDatabaseUrl = process.env.DATABASE_URL;
const databaseUrl = (rawDatabaseUrl ?? "").trim();

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Production-grade PostgreSQL pool configuration
const pool = new pg.Pool({
  connectionString: databaseUrl,
  max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 20,
  idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT, 10) : 30000,
  connectionTimeoutMillis: process.env.DB_CONNECT_TIMEOUT ? parseInt(process.env.DB_CONNECT_TIMEOUT, 10) : 2000,
});

const adapter = new PrismaPg(pool);
export const prismaClientOptions = { adapter };

export function createPrismaClient() {
  return new PrismaClient(prismaClientOptions);
}

// Single instance for standard backend imports
export const prisma = createPrismaClient();

export async function closeDatabaseConnections() {
  await prisma.$disconnect();
  await pool.end();
}

// Export the generated Client module contents
export * from "./generated/prisma/client.js";
