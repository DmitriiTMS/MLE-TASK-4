import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './entities/user.entity';
import { IUsersRepository } from './users.repository.interface';
import { UsersService } from './users.service';

describe('UsersService', () => {
    let service: UsersService;
    let userRepository: jest.Mocked<IUsersRepository>;
    let logger: jest.Mocked<Logger>;

    const mockUser: UserEntity = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashedPassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        hashPassword: 'password123',
    };

    beforeEach(async () => {
        const mockUserRepository = {
            createUser: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
        };

        const mockLogger = {
            log: jest.fn(),
            error: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: Logger,
                    useValue: mockLogger,
                },
                {
                    provide: 'IUsersRepository',
                    useValue: mockUserRepository,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        userRepository = module.get('IUsersRepository');
        logger = module.get(Logger);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should successfully create a user', async () => {
            userRepository.createUser.mockResolvedValue(mockUser);

            const result = await service.create(createUserDto);

            expect(result).toEqual(mockUser);
            expect(userRepository.createUser).toHaveBeenCalledTimes(1);
            expect(userRepository.createUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: createUserDto.name,
                    email: createUserDto.email,
                    passwordHash: createUserDto.hashPassword,
                }),
            );
            expect(logger.log).toHaveBeenCalledWith(
                `[UsersService] - [create] - ${createUserDto.name} - ${createUserDto.email}`,
            );
        });

        it('should handle repository error and throw custom error', async () => {
            const dbError = new Error('Database connection failed');
            userRepository.createUser.mockRejectedValue(dbError);

            await expect(service.create(createUserDto)).rejects.toThrow(
                'Пользователь не сохранился в БД',
            );
            expect(logger.log).toHaveBeenCalledWith(
                `[UsersService] - [create] - ${dbError.message}`,
            );
            expect(userRepository.createUser).toHaveBeenCalledTimes(1);
        });

        it('should handle duplicate email error', async () => {
            const duplicateError = new Error('Duplicate entry for email');
            userRepository.createUser.mockRejectedValue(duplicateError);

            await expect(service.create(createUserDto)).rejects.toThrow(
                'Пользователь не сохранился в БД',
            );
            expect(logger.log).toHaveBeenCalledWith(
                `[UsersService] - [create] - ${duplicateError.message}`,
            );
            expect(userRepository.createUser).toHaveBeenCalledTimes(1);
        });

        it('should handle empty DTO fields', async () => {
            const invalidDto: CreateUserDto = {
                name: '',
                email: '',
                hashPassword: '',
            };

            const emptyUser = {
                id: 2,
                name: '',
                email: '',
                passwordHash: '',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            userRepository.createUser.mockResolvedValue(emptyUser);

            const result = await service.create(invalidDto);

            expect(result).toEqual(emptyUser);
            expect(userRepository.createUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: '',
                    email: '',
                    passwordHash: '',
                }),
            );
        });

        it('should preserve the original user data when creating', async () => {
            let capturedUser: UserEntity | undefined;
            userRepository.createUser.mockImplementation((user) => {
                capturedUser = user;
                return Promise.resolve({
                    ...user,
                    id: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            });

            await service.create(createUserDto);

            expect(capturedUser).toBeDefined();
            expect(capturedUser?.name).toBe(createUserDto.name);
            expect(capturedUser?.email).toBe(createUserDto.email);
            expect(capturedUser?.passwordHash).toBe(createUserDto.hashPassword);
            expect(capturedUser?.id).toBeUndefined();
            expect(capturedUser?.createdAt).toBeUndefined();
            expect(capturedUser?.updatedAt).toBeUndefined();
        });

        it('should log error with correct context', async () => {
            const error = new Error('Test error');
            userRepository.createUser.mockRejectedValue(error);

            await expect(service.create(createUserDto)).rejects.toThrow();
            expect(logger.log).toHaveBeenCalledWith(`[UsersService] - [create] - ${error.message}`);
        });

        it('should handle non-Error exceptions', async () => {
            const stringError = 'String error';
            userRepository.createUser.mockRejectedValue(stringError);

            await expect(service.create(createUserDto)).rejects.toThrow(
                'Пользователь не сохранился в БД',
            );
            expect(logger.log).toHaveBeenCalledWith(`[UsersService] - [create] - undefined`);
        });
    });
});
