import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { IAuthService } from './auth.service.interface';
import { RegisterDto } from './dto/register.dto';
import { JwtTokenService, Tokens } from './utils/jwt/jwt.service';
import type { IUsersRepository } from '../users/users.repository.interface';
import type { IUsersService } from '../users/users.service.interface';
import type { IPasswordService } from './utils/password/password.interface';

@Injectable()
export class AuthService implements IAuthService {

    private readonly context = AuthService.name;
    private readonly operationRegister = 'register';

    constructor(
        private readonly logger: Logger,
        @Inject('IPasswordService') private readonly passwordService: IPasswordService,
        @Inject('IUsersRepository') private readonly userRepository: IUsersRepository,
        @Inject('IUsersService') private readonly userService: IUsersService,
        private readonly jwtTokenService: JwtTokenService,
    ) { }

    async register(data: RegisterDto): Promise<Tokens> {
        this.logger.log(`[${this.context}] - [${this.operationRegister}] - ${data.name} - ${data.email}`);

        const existUser = await this.userRepository.findByEmail(data.email);
        if (existUser) {
            this.logger.warn(
                `[${AuthService.name}] - [ConflictException] - [Пользователь уже существует]`,
            );
            throw new ConflictException('Пользователь уже существует');
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
        this.logger.log(`[${this.context}] - [${this.operationRegister}] - ${JSON.stringify(tokens)}`);
        return tokens;
    }
}
