import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SugarWsAdapter } from './adapters/sugar-ws.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? '*',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false }),
  );

  // Custom WS adapter that reads `type` instead of `event` to stay
  // compatible with the existing frontend WebSocket protocol
  app.useWebSocketAdapter(new SugarWsAdapter(app));

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`Sugar Swap backend → http://localhost:${port}`);
}

bootstrap();
