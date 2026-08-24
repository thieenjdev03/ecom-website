import { bootstrap } from "../main";
import { runDeploymentMigrations } from "./migrate-deploy";

async function startDeploy(): Promise<void> {
  await runDeploymentMigrations();
  await bootstrap();
}

startDeploy().catch((error) => {
  console.error("[deploy] Startup failed before the API became ready.", error);
  process.exitCode = 1;
});
