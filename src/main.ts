import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService);

  const port = config.getOrThrow<number>('HTTP_PORT');
  const host = config.getOrThrow<string>('HTTP_HOST');

  app.setGlobalPrefix(config.getOrThrow<string>('HTTP_PREFIX'));
  await app.listen(port, host);

  Logger.log(`🚀 Application is running on: ${await app.getUrl()}`)
  Logger.log(`📍 Environment: ${config.get('NODE_ENV')}`)
}
bootstrap();
