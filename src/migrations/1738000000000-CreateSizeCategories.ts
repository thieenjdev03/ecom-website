import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSizeCategories1738000000000 implements MigrationInterface {
  name = 'CreateSizeCategories1738000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "size_categories" (
        "size_id" UUID NOT NULL,
        "category_id" UUID NOT NULL,
        CONSTRAINT "PK_size_categories" PRIMARY KEY ("size_id", "category_id"),
        CONSTRAINT "FK_size_categories_size"
          FOREIGN KEY ("size_id") REFERENCES "sizes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_size_categories_category"
          FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_size_categories_category_id" ON "size_categories" ("category_id")`,
    );
    // Drop the generated FK/index before removing the legacy single-category column.
    const table = await queryRunner.getTable('sizes');
    const categoryColumn = table?.findColumnByName('categoryId');
    if (categoryColumn) {
      await queryRunner.query(`
        INSERT INTO "size_categories" ("size_id", "category_id")
        SELECT "id", "categoryId"
        FROM "sizes"
        WHERE "categoryId" IS NOT NULL
        ON CONFLICT DO NOTHING
      `);
      const foreignKey = table?.foreignKeys.find((key) => key.columnNames.includes('categoryId'));
      if (foreignKey) await queryRunner.dropForeignKey('sizes', foreignKey);
      const index = table?.indices.find((item) => item.columnNames.includes('categoryId'));
      if (index) await queryRunner.dropIndex('sizes', index);
      await queryRunner.dropColumn('sizes', categoryColumn);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sizes" ADD "categoryId" UUID`);
    await queryRunner.query(`
      UPDATE "sizes" AS size
      SET "categoryId" = selected."category_id"
      FROM (
        SELECT DISTINCT ON ("size_id") "size_id", "category_id"
        FROM "size_categories"
        ORDER BY "size_id", "category_id"
      ) AS selected
      WHERE selected."size_id" = size."id"
    `);
    await queryRunner.query(`
      ALTER TABLE "sizes"
      ADD CONSTRAINT "FK_sizes_category"
      FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION
    `);
    await queryRunner.query(`CREATE INDEX "IDX_sizes_categoryId" ON "sizes" ("categoryId")`);
    await queryRunner.query(`DROP TABLE "size_categories"`);
  }
}
