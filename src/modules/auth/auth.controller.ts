import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Logger,
    Post,
    Res,
    Req,
    UseGuards,
    UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from './decorators/current-user.decorator';
import { ApiGetMeDocumentation } from './decorators/swagger-get-me.decorator';
import { ApiLoginDocumentation } from './decorators/swagger-login.decorator';
import { ApiLogoutDocumentation } from './decorators/swagger-logout.decorator';
import { ApiRefreshTokenDocumentation } from './decorators/swagger-refresh-token.decorator';
import { ApiRegisterDocumentation } from './decorators/swagger-register.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LogMessages } from './types/constants/log-messages.constants';
import { JwtAuthGuard } from './utils/jwt/jwt-auth.guard';
import type { IAuthService } from './auth.service.interface';
import type { Response, Request } from 'express';

@ApiTags('Авторизация')
@Controller('auth')
export class AuthController {
    private readonly context = AuthController.name;
    private readonly methodPost = 'POST';
    private readonly methodGet = 'GET';
    private readonly routeRegister = '/auth/register';
    private readonly routeLogin = '/auth/login';
    private readonly routeMe = '/auth/get-me';
    private readonly routeRefresh = '/auth/refresh';

    constructor(
        private readonly logger: Logger,
        @Inject('IAuthService') private readonly authService: IAuthService,
    ) {}

    @Post('register')
    @UseGuards(ThrottlerGuard)
    @HttpCode(HttpStatus.CREATED)
    @ApiRegisterDocumentation()
    async register(
        @Body() registerDto: RegisterDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<{ accessToken: string }> {
        const { name, email } = registerDto;
        try {
            this.logger.log(
                LogMessages.auth.register.requestReceived(
                    this.context,
                    this.methodPost,
                    this.routeRegister,
                    JSON.stringify({ name, email }),
                ),
            );
            const tokens = await this.authService.register(registerDto);

            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            this.logger.log(
                LogMessages.auth.register.requestSuccess(
                    this.context,
                    this.methodPost,
                    this.routeRegister,
                    'register in successfully',
                ),
            );
            return { accessToken: tokens.accessToken };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                LogMessages.auth.register.registrationFailed(
                    this.context,
                    this.methodPost,
                    this.routeRegister,
                    errorMessage,
                ),
            );
            throw error;
        }
    }

    @Post('login')
    @UseGuards(ThrottlerGuard)
    @HttpCode(HttpStatus.OK)
    @ApiLoginDocumentation()
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { email } = loginDto;
        try {
            this.logger.log(
                LogMessages.auth.login.requestReceived(
                    this.context,
                    this.methodPost,
                    this.routeLogin,
                    JSON.stringify({ email }),
                ),
            );

            const tokens = await this.authService.login(loginDto);

            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            this.logger.log(
                LogMessages.auth.login.requestSuccess(
                    this.context,
                    this.methodPost,
                    this.routeLogin,
                    'login in successfully',
                ),
            );
            return { accessToken: tokens.accessToken };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                LogMessages.auth.login.loginFailed(
                    this.context,
                    this.methodPost,
                    this.routeLogin,
                    errorMessage,
                ),
            );
            throw error;
        }
    }

    @Get('get-me')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiGetMeDocumentation()
    async getProfile(@CurrentUser() user: { id: number; email: string }) {
        try {
            this.logger.log(
                LogMessages.auth.me.requestSuccess(
                    this.context,
                    this.methodGet,
                    this.routeMe,
                    JSON.stringify(user),
                ),
            );
            return user;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw errorMessage;
        }
    }

    @Post('refresh-token')
    @HttpCode(HttpStatus.OK)
    @ApiRefreshTokenDocumentation()
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<{ accessToken: string }> {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            this.logger.warn(
                LogMessages.auth.refresh.tokenNotFound(
                    this.context,
                    this.methodPost,
                    this.routeRefresh,
                ),
            );
            throw new UnauthorizedException('Refresh token not found');
        }

        try {
            this.logger.log(
                LogMessages.auth.refresh.requestReceived(
                    this.context,
                    this.methodPost,
                    this.routeRefresh,
                ),
            );

            const tokens = await this.authService.refreshTokens(refreshToken);
            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            this.logger.log(
                LogMessages.auth.refresh.requestSuccess(
                    this.context,
                    this.methodPost,
                    this.routeRefresh,
                ),
            );

            return { accessToken: tokens.accessToken };
        } catch (error: unknown) {
            res.clearCookie('refreshToken');
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                LogMessages.auth.refresh.refreshFailed(
                    this.context,
                    this.methodPost,
                    this.routeRefresh,
                    errorMessage,
                ),
            );
            throw error;
        }
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiLogoutDocumentation()
    async logout(
        @Res({ passthrough: true }) res: Response,
        @CurrentUser() user: { id: number; email: string },
    ): Promise<{ message: string }> {
        this.logger.log(`[${this.context}] - Logout user: ${user.email}`);

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        });

        return { message: 'Logged out successfully' };
    }
}
