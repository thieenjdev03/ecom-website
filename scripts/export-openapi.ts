import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { AppModule } from '../src/app.module';

async function exportOpenAPI() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();

  const config = new DocumentBuilder()
    .setTitle('Ecom API')
    .setDescription('E-commerce REST API documentation')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // Single source of truth: root-level shared/ folder, consumed by all frontends.
  const outPath = join(process.cwd(), '..', 'shared', 'openapi.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(document, null, 2), 'utf-8');

  await app.close();
  console.log(`✅ OpenAPI exported: ${outPath}`);
}

exportOpenAPI().catch((e) => {
  console.error(e);
  process.exit(1);
});
