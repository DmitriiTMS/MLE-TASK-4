import { Logger, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AUTH_INJECTION_TOKENS } from './types/constants/auth-injection-tokens';
import { JwtTokenModule } from './utils/jwt/jwt.module';
import { JwtStrategy } from './utils/jwt/jwt.strategy';
import { PasswordArgon2Service } from './utils/password/password-argon2.service';

@Module({
    imports: [JwtTokenModule, PassportModule.register({ defaultStrategy: 'jwt' }), UsersModule],
    controllers: [AuthController],
    providers: [
        Logger,
        JwtStrategy,
        {
            provide: AUTH_INJECTION_TOKENS.IAUTH_SERVICE,
            useClass: AuthService,
        },
        {
            provide: AUTH_INJECTION_TOKENS.IPASSWORD_SERVICE,
            useClass: PasswordArgon2Service,
        },
    ],
})
export class AuthModule {}
