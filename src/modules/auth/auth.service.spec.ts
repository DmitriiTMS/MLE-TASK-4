import {
    ConflictException,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AUTH_MESSAGE } from './types/constants/types';
import { IGetMe } from './types/types';
import { JwtTokenService, Tokens } from './utils/jwt/jwt.service';

// yarn test -- src/modules/auth/auth.service.spec.ts

interface IPasswordService {
    hash(password: string): Promise<string>;
    verify(hash: string, password: string): Promise<boolean>;
}

interface IUsersRepository {
    findByEmail(email: string): Promise<any>;
    findById(id: number): Promise<any>;
}

interface IUsersService {
    create(data: any): Promise<any>;
}

describe('AuthService', () => {
    let authService: AuthService;
    let passwordService: IPasswordService;
    let userRepository: IUsersRepository;
    let userService: IUsersService;
    let jwtTokenService: JwtTokenService;
    let logger: Logger;

    const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashedPassword123',
    };

    const mockTokens: Tokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
    };

    const mockRegisterDto: RegisterDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
    };

    const mockLoginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: Logger,
                    useValue: {
                        log: jest.fn(),
                        warn: jest.fn(),
                        error: jest.fn(),
                    },
                },
                {
                    provide: 'IPasswordService',
                    useValue: {
                        hash: jest.fn(),
                        verify: jest.fn(),
                    },
                },
                {
                    provide: 'IUsersRepository',
                    useValue: {
                        findByEmail: jest.fn(),
                        findById: jest.fn(),
                    },
                },
                {
                    provide: 'IUsersService',
                    useValue: {
                        create: jest.fn(),
                    },
                },
                {
                    provide: JwtTokenService,
                    useValue: {
                        generateTokens: jest.fn(),
                        verifyRefreshToken: jest.fn(),
                    },
                },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        passwordService = module.get<IPasswordService>('IPasswordService');
        userRepository = module.get<IUsersRepository>('IUsersRepository');
        userService = module.get<IUsersService>('IUsersService');
        jwtTokenService = module.get<JwtTokenService>(JwtTokenService);
        logger = module.get<Logger>(Logger);
    });

    describe('register', () => {
        it('should successfully register a new user and return tokens', async () => {
            jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
            jest.spyOn(passwordService, 'hash').mockResolvedValue('hashedPassword123');
            jest.spyOn(userService, 'create').mockResolvedValue(mockUser);
            jest.spyOn(jwtTokenService, 'generateTokens').mockResolvedValue(mockTokens);

            const result = await authService.register(mockRegisterDto);

            expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(passwordService.hash).toHaveBeenCalledWith('password123');
            expect(userService.create).toHaveBeenCalledWith({
                name: 'Test User',
                email: 'test@example.com',
                hashPassword: 'hashedPassword123',
            });
            expect(jwtTokenService.generateTokens).toHaveBeenCalledWith({
                sub: mockUser.id,
                email: mockUser.email,
            });
            expect(result).toEqual(mockTokens);
            expect(logger.log).toHaveBeenCalledTimes(2);
        });

        it('should throw ConflictException when user already exists', async () => {
            jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);

            await expect(authService.register(mockRegisterDto)).rejects.toThrow(ConflictException);
            expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(passwordService.hash).not.toHaveBeenCalled();
            expect(userService.create).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should throw error when password hashing fails', async () => {
            jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
            jest.spyOn(passwordService, 'hash').mockRejectedValue(new Error('Hashing failed'));

            await expect(authService.register(mockRegisterDto)).rejects.toThrow('Hashing failed');
            expect(userService.create).not.toHaveBeenCalled();
        });

        it('should throw error when user creation fails', async () => {
            jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
            jest.spyOn(passwordService, 'hash').mockResolvedValue('hashedPassword123');
            jest.spyOn(userService, 'create').mockRejectedValue(new Error('Database error'));

            await expect(authService.register(mockRegisterDto)).rejects.toThrow('Database error');
            expect(jwtTokenService.generateTokens).not.toHaveBeenCalled();
        });
    });

    describe('login', () => {
        it('should successfully login user and return tokens', async () => {
            jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
            jest.spyOn(passwordService, 'verify').mockResolvedValue(true);
            jest.spyOn(jwtTokenService, 'generateTokens').mockResolvedValue(mockTokens);

            const result = await authService.login(mockLoginDto);

            expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(passwordService.verify).toHaveBeenCalledWith(
                mockUser.passwordHash,
                'password123',
            );
            expect(jwtTokenService.generateTokens).toHaveBeenCalledWith({
                sub: mockUser.id,
                email: mockUser.email,
            });
            expect(result).toEqual(mockTokens);
            expect(logger.log).toHaveBeenCalled();
        });

        it('should throw UnauthorizedException when user not found', async () => {
            jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);

            await expect(authService.login(mockLoginDto)).rejects.toThrow(UnauthorizedException);
            expect(passwordService.verify).not.toHaveBeenCalled();
            expect(jwtTokenService.generateTokens).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should throw UnauthorizedException when password is incorrect', async () => {
            jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
            jest.spyOn(passwordService, 'verify').mockResolvedValue(false);

            await expect(authService.login(mockLoginDto)).rejects.toThrow(UnauthorizedException);
            expect(jwtTokenService.generateTokens).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should throw error when password verification fails', async () => {
            jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
            jest.spyOn(passwordService, 'verify').mockRejectedValue(
                new Error('Verification error'),
            );

            await expect(authService.login(mockLoginDto)).rejects.toThrow('Verification error');
            expect(jwtTokenService.generateTokens).not.toHaveBeenCalled();
        });
    });

    describe('validate', () => {
        const mockGetMe: IGetMe = {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
        };

        it('should successfully validate user and return user data', async () => {
            jest.spyOn(userRepository, 'findById').mockResolvedValue(mockGetMe);

            const result = await authService.validate(1);

            expect(userRepository.findById).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockGetMe);
        });

        it('should throw NotFoundException when user not found', async () => {
            jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

            await expect(authService.validate(999)).rejects.toThrow(NotFoundException);
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should handle database error during validation', async () => {
            jest.spyOn(userRepository, 'findById').mockRejectedValue(
                new Error('Database connection error'),
            );

            await expect(authService.validate(1)).rejects.toThrow('Database connection error');
        });
    });

    describe('refreshTokens', () => {
        const mockRefreshToken = 'valid-refresh-token';
        const mockPayload = {
            sub: 1,
            email: 'test@example.com',
        };

        it('should successfully refresh tokens', async () => {
            jest.spyOn(jwtTokenService, 'verifyRefreshToken').mockResolvedValue(mockPayload);
            jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
            jest.spyOn(jwtTokenService, 'generateTokens').mockResolvedValue(mockTokens);

            const result = await authService.refreshTokens(mockRefreshToken);

            expect(jwtTokenService.verifyRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
            expect(userRepository.findById).toHaveBeenCalledWith(mockPayload.sub);
            expect(jwtTokenService.generateTokens).toHaveBeenCalledWith({
                sub: mockUser.id,
                email: mockUser.email,
            });
            expect(result).toEqual(mockTokens);
            expect(logger.log).toHaveBeenCalledTimes(2);
        });

        it('should throw UnauthorizedException when refresh token is invalid', async () => {
            jest.spyOn(jwtTokenService, 'verifyRefreshToken').mockRejectedValue(
                new Error('Invalid token'),
            );

            await expect(authService.refreshTokens('invalid-token')).rejects.toThrow(
                UnauthorizedException,
            );
            await expect(authService.refreshTokens('invalid-token')).rejects.toThrow(
                AUTH_MESSAGE.INVALID_REFRESH_TOKEN,
            );
            expect(userRepository.findById).not.toHaveBeenCalled();
            expect(jwtTokenService.generateTokens).not.toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
        });

        it('should throw UnauthorizedException when refresh token is expired', async () => {
            jest.spyOn(jwtTokenService, 'verifyRefreshToken').mockRejectedValue(
                new Error('Token expired'),
            );

            await expect(authService.refreshTokens('expired-token')).rejects.toThrow(
                UnauthorizedException,
            );
            await expect(authService.refreshTokens('expired-token')).rejects.toThrow(
                AUTH_MESSAGE.INVALID_REFRESH_TOKEN,
            );
            expect(logger.error).toHaveBeenCalled();
        });

        it('should throw UnauthorizedException when token generation fails (not caught by refresh)', async () => {
            jest.spyOn(jwtTokenService, 'verifyRefreshToken').mockResolvedValue(mockPayload);
            jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
            jest.spyOn(jwtTokenService, 'generateTokens').mockRejectedValue(
                new Error('Token generation failed'),
            );

            await expect(authService.refreshTokens(mockRefreshToken)).rejects.toThrow(
                UnauthorizedException,
            );
            await expect(authService.refreshTokens(mockRefreshToken)).rejects.toThrow(
                AUTH_MESSAGE.INVALID_REFRESH_TOKEN,
            );
            expect(logger.error).toHaveBeenCalled();
        });

        it('should preserve user data consistency when refreshing tokens', async () => {
            const updatedUser = { ...mockUser, email: 'updated@example.com' };
            jest.spyOn(jwtTokenService, 'verifyRefreshToken').mockResolvedValue(mockPayload);
            jest.spyOn(userRepository, 'findById').mockResolvedValue(updatedUser);
            jest.spyOn(jwtTokenService, 'generateTokens').mockResolvedValue(mockTokens);

            const result = await authService.refreshTokens(mockRefreshToken);

            expect(jwtTokenService.generateTokens).toHaveBeenCalledWith({
                sub: updatedUser.id,
                email: updatedUser.email,
            });
            expect(result).toEqual(mockTokens);
        });
    });

    describe('Edge cases and integration scenarios', () => {
        it('should handle concurrent login attempts correctly', async () => {
            jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
            jest.spyOn(passwordService, 'verify').mockResolvedValue(true);
            jest.spyOn(jwtTokenService, 'generateTokens').mockResolvedValue(mockTokens);

            const results = await Promise.all([
                authService.login(mockLoginDto),
                authService.login(mockLoginDto),
                authService.login(mockLoginDto),
            ]);

            expect(results).toHaveLength(3);
            results.forEach((result) => {
                expect(result).toEqual(mockTokens);
            });
            expect(userRepository.findByEmail).toHaveBeenCalledTimes(3);
            expect(passwordService.verify).toHaveBeenCalledTimes(3);
        });

        it('should handle concurrent registration attempts with same email', async () => {
            jest.spyOn(userRepository, 'findByEmail')
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(mockUser);

            jest.spyOn(passwordService, 'hash').mockResolvedValue('hashedPassword123');
            jest.spyOn(userService, 'create').mockResolvedValue(mockUser);
            jest.spyOn(jwtTokenService, 'generateTokens').mockResolvedValue(mockTokens);

            const firstRegister = authService.register(mockRegisterDto);
            const secondRegister = authService.register(mockRegisterDto);

            await expect(firstRegister).resolves.toEqual(mockTokens);
            await expect(secondRegister).rejects.toThrow(ConflictException);
        });
    });
});
