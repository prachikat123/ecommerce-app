import { createApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./prisma.js";

async function main() {
  const app = createApp();

  // Fail fast if the database isn't reachable.
  await prisma.$connect();

  app.listen(config.port, () => {
    console.log(`\n  KrishiBazaar API ready`);
    console.log(`  → http://localhost:${config.port}/api/health\n`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
