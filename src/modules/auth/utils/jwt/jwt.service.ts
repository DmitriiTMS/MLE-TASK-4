import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface JwtPayload {
    sub: number; // user id
    email: string;
}

export interface Tokens {
    accessToken: string;
    refreshToken: string;
}

@Injectable()
export class JwtTokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async generateTokens(payload: JwtPayload): Promise<Tokens> {
        const [accessToken, refreshToken] = await Promise.all([
            this.generateAccessToken(payload),
            this.generateRefreshToken(payload),
        ]);

        return { accessToken, refreshToken };
    }

    async generateAccessToken(payload: JwtPayload): Promise<string> {
        return this.jwtService.signAsync(
            {
                sub: payload.sub,
                email: payload.email,
            },
            {
                expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN') || '15m',
                secret: this.configService.get('JWT_ACCESS_SECRET'),
            },
        );
    }

    async generateRefreshToken(payload: JwtPayload): Promise<string> {
        return this.jwtService.signAsync(
            { sub: payload.sub, email: payload.email },
            {
                expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            },
        );
    }

    async verifyAccessToken(token: string): Promise<JwtPayload> {
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_ACCESS_SECRET'),
            });
            return payload;
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired access token');
        }
    }

    async verifyRefreshToken(token: string): Promise<JwtPayload> {
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            return payload;
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    decodeToken(token: string): JwtPayload | null {
        return this.jwtService.decode(token);
    }

    async refreshTokens(refreshToken: string): Promise<Tokens> {
        const payload = await this.verifyRefreshToken(refreshToken);
        return this.generateTokens({
            sub: payload.sub,
            email: payload.email,
        });
    }
}
