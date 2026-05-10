import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { SwaggerModule } from '@nestjs/swagger';
import { createCookieMiddleware } from './config/cookie.factory';
import { createCorsConfig } from './config/cors.factory';
import { swaggerConfig } from './config/swagger.config';
import { createValidationConfig } from './config/validation.factory';
import { AppModule } from './modules/app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);

    const port = config.getOrThrow<number>('HTTP_PORT');
    const host = config.getOrThrow<string>('HTTP_HOST');

    app.use(createCookieMiddleware(config));
    app.useGlobalPipes(new ValidationPipe(createValidationConfig(config)));
    app.enableCors(createCorsConfig(config));

    const enableSwagger = config.getOrThrow('ENABLE_SWAGGER') === 'true';

    if (enableSwagger) {
        const document = SwaggerModule.createDocument(app, swaggerConfig);
        SwaggerModule.setup('/api-voting-system', app, document);
        Logger.log('📚 Swagger documentation enabled');
    }

    app.setGlobalPrefix(config.getOrThrow<string>('HTTP_PREFIX'));
    await app.listen(port, host);

    Logger.log(`🚀 Application is running on: ${await app.getUrl()}`);
    Logger.log(`📍 Environment: ${config.get('NODE_ENV')}`);
}
bootstrap().catch((err: unknown): void => {
    const message = err instanceof Error ? err.message : String(err);
    Logger.error(`❌ Failed to start application: ${message}`);
    process.exit(1);
});
