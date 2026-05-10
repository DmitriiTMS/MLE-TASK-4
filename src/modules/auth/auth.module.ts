import { Logger, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtTokenModule } from './utils/jwt/jwt.module';
import { JwtStrategy } from './utils/jwt/jwt.strategy';
import { PasswordArgon2Service } from './utils/password/password-argon2.service';

@Module({
    imports: [
        JwtTokenModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        ThrottlerModule.forRoot({
            throttlers: [
                {
                    ttl: 60000,
                    limit: 5,
                },
            ],
        }),
        UsersModule,
    ],
    controllers: [AuthController],
    providers: [
        Logger,
        JwtStrategy,
        {
            provide: 'IAuthService',
            useClass: AuthService,
        },
        {
            provide: 'IPasswordService',
            useClass: PasswordArgon2Service,
        },
    ],
})
export class AuthModule {}
