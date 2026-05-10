import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

export const createCookieMiddleware = (configService: ConfigService) => {
    const secret = configService.getOrThrow<string>('COOKIES_SECRET');
    return cookieParser(secret);
};
