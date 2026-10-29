import { NestFactory } from '@nestjs/core';
import { NextFunction, Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createValidationPipe } from './common/validation';

export async function createApp() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  const config = app.get(ConfigService);
  const origin = (config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  app.enableCors({ origin, credentials: true });
  const express = app.getHttpAdapter().getInstance();
  express.set('etag', false);
  express.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.useGlobalPipes(createValidationPipe());
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('QuizCred API')
    .setDescription(
      'Register, stake credits to enter a quiz, and receive a server-scored reward or lose the stake. Admins manage quizzes. Credit packs can be purchased in-app.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
  return app;
}

async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT ?? '3001';
  await app.listen(port);
}

if (require.main === module) {
  void bootstrap();
}
