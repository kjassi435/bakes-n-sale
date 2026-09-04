// Vercel serverless entry for the NestJS API.
// Boots the same AppModule as local dev, but instead of app.listen()
// the underlying Express instance serves Vercel's (req, res).
// Cached across warm invocations. Local dev still uses src/main.ts.
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from '../dist/src/app.module';

let expressApp: any;

async function getApp() {
  if (expressApp) return expressApp;
  const nest = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  nest.setGlobalPrefix('api');
  nest.enableCors({
    origin: (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    credentials: true,
  });
  nest.use(cookieParser());
  nest.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await nest.init();
  expressApp = nest.getHttpAdapter().getInstance();
  return expressApp;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  const app = await getApp();
  return app(req, res);
}
