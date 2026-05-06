import { Logger, Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtTokenModule } from './utils/jwt/jwt.module';
import { PasswordArgon2Service } from './utils/password/password-argon2.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './utils/jwt/jwt.strategy';

@Module({
    imports: [UsersModule, JwtTokenModule, PassportModule.register({ defaultStrategy: 'jwt' })],
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
export class AuthModule { }
