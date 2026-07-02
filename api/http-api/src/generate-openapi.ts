import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppModule } from './app.module.js';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });

  const config = new DocumentBuilder()
    .setTitle('NestJS Prisma API')
    .setDescription('Auto-generated OpenAPI 3.0 spec from NestJS controllers and DTOs')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('refresh_token')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outPath = resolve(process.cwd(), 'openapi.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2), 'utf-8');
  console.log(`OpenAPI spec written to ${outPath}`);

  await app.close();
  process.exit(0);
}

generate().catch((err) => {
  console.error('Failed to generate OpenAPI spec:', err);
  process.exit(1);
});
