
# Cursor Task: Add Swagger + Export API Review Markdown (NestJS)

## 🎯 Goal
Implement Swagger (OpenAPI 3) in the NestJS backend, then **export `openapi.json`** and render a **Markdown API review doc (`API_REVIEW.md`)** for teammates to read.

## ✅ Acceptance Criteria
- [ ] Swagger UI available at `http://localhost:4000/docs` (configurable).
- [ ] `openapi.json` exported to `./docs/openapi.json` via script.
- [ ] Markdown review doc generated at `./docs/API_REVIEW.md` from OpenAPI.
- [ ] Every controller/route has basic decorators: `@ApiTags`, `@ApiOperation`, `@ApiResponse` (2xx, 4xx).
- [ ] DTOs leverage class-validator/class-transformer and appear in Swagger schema.
- [ ] CI-friendly scripts: `pnpm openapi:export`, `pnpm openapi:md`.

## 🧩 Scope (NestJS app at `apps/api`)
- Add Swagger to `main.ts`.
- Create script `scripts/export-openapi.ts` to export `openapi.json` **without** starting HTTP server.
- Install a converter to turn OpenAPI → Markdown (`widdershins`), and generate `API_REVIEW.md`.
- Ensure works on macOS (`zsh`).

---

## 1) Dependencies
```zsh
# inside apps/api
pnpm add @nestjs/swagger swagger-ui-express
# dev tool for OpenAPI -> Markdown
pnpm add -D widdershins
```

> If class-validator isn't installed:
```zsh
pnpm add class-validator class-transformer
```

---

## 2) Wire Swagger (main.ts)
_If `main.ts` not yet configured, update it as follows._
```ts
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Ecom API')
    .setDescription('E-commerce REST API documentation')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    // include: [/* Optional: feature modules */],
    // deepScanRoutes: true,
  });
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: '/docs/json',
    yamlDocumentUrl: '/docs/yaml',
    customSiteTitle: 'Ecom API Docs',
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`✅ Swagger UI: http://localhost:${port}/docs`);
}
bootstrap();
```

---

## 3) Decorate Controllers & DTOs
Minimal examples (apply across modules):

```ts
// apps/api/src/modules/products/dto/create-product.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumberString, IsOptional } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Laptop 14”' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'laptop-14' })
  @IsString()
  slug: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '19990000.00', description: 'Decimal string' })
  @IsNumberString()
  price: string;
}
```

```ts
// apps/api/src/modules/products/products.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly svc: ProductsService) {}

  @ApiOperation({ summary: 'Create a product' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.svc.create(dto);
  }

  @ApiOperation({ summary: 'List products' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  findAll() {
    return this.svc.findAll();
  }
}
```

---

## 4) Export OpenAPI **without** starting server
Create file: `apps/api/scripts/export-openapi.ts`

```ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

async function exportOpenAPI() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('Ecom API')
    .setDescription('E-commerce REST API documentation')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const outPath = join(process.cwd(), 'docs', 'openapi.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(document, null, 2), 'utf-8');

  await app.close();
  console.log(`✅ OpenAPI exported: ${outPath}`);
}

exportOpenAPI().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Add npm scripts (in `apps/api/package.json`):
```json
{
  "scripts": {
    "openapi:export": "ts-node -r tsconfig-paths/register ./scripts/export-openapi.ts",
    "openapi:md": "widdershins ./docs/openapi.json -o ./docs/API_REVIEW.md --summary --expandBody --language_tabs 'shell:Shell' 'javascript:JavaScript'"
  }
}
```

> **Note**: ensure `ts-node` & `tsconfig-paths` are installed in workspace if not:
```zsh
pnpm add -D ts-node tsconfig-paths
```

Run:
```zsh
pnpm openapi:export
pnpm openapi:md
```

Outputs:
- `docs/openapi.json`
- `docs/API_REVIEW.md` ✅

---

## 5) Optional: CI Job (GitLab/GitHub)
```yaml
# .gitlab-ci.yml or .github/workflows
generate_api_docs:
  stage: build
  image: node:20
  script:
    - pnpm install
    - pnpm --filter api openapi:export
    - pnpm --filter api openapi:md
  artifacts:
    paths:
      - apps/api/docs/openapi.json
      - apps/api/docs/API_REVIEW.md
```

---

## 6) Review Checklist (for PRs)
- [ ] Controller methods have `@ApiOperation` (summary).
- [ ] Standard responses documented (`200/201/400/401/403/404/422/500` where relevant).
- [ ] DTO fields include `@ApiProperty` + validators.
- [ ] Breaking changes reflected in `openapi.json` diff.
- [ ] `API_REVIEW.md` regenerated and attached to PR.

---

## 7) Quick Commands (macOS)
```zsh
# Start API
pnpm --filter api start:dev

# View Swagger UI
open http://localhost:${PORT:-4000}/docs

# Export & generate Markdown
pnpm --filter api openapi:export && pnpm --filter api openapi:md

# Preview Markdown locally
open ./apps/api/docs/API_REVIEW.md
```
