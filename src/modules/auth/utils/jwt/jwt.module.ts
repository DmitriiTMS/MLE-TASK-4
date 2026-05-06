import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtTokenService } from './jwt.service';

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.getOrThrow('JWT_ACCESS_SECRET'),
                signOptions: {
                    expiresIn: configService.getOrThrow('JWT_ACCESS_EXPIRES_IN'),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [JwtTokenService],
    exports: [JwtTokenService, JwtModule],
})
export class JwtTokenModule {}
