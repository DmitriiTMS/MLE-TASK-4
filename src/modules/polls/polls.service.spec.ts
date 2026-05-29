import {
    ForbiddenException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PollsService } from './polls.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { PaginationDto } from './dto/pagination-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { PollEntity } from './entities/polls.entity';
import { RedisService } from '../redis/redis.service';
import { KEYS_POLL } from './constants/types-redis';
import { PaginatedResponse } from './constants/types';

// yarn test -- src/modules/polls/polls.service.spec.ts

interface IUsersRepository {
    findById(id: number): Promise<any>;
}

interface IPollsRepository {
    save(poll: PollEntity): Promise<PollEntity>;
    findAll(userId: number, paginationDto: PaginationDto): Promise<{
        data: PollEntity[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findById(id: number): Promise<PollEntity | null>;
    remove(id: number): Promise<void>;
}

interface IRedisService {
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttl: number): Promise<void>;
    del(key: string): Promise<void>;
    delPattern(pattern: string): Promise<void>;
}

describe('PollsService', () => {
    let pollsService: PollsService;
    let userRepository: IUsersRepository;
    let pollsRepository: IPollsRepository;
    let redisService: IRedisService;
    let logger: Logger;

    const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
    };

    const mockPollEntity = {
        id: 1,
        title: 'Test Poll',
        description: 'Test Description',
        isActive: true,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createUser: mockUser,
        belongsToUser: jest.fn(),
        isPublicStatus: jest.fn(),
        update: jest.fn(),
        toResponse: jest.fn().mockReturnValue({
            id: 1,
            title: 'Test Poll',
            description: 'Test Description',
            isActive: true,
            createUser: {
                id: 1,
                name: 'Test User',
            },
        }),
    } as unknown as PollEntity;

    const mockCreatePollDto: CreatePollDto = {
        title: 'Test Poll',
        description: 'Test Description',
    };

    const mockUpdatePollDto: UpdatePollDto = {
        title: 'Updated Poll',
        description: 'Updated Description',
        isActive: true,
        isPublic: false,
    };

    const mockPaginationDto: PaginationDto = {
        page: 1,
        limit: 10,
    };

    const mockPaginatedResponse: PaginatedResponse = {
        data: [mockPollEntity.toResponse()],
        meta: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PollsService,
                {
                    provide: Logger,
                    useValue: {
                        log: jest.fn(),
                        warn: jest.fn(),
                        error: jest.fn(),
                    },
                },
                {
                    provide: 'IUsersRepository',
                    useValue: {
                        findById: jest.fn(),
                    },
                },
                {
                    provide: 'IPollsRepository',
                    useValue: {
                        save: jest.fn(),
                        findAll: jest.fn(),
                        findById: jest.fn(),
                        remove: jest.fn(),
                    },
                },
                {
                    provide: RedisService,
                    useValue: {
                        get: jest.fn(),
                        set: jest.fn(),
                        del: jest.fn(),
                        delPattern: jest.fn(),
                    },
                },
            ],
        }).compile();

        pollsService = module.get<PollsService>(PollsService);
        userRepository = module.get<IUsersRepository>('IUsersRepository');
        pollsRepository = module.get<IPollsRepository>('IPollsRepository');
        redisService = module.get<RedisService>(RedisService);
        logger = module.get<Logger>(Logger);
    });

    describe('create', () => {
        const userId = 1;

        it('should successfully create a new poll and invalidate cache', async () => {
            jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
            jest.spyOn(pollsRepository, 'save').mockResolvedValue(mockPollEntity);
            jest.spyOn(redisService, 'delPattern').mockResolvedValue(undefined);

            const result = await pollsService.create(userId, mockCreatePollDto);

            expect(userRepository.findById).toHaveBeenCalledWith(userId);
            expect(pollsRepository.save).toHaveBeenCalled();
            expect(redisService.delPattern).toHaveBeenCalledWith(KEYS_POLL.POLLS_ALL_PATTERN);
            expect(result).toEqual(mockPollEntity);
            expect(logger.log).toHaveBeenCalledTimes(3);
        });

        it('should throw NotFoundException when user does not exist', async () => {
            jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

            await expect(pollsService.create(userId, mockCreatePollDto)).rejects.toThrow(
                NotFoundException,
            );
            expect(userRepository.findById).toHaveBeenCalledWith(userId);
            expect(pollsRepository.save).not.toHaveBeenCalled();
            expect(redisService.delPattern).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should throw error when repository save fails', async () => {
            jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
            jest.spyOn(pollsRepository, 'save').mockRejectedValue(new Error('Database error'));

            await expect(pollsService.create(userId, mockCreatePollDto)).rejects.toThrow(
                'Database error',
            );
            expect(redisService.delPattern).not.toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        const userId = 1;
        const cacheKey = `polls:all:${userId}:page:${mockPaginationDto.page}:limit:${mockPaginationDto.limit}`;

        it('should return polls from database when cache is empty', async () => {
            jest.spyOn(redisService, 'get').mockResolvedValue(null);
            jest.spyOn(pollsRepository, 'findAll').mockResolvedValue({
                data: [mockPollEntity],
                meta: mockPaginatedResponse.meta,
            });
            jest.spyOn(redisService, 'set').mockResolvedValue(undefined);

            const result = await pollsService.findAll(userId, mockPaginationDto);

            expect(redisService.get).toHaveBeenCalledWith(cacheKey);
            expect(pollsRepository.findAll).toHaveBeenCalledWith(userId, mockPaginationDto);
            expect(redisService.set).toHaveBeenCalledWith(
                cacheKey,
                expect.objectContaining({
                    data: expect.any(Array),
                    meta: mockPaginatedResponse.meta,
                }),
                300,
            );
            expect(result.data).toEqual([mockPollEntity]);
            expect(result.meta).toEqual(mockPaginatedResponse.meta);
            expect(logger.log).toHaveBeenCalled();
        });

        it('should return polls from cache when available', async () => {
            jest.spyOn(redisService, 'get').mockResolvedValue(mockPaginatedResponse);
            jest.spyOn(PollEntity, 'fromJSONArray').mockReturnValue([mockPollEntity]);
            jest.spyOn(pollsRepository, 'findAll').mockResolvedValue({
                data: [mockPollEntity],
                meta: mockPaginatedResponse.meta,
            });

            const result = await pollsService.findAll(userId, mockPaginationDto);

            expect(redisService.get).toHaveBeenCalledWith(cacheKey);
            expect(pollsRepository.findAll).not.toHaveBeenCalled();
            expect(redisService.set).not.toHaveBeenCalled();
            expect(result.data).toEqual([mockPollEntity]);
            expect(result.meta).toEqual(mockPaginatedResponse.meta);
        });

        it('should handle errors from repository', async () => {
            jest.spyOn(redisService, 'get').mockResolvedValue(null);
            jest.spyOn(pollsRepository, 'findAll').mockRejectedValue(new Error('Database error'));

            await expect(pollsService.findAll(userId, mockPaginationDto)).rejects.toThrow(
                'Database error',
            );
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        const userId = 1;
        const pollId = 1;
        const cacheKey = `poll:${pollId}`;

        beforeEach(() => {
            jest.spyOn(mockPollEntity, 'belongsToUser').mockReturnValue(true);
            jest.spyOn(mockPollEntity, 'isPublicStatus').mockReturnValue(true);
        });

        it('should return poll from database when cache is empty and user is owner', async () => {
            jest.spyOn(redisService, 'get').mockResolvedValue(null);
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPollEntity);
            jest.spyOn(redisService, 'set').mockResolvedValue(undefined);

            const result = await pollsService.findOne(userId, pollId);

            expect(redisService.get).toHaveBeenCalledWith(cacheKey);
            expect(pollsRepository.findById).toHaveBeenCalledWith(pollId);
            expect(redisService.set).toHaveBeenCalledWith(
                cacheKey,
                mockPollEntity.toResponse(),
                300,
            );
            expect(result).toEqual(mockPollEntity);
        });

        it('should return poll from database when cache is empty and poll is active', async () => {
            jest.spyOn(mockPollEntity, 'belongsToUser').mockReturnValue(false);
            jest.spyOn(mockPollEntity, 'isPublicStatus').mockReturnValue(true);
            jest.spyOn(redisService, 'get').mockResolvedValue(null);
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPollEntity);
            jest.spyOn(redisService, 'set').mockResolvedValue(undefined);

            const result = await pollsService.findOne(userId, pollId);

            expect(result).toEqual(mockPollEntity);
        });

        it('should return poll from cache when available', async () => {
            jest.spyOn(redisService, 'get').mockResolvedValue(mockPollEntity.toResponse());
            jest.spyOn(PollEntity, 'fromJSON').mockReturnValue(mockPollEntity);
            jest.spyOn(mockPollEntity, 'belongsToUser').mockReturnValue(true);
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPollEntity);

            const result = await pollsService.findOne(userId, pollId);

            expect(redisService.get).toHaveBeenCalledWith(cacheKey);
            expect(pollsRepository.findById).not.toHaveBeenCalled();
            expect(redisService.set).not.toHaveBeenCalled();
            expect(result).toEqual(mockPollEntity);
        });

        it('should throw NotFoundException when poll does not exist', async () => {
            jest.spyOn(redisService, 'get').mockResolvedValue(null);
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(null);

            await expect(pollsService.findOne(userId, pollId)).rejects.toThrow(NotFoundException);
            expect(redisService.set).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should throw ForbiddenException when poll is not active and user is not owner', async () => {
            jest.spyOn(mockPollEntity, 'belongsToUser').mockReturnValue(false);
            jest.spyOn(mockPollEntity, 'isPublicStatus').mockReturnValue(false);
            jest.spyOn(redisService, 'get').mockResolvedValue(null);
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPollEntity);

            await expect(pollsService.findOne(userId, pollId)).rejects.toThrow(ForbiddenException);
            expect(logger.warn).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        const userId = 1;
        const pollId = 1;
        const cacheKey = `poll:${pollId}`;

        beforeEach(() => {
            jest.spyOn(mockPollEntity, 'belongsToUser').mockReturnValue(true);
            jest.spyOn(mockPollEntity, 'update').mockImplementation(() => { });
        });

        it('should successfully update poll and invalidate cache', async () => {
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPollEntity);
            jest.spyOn(pollsRepository, 'save').mockResolvedValue(mockPollEntity);
            jest.spyOn(redisService, 'set').mockResolvedValue(undefined);
            jest.spyOn(redisService, 'delPattern').mockResolvedValue(undefined);

            const result = await pollsService.update(userId, pollId, mockUpdatePollDto);

            expect(pollsRepository.findById).toHaveBeenCalledWith(pollId);
            expect(mockPollEntity.update).toHaveBeenCalledWith(mockUpdatePollDto);
            expect(pollsRepository.save).toHaveBeenCalledWith(mockPollEntity);
            expect(redisService.set).toHaveBeenCalledWith(
                cacheKey,
                mockPollEntity.toResponse(),
                300,
            );
            expect(redisService.delPattern).toHaveBeenCalledWith(KEYS_POLL.POLLS_ALL_PATTERN);
            expect(result).toEqual(mockPollEntity);
            expect(logger.log).toHaveBeenCalled();
        });

        it('should throw NotFoundException when poll does not exist', async () => {
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(null);

            await expect(
                pollsService.update(userId, pollId, mockUpdatePollDto),
            ).rejects.toThrow(NotFoundException);
            expect(pollsRepository.save).not.toHaveBeenCalled();
            expect(redisService.set).not.toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
        });

        it('should throw ForbiddenException when user is not the owner', async () => {
            jest.spyOn(mockPollEntity, 'belongsToUser').mockReturnValue(false);
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPollEntity);

            await expect(
                pollsService.update(userId, pollId, mockUpdatePollDto),
            ).rejects.toThrow(ForbiddenException);
            expect(pollsRepository.save).not.toHaveBeenCalled();
            expect(redisService.set).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should throw error when repository save fails', async () => {
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPollEntity);
            jest.spyOn(pollsRepository, 'save').mockRejectedValue(new Error('Database error'));

            await expect(
                pollsService.update(userId, pollId, mockUpdatePollDto),
            ).rejects.toThrow('Database error');
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        const userId = 1;
        const pollId = 1;
        const cacheKey = `poll:${pollId}`;

        beforeEach(() => {
            jest.spyOn(mockPollEntity, 'belongsToUser').mockReturnValue(true);
        });

        it('should successfully delete poll and invalidate cache', async () => {
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPollEntity);
            jest.spyOn(pollsRepository, 'remove').mockResolvedValue(undefined);
            jest.spyOn(redisService, 'del').mockResolvedValue(undefined);
            jest.spyOn(redisService, 'delPattern').mockResolvedValue(undefined);

            await pollsService.remove(userId, pollId);

            expect(pollsRepository.findById).toHaveBeenCalledWith(pollId);
            expect(pollsRepository.remove).toHaveBeenCalledWith(pollId);
            expect(redisService.del).toHaveBeenCalledWith(cacheKey);
            expect(redisService.delPattern).toHaveBeenCalledWith(KEYS_POLL.POLLS_ALL_PATTERN);
            expect(logger.log).toHaveBeenCalled();
        });

        it('should throw NotFoundException when poll does not exist', async () => {
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(null);

            await expect(pollsService.remove(userId, pollId)).rejects.toThrow(NotFoundException);
            expect(pollsRepository.remove).not.toHaveBeenCalled();
            expect(redisService.del).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should throw ForbiddenException when user is not the owner', async () => {
            jest.spyOn(mockPollEntity, 'belongsToUser').mockReturnValue(false);
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPollEntity);

            await expect(pollsService.remove(userId, pollId)).rejects.toThrow(ForbiddenException);
            expect(pollsRepository.remove).not.toHaveBeenCalled();
            expect(redisService.del).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should throw error when repository remove fails', async () => {
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPollEntity);
            jest.spyOn(pollsRepository, 'remove').mockRejectedValue(new Error('Database error'));

            await expect(pollsService.remove(userId, pollId)).rejects.toThrow('Database error');
            expect(logger.error).toHaveBeenCalled();
        });
    });
});