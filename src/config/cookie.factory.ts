import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

export const createCookieMiddleware = (configService: ConfigService) => {
    const secret = configService.getOrThrow('COOKIES_SECRET');
    return cookieParser(secret);
};