import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserPayload {
    id: number;
    email: string;
    sub?: number;
}

export const CurrentUser = createParamDecorator(
    (_: unknown, ctx: ExecutionContext): UserPayload => {
        const request = ctx.switchToHttp().getRequest<Request & { user: UserPayload }>();
        return request.user;
    },
);
