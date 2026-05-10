import {
    ConflictException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { IAuthService } from './auth.service.interface';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AUTH_MESSAGE } from './types/constants/types';
import { IGetMe } from './types/types';
import { JwtTokenService, Tokens } from './utils/jwt/jwt.service';
import type { IUsersRepository } from '../users/users.repository.interface';
import type { IUsersService } from '../users/users.service.interface';
import type { IPasswordService } from './utils/password/password.interface';

@Injectable()
export class AuthService implements IAuthService {
    private readonly context = AuthService.name;
    private readonly operationRegister = 'register';
    private readonly operationLogin = 'login';
    private readonly operationRefresh = 'refresh';

    constructor(
        private readonly logger: Logger,
        @Inject('IPasswordService') private readonly passwordService: IPasswordService,
        @Inject('IUsersRepository') private readonly userRepository: IUsersRepository,
        @Inject('IUsersService') private readonly userService: IUsersService,
        private readonly jwtTokenService: JwtTokenService,
    ) {}

    async register(data: RegisterDto): Promise<Tokens> {
        this.logger.log(
            `[${this.context}] - [${this.operationRegister}] - ${data.name} - ${data.email}`,
        );

        const existUser = await this.userRepository.findByEmail(data.email);
        if (existUser) {
            this.logger.warn(`[${AuthService.name}] - [${AUTH_MESSAGE.USER_EXIST}]`);
            throw new ConflictException(AUTH_MESSAGE.USER_EXIST);
        }
        const hashPassword = await this.passwordService.hash(data.password);
        const dataUser = {
            name: data.name,
            email: data.email,
            hashPassword,
        };

        const user = await this.userService.create(dataUser);
        const tokens = await this.jwtTokenService.generateTokens({
            sub: user.id,
            email: user.email,
        });
        this.logger.log(
            `[${this.context}] - [${this.operationRegister}] - User register in successfully: ${user.email}`,
        );
        return tokens;
    }

    async login(data: LoginDto): Promise<Tokens> {
        const user = await this.userRepository.findByEmail(data.email);
        if (!user) {
            this.logger.warn(`[${AuthService.name}] - [${AUTH_MESSAGE.INCORRECT_LOGIN}]`);
            throw new UnauthorizedException(AUTH_MESSAGE.INCORRECT_LOGIN);
        }

        const isExistPassword = await this.passwordService.verify(user.passwordHash, data.password);
        if (!isExistPassword) {
            this.logger.warn(`[${AuthService.name}] - [${AUTH_MESSAGE.INCORRECT_LOGIN}]`);
            throw new UnauthorizedException(AUTH_MESSAGE.INCORRECT_LOGIN);
        }

        const tokens = await this.jwtTokenService.generateTokens({
            sub: user.id,
            email: user.email,
        });
        this.logger.log(
            `[${this.context}] - [${this.operationLogin}] - User login in successfully: ${user.email}`,
        );
        return tokens;
    }

    async validate(userId: number): Promise<IGetMe> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            this.logger.warn(`[${AuthService.name}] - [${AUTH_MESSAGE.USER_NOT_FOUND}]`);
            throw new NotFoundException(AUTH_MESSAGE.USER_NOT_FOUND);
        }
        return user;
    }

    async refreshTokens(refreshToken: string): Promise<Tokens> {
        this.logger.log(`[${this.context}] - [${this.operationRefresh}] - Refreshing tokens`);

        try {
            const payload = await this.jwtTokenService.verifyRefreshToken(refreshToken);

            const user = await this.userRepository.findById(payload.sub);
            if (!user) {
                this.logger.warn(
                    `[${AuthService.name}] - [${this.operationRefresh}] - User not found: ${payload.sub}`,
                );
                throw new UnauthorizedException(AUTH_MESSAGE.USER_NOT_FOUND);
            }

            const tokens = await this.jwtTokenService.generateTokens({
                sub: user.id,
                email: user.email,
            });

            this.logger.log(
                `[${this.context}] - [${this.operationRefresh}] - Tokens refreshed successfully for user: ${user.email}`,
            );

            return tokens;
        } catch (error: any) {
            this.logger.error(
                `[${this.context}] - [${this.operationRefresh}] - Refresh failed: ${error.message}`,
            );
            throw new UnauthorizedException(AUTH_MESSAGE.INVALID_REFRESH_TOKEN);
        }
    }
}
