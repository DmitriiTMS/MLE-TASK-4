import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtTokenService } from './jwt.service';

@Module({
    imports: [JwtModule.register({})],
    providers: [JwtTokenService],
    exports: [JwtTokenService, JwtModule],
})
export class JwtTokenModule {}
