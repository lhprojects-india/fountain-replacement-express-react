import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from workspace root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    // Use DIRECT_URL for CLI commands (like db push) to avoid pooling issues
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
