import "dotenv/config";
import { defineConfig, env } from "prisma/config";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

function loadRootEnv() {
  let currentDir = process.cwd();
  for (let i = 0; i < 10; i++) {
    const lockPath = path.join(currentDir, "bun.lock");
    if (fs.existsSync(lockPath)) {
      dotenv.config({ path: path.join(currentDir, ".env") });
      return;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }
  dotenv.config();
}

loadRootEnv();

export default defineConfig({
  schema: "prisma/",
  migrations: {
    path: "prisma/migrations",
    seed: "bun ./prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
