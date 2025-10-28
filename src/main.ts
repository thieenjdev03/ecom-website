import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import * as bodyParser from 'body-parser';
import * as express from 'express';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body parsing for webhook signature verification
    bodyParser: false, // Disable default body parser to handle manually
  });
  const configService = app.get(ConfigService);

  // Configure body parsers - raw for webhook, JSON for everything else
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Use raw parser only for PayPal webhook endpoint
    if (req.originalUrl.startsWith('/paypal/webhook')) {
      bodyParser.raw({ type: 'application/json', limit: '10mb' })(req, res, (err) => {
        if (err) return next(err);
        // Store rawBody string version for later signature verification
        (req as any).rawBody = req.body?.toString?.() || req.body;
        next();
      });
    } else {
      // Default JSON parser for all other routes
      bodyParser.json({ limit: '10mb' })(req, res, next);
    }
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter(), new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // CORS
  app.enableCors({
    origin: configService.get('app.corsOrigin'),
    credentials: true,
  });

  // Swagger (OpenAPI)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ecom API')
    .setDescription('E-commerce REST API documentation')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    jsonDocumentUrl: '/docs/json',
    yamlDocumentUrl: '/docs/yaml',
    customSiteTitle: 'Ecom API Docs',
  });

  const port = configService.get('app.port');
  await app.listen(port);
  
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`✅ Swagger UI: http://localhost:${port}/docs`);
}
bootstrap();
