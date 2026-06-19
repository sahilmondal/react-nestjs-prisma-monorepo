import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'], // Adjust log levels as needed
  });

  // Cookie parsing (required for HttpOnly refresh token cookie)
  app.use(cookieParser());

  // CORS
  const origins = (process.env.FRONTEND_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({
    origin: origins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const rawPort = (process.env.PORT ?? '').trim();
  const parsedPort = rawPort.length > 0 ? Number(rawPort) : Number.NaN;
  const port =
    Number.isFinite(parsedPort) && parsedPort >= 0 && parsedPort <= 65535
      ? parsedPort
      : 3009;

  await app.listen(port);
  console.log(`🚀 nestjs-prisma-api running at http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
