import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

export const createCorsConfig = (configService: ConfigService): CorsOptions => {
    const isProduction = configService.getOrThrow('NODE_ENV') === 'production';
    const allowedOrigins = configService.getOrThrow('CORS_ORIGINS')?.split(',') || [];

    if (isProduction && allowedOrigins.length) {
        return {
            origin: allowedOrigins,
            credentials: true,
        };
    }

    return {
        origin: true,
        credentials: true,
    };
};
