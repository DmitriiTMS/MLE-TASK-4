import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtTokenService } from './jwt.service';

@Module({
    imports: [
        JwtModule.register({
            signOptions: {
                algorithm: 'HS256',
            },
            verifyOptions: {
                algorithms: ['HS256'],
                ignoreExpiration: false,
            },
        }),
    ],
    providers: [JwtTokenService],
    exports: [JwtTokenService, JwtModule],
})
export class JwtTokenModule {}
