import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Logger, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import type { IAuthService } from './auth.service.interface';
import { JwtAuthGuard } from './utils/jwt/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { LogMessages } from './types/constants/log-messages.constants';

@Controller('auth')
export class AuthController {
    private readonly context = AuthController.name;
    private readonly methodPost = 'POST';
    private readonly methodGet = 'GET';
    private readonly routeRegister = '/auth/register';
    private readonly routeMe = '/auth/me';

    constructor(
        private readonly logger: Logger,
        @Inject('IAuthService') private readonly authService: IAuthService,
    ) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response): Promise<{ accessToken: string }> {
        const { name, email } = registerDto
        try {
            this.logger.log(LogMessages.auth.register.requestReceived(this.context, this.methodPost, this.routeRegister, JSON.stringify({ name, email })));
            const tokens = await this.authService.register(registerDto);

            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            this.logger.log(LogMessages.auth.register.requestSuccess(this.context, this.methodPost, this.routeRegister, JSON.stringify({ accessToken: tokens.accessToken })));
            return { accessToken: tokens.accessToken }
        } catch (error: any) {
            this.logger.error(LogMessages.auth.register.registrationFailed(this.context, this.methodPost, this.routeRegister, error.message));
            throw error;
        }

    }


    @Get('me')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    getProfile(@CurrentUser() user) {
            this.logger.log(LogMessages.auth.me.requestSuccess(this.context, this.methodGet, this.routeMe, JSON.stringify(user)));
            return user;
    }
}
