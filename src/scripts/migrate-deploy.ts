import dataSource from "../database/typeorm.config";

interface DatabaseState {
  hasUserTable: boolean;
  migrationCount: number;
}

async function getDatabaseState(): Promise<DatabaseState> {
  const [{ has_user_table: hasUserTable }] = await dataSource.query(`
    SELECT to_regclass('public."user"') IS NOT NULL AS has_user_table
  `);

  const [{ has_migrations_table: hasMigrationsTable }] =
    await dataSource.query(`
    SELECT to_regclass('public.migrations') IS NOT NULL AS has_migrations_table
  `);

  if (!hasMigrationsTable) {
    return { hasUserTable, migrationCount: 0 };
  }

  const [{ count }] = await dataSource.query(
    'SELECT COUNT(*)::int AS count FROM "migrations"',
  );
  return { hasUserTable, migrationCount: Number(count) };
}

async function main(): Promise<void> {
  await dataSource.initialize();

  try {
    const state = await getDatabaseState();

    if (!state.hasUserTable && state.migrationCount === 0) {
      // The historical migration set has no initial user-table migration. On a
      // brand-new database, establish the current entity schema once, then
      // baseline the legacy migration history without replaying it.
      console.log(
        "[migrate] Empty database detected; creating baseline schema...",
      );
      await dataSource.synchronize(false);
      await dataSource.runMigrations({ transaction: "all", fake: true });
      console.log("[migrate] Baseline schema and migration history are ready.");
      return;
    }

    if (!state.hasUserTable) {
      throw new Error(
        'Database has migration history but is missing the "user" table. Refusing to bootstrap over an inconsistent schema.',
      );
    }

    const migrations = await dataSource.runMigrations({ transaction: "all" });
    console.log(`[migrate] Applied ${migrations.length} pending migration(s).`);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error("[migrate] Deployment migration failed.", error);
  process.exitCode = 1;
});
