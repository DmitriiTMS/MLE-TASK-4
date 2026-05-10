import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './jwt.service';
import type { IAuthService } from '../../auth.service.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        @Inject('IAuthService') private readonly authService: IAuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow('JWT_ACCESS_SECRET'),
            algorithms: ['HS256'],
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.authService.validate(payload.sub);
        return {
            id: user.id,
            email: user.email,
            name: user.name,
        };
    }
}
