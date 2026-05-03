import { ValidationPipeOptions } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const createValidationConfig = (configService: ConfigService): ValidationPipeOptions => ({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: configService.get('NODE_ENV') === 'production',
    transformOptions: {
        enableImplicitConversion: false,
    },
});