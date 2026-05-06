import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private readonly logger: Logger) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        this.logger.log(`[JwtAuthGuard] - Request to: ${request.method} ${request.url}`);
        
        return super.canActivate(context);
    }

    handleRequest(err, user, info) {
        if (err || !user) {
            if (err) {
                this.logger.error(`[JwtAuthGuard] - Auth error: ${err.message}`);
            }
            if (info?.name === 'TokenExpiredError') {
                this.logger.warn(`[JwtAuthGuard] - Token expired`);
                throw new UnauthorizedException('Token has expired');
            }
            if (info?.name === 'JsonWebTokenError') {
                this.logger.warn(`[JwtAuthGuard] - Invalid token: ${info.message}`);
                throw new UnauthorizedException('Invalid token');
            }
            this.logger.warn(`[JwtAuthGuard] - Unauthorized access attempt`);
            throw err || new UnauthorizedException('Unauthorized');
        }
        
        this.logger.log(`[JwtAuthGuard] - User ${user.id} authenticated successfully`);
        return user;
    }
}
