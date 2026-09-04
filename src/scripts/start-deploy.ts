import { bootstrap } from "../main";
import { runDeploymentMigrations } from "./migrate-deploy";
import { seedAdminFromEnv } from "./seed-admin";

async function startDeploy(): Promise<void> {
  await runDeploymentMigrations();
  await seedAdminFromEnv();
  await bootstrap();
}

startDeploy().catch((error) => {
  console.error("[deploy] Startup failed before the API became ready.", error);
  process.exitCode = 1;
});
