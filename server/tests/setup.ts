import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Runs in each test worker before the test file is imported.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.DATABASE_URL = `file:${path.join(root, "prisma", "test.db").replace(/\\/g, "/")}`;
