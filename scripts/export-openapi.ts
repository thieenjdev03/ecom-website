import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { AppModule } from '../src/app.module';

async function exportOpenAPI() {
  const markerPath = join(process.cwd(), 'docs', 'export-started.marker');
  try {
    mkdirSync(dirname(markerPath), { recursive: true });
    writeFileSync(markerPath, String(Date.now()), 'utf-8');
  } catch {}
  // eslint-disable-next-line no-console
  console.log('Starting Nest app to generate OpenAPI...');
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
  const outPath = join(process.cwd(), 'docs', 'openapi.json');
  mkdirSync(dirname(outPath), { recursive: true });
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


