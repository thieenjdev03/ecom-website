require('reflect-metadata');
require('dotenv/config');
const { NestFactory } = require('@nestjs/core');
const { SwaggerModule, DocumentBuilder } = require('@nestjs/swagger');
const { writeFileSync, mkdirSync } = require('fs');
const { join, dirname } = require('path');
const { AppModule } = require('../dist/app.module');

async function exportOpenAPI() {
  const outPath = join(process.cwd(), 'docs', 'openapi.json');
  mkdirSync(dirname(outPath), { recursive: true });

  // eslint-disable-next-line no-console
  console.log('Starting Nest app (dist) to generate OpenAPI...');
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();

  const config = new DocumentBuilder()
    .setTitle('Ecom API')
    .setDescription('E-commerce REST API documentation')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .build();

  // eslint-disable-next-line no-console
  console.log('Creating OpenAPI document...');
  const document = SwaggerModule.createDocument(app, config);
  writeFileSync(outPath, JSON.stringify(document, null, 2), 'utf-8');

  await app.close();
  // eslint-disable-next-line no-console
  console.log(`✅ OpenAPI exported: ${outPath}`);
}

exportOpenAPI().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


