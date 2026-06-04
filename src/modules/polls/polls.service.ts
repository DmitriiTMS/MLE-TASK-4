import {
    BadRequestException,
    ForbiddenException,
    Inject,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { USERS_INJECTION_TOKENS } from '../users/constants/users-injection-tokens';
import { POLL_INJECTION_TOKENS } from './constants/poll-injection-tokens';
import { PaginatedResponse, PollResponse } from './constants/types';
import { KEYS_POLL } from './constants/types-redis';
import { POLLS_MESSAGE } from './constants/types.message';
import { PollEntity } from './domain/polls.entity';
import { CreatePollDto } from './dto/create-poll.dto';
import { PaginationDto } from './dto/pagination-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { IPollsService } from './polls.service.interface';
import type { IPollsRepository } from './polls.repository.interface';
import type { IUsersRepository } from '../users/users.repository.interface';

@Injectable()
export class PollsService implements IPollsService {
    private readonly context = PollsService.name;

    constructor(
        private readonly logger: Logger,
        @Inject(USERS_INJECTION_TOKENS.IUSERS_REPOSITORY)
        private readonly userRepository: IUsersRepository,
        @Inject(POLL_INJECTION_TOKENS.IPOLL_REPOSITORY)
        private readonly pollsRepository: IPollsRepository,
        private readonly redisService: RedisService,
    ) {}

    async create(userId: number, data: CreatePollDto): Promise<PollEntity> {
        const startTime = Date.now();
        const operation = 'create';
        this.logger.log(
            `[${this.context}] - Starting ${operation} operation - User ID: ${userId}, ` +
                `Data: ${JSON.stringify(data)}`,
        );
        try {
            this.logger.log(`[${this.context}] - Finding user with ID: ${userId}`);
            const user = await this.userRepository.findById(userId);
            if (!user) {
                this.logger.warn(`[${this.context}] - User not found - User ID: ${userId}`);
                throw new NotFoundException(POLLS_MESSAGE.USER_NOT_FOUND);
            }
            const poll = PollEntity.createInstance(data.title, data.description, user);
            const savedPoll = await this.pollsRepository.save(poll);
            const duration = Date.now() - startTime;
            this.logger.log(
                `[${this.context}] - ${operation} operation completed successfully - ` +
                    `User ID: ${userId}, Poll ID: ${savedPoll?.id}, Duration: ${duration}ms`,
            );

            await this.redisService.delPattern(KEYS_POLL.POLLS_ALL_PATTERN);

            return savedPoll;
        } catch (error) {
            this.logger.error(
                `[${this.context}] - ${operation} operation failed - User ID: ${userId}`,
            );
            throw error;
        }
    }

    async findAll(
        userId: number,
        paginationDto: PaginationDto,
    ): Promise<{
        data: PollEntity[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }> {
        const startTime = Date.now();
        const operation = 'findAll';
        this.logger.log(`[${this.context}] - Fetching all polls`);
        const cacheKey = `${KEYS_POLL.POLLS_ALL_PREFIX}${userId}:page:${paginationDto.page}:limit:${paginationDto.limit}`;

        const cachedData = await this.redisService.get<PaginatedResponse>(cacheKey);

        try {
            if (!cachedData) {
                const dbData = await this.pollsRepository.findAll(userId, paginationDto);

                const dataToCache: PaginatedResponse = {
                    data: dbData.data.map((poll) => poll.toResponse()),
                    meta: dbData.meta,
                };
                await this.redisService.set(cacheKey, dataToCache, 300);

                this.logger.log(
                    `[${this.context}] - Polls fetched successfully ` +
                        `Count: ${dbData.data.length}, Duration: ${Date.now() - startTime}ms`,
                );

                return dbData;
            } else {
                const polls: PollEntity[] = PollEntity.fromJSONArray(cachedData.data);

                const result = {
                    data: polls,
                    meta: cachedData.meta,
                };

                this.logger.log(
                    `[${this.context}] - Polls fetched successfully ` +
                        `Count: ${polls.length}, Duration: ${Date.now() - startTime}ms`,
                );

                return result;
            }
        } catch (error) {
            this.logger.error(`[${this.context}] - ${operation} operation failed`);
            throw error;
        }
    }

    async findOne(userId: number, pollId: number): Promise<PollEntity> {
        const startTime = Date.now();
        const operation = 'findOne';
        const cacheKey = `${KEYS_POLL.POLL_ID_PREFIX}${pollId}`;

        this.logger.log(`[${this.context}] - Fetching poll, Poll ID: ${pollId}`);

        try {
            const cachedPoll = await this.redisService.get<PollResponse>(cacheKey);

            if (!cachedPoll) {
                const pollEntity = await this.pollsRepository.findById(pollId);

                if (!pollEntity) {
                    this.logger.warn(`[${this.context}] - Poll with ID: ${pollId} not found`);
                    throw new NotFoundException(POLLS_MESSAGE.POLL_NOT_FOUND);
                }

                if (!pollEntity.belongsToUser(userId) && !pollEntity.isPublicStatus()) {
                    this.logger.warn(
                        `[${this.context}] - ${POLLS_MESSAGE.SURVEY_NOT_AVAILABLE} with ID: ${pollId}`,
                    );
                    throw new ForbiddenException(POLLS_MESSAGE.SURVEY_NOT_AVAILABLE);
                }

                await this.redisService.set(cacheKey, pollEntity.toResponse(), 300);

                this.logger.log(
                    `[${this.context}] - Poll fetched successfully, ` +
                        `Poll ID: ${pollId}, Duration: ${Date.now() - startTime}ms`,
                );

                return pollEntity;
            } else {
                const pollEntity = PollEntity.fromJSON(cachedPoll);

                if (!pollEntity.belongsToUser(userId) && !pollEntity.isPublicStatus()) {
                    this.logger.warn(
                        `[${this.context}] - ${POLLS_MESSAGE.SURVEY_NOT_AVAILABLE} with ID: ${pollId}`,
                    );
                    throw new ForbiddenException(POLLS_MESSAGE.SURVEY_NOT_AVAILABLE);
                }

                this.logger.log(
                    `[${this.context}] - Poll fetched successfully, ` +
                        `Poll ID: ${pollId}, Duration: ${Date.now() - startTime}ms`,
                );

                return pollEntity;
            }
        } catch (error) {
            this.logger.error(`[${this.context}] - ${operation} operation failed`);
            throw error;
        }
    }

    async update(userId: number, pollId: number, data: UpdatePollDto): Promise<PollEntity> {
        const startTime = Date.now();
        const operation = 'update';
        const cacheKey = `${KEYS_POLL.POLL_ID_PREFIX}${pollId}`;

        this.logger.log(
            `[${this.context}] - Updating poll - User ID: ${userId}, Poll ID: ${pollId}`,
        );

        try {
            const poll = await this.pollsRepository.findById(pollId);

            if (!poll) {
                throw new NotFoundException(POLLS_MESSAGE.POLL_NOT_FOUND);
            }

            if (!poll.belongsToUser(userId)) {
                this.logger.warn(
                    `[${this.context}] - ${POLLS_MESSAGE.NO_UPDATE_PERMISSION} - Poll ID: ${pollId}`,
                );
                throw new ForbiddenException(POLLS_MESSAGE.NO_UPDATE_PERMISSION);
            }

            poll.update(data);
            const updatedPoll = await this.pollsRepository.save(poll);

            await Promise.all([
                this.redisService.set(cacheKey, updatedPoll.toResponse(), 300),
                this.redisService.delPattern(KEYS_POLL.POLLS_ALL_PATTERN),
            ]);

            this.logger.log(
                `[${this.context}] - Poll updated successfully - User ID: ${userId}, ` +
                    `Poll ID: ${pollId}, Duration: ${Date.now() - startTime}ms`,
            );

            return updatedPoll;
        } catch (error) {
            this.logger.error(`[${this.context}] - ${operation} operation failed`);
            throw error;
        }
    }

    async remove(userId: number, pollId: number) {
        const startTime = Date.now();
        const operation = 'remove';
        const cacheKey = `${KEYS_POLL.POLL_ID_PREFIX}${pollId}`;

        this.logger.log(
            `[${this.context}] - Deleting poll - User ID: ${userId}, Poll ID: ${pollId}`,
        );

        try {
            const poll = await this.pollsRepository.findById(pollId);

            if (!poll) {
                this.logger.warn(
                    `[${this.context}] - ${POLLS_MESSAGE.POLL_NOT_FOUND} - Poll ID: ${pollId}`,
                );
                throw new NotFoundException(POLLS_MESSAGE.POLL_NOT_FOUND);
            }

            if (!poll.belongsToUser(userId)) {
                this.logger.warn(
                    `[${this.context}] - ${POLLS_MESSAGE.NO_DELETE_PERMISSION} - Poll ID: ${pollId}`,
                );
                throw new ForbiddenException(POLLS_MESSAGE.NO_DELETE_PERMISSION);
            }

            await this.pollsRepository.remove(pollId);

            await Promise.all([
                this.redisService.del(cacheKey),
                this.redisService.delPattern(KEYS_POLL.POLLS_ALL_PATTERN),
            ]);

            this.logger.log(
                `[${this.context}] - Poll deleted successfully - User ID: ${userId}, ` +
                    `Poll ID: ${pollId}, Duration: ${Date.now() - startTime}ms`,
            );
        } catch (error) {
            this.logger.error(`[${this.context}] - ${operation} operation failed`);
            throw error;
        }
    }

    async toggleActive(userId: number, pollId: number, isActive: boolean): Promise<boolean> {
        const startTime = Date.now();
        const operation = 'toggleActive';
        const cacheKey = `${KEYS_POLL.POLL_ID_PREFIX}${pollId}`;

        this.logger.log(
            `[${this.context}] - ToggleActive poll - User ID: ${userId}, Poll ID: ${pollId}`,
        );

        try {
            const poll = await this.pollsRepository.findById(pollId);

            if (!poll) {
                this.logger.warn(
                    `[${this.context}] - ${POLLS_MESSAGE.POLL_NOT_FOUND} - Poll ID: ${pollId}`,
                );
                throw new NotFoundException(POLLS_MESSAGE.POLL_NOT_FOUND);
            }

            if (!poll.belongsToUser(userId)) {
                this.logger.warn(
                    `[${this.context}] - ${POLLS_MESSAGE.POLL_UPDATE_ACTIVE} - Poll ID: ${pollId}`,
                );
                throw new ForbiddenException(POLLS_MESSAGE.POLL_UPDATE_ACTIVE);
            }

            poll.setActive(isActive);

            const updatedIsActive = await this.pollsRepository.updateIsActive(poll);
            if (updatedIsActive === null) {
                throw new BadRequestException('Failed to update poll active status');
            }

            await Promise.all([
                this.redisService.del(cacheKey),
                this.redisService.delPattern(KEYS_POLL.POLLS_ALL_PATTERN),
            ]);

            this.logger.log(
                `[${this.context}] - Poll ToggleActive successfully - User ID: ${userId}, ` +
                    `Poll ID: ${pollId}, Duration: ${Date.now() - startTime}ms`,
            );

            return updatedIsActive;
        } catch (error) {
            this.logger.error(`[${this.context}] - ${operation} operation failed`);
            throw error;
        }
    }

    async togglePublic(userId: number, pollId: number, isPublic: boolean): Promise<boolean> {
        const startTime = Date.now();
        const operation = 'togglePublic';
        const cacheKey = `${KEYS_POLL.POLL_ID_PREFIX}${pollId}`;

        this.logger.log(
            `[${this.context}] - TogglePublic poll - User ID: ${userId}, Poll ID: ${pollId}`,
        );

        try {
            const poll = await this.pollsRepository.findById(pollId);

            if (!poll) {
                this.logger.warn(
                    `[${this.context}] - ${POLLS_MESSAGE.POLL_NOT_FOUND} - Poll ID: ${pollId}`,
                );
                throw new NotFoundException(POLLS_MESSAGE.POLL_NOT_FOUND);
            }

            if (!poll.belongsToUser(userId)) {
                this.logger.warn(
                    `[${this.context}] - ${POLLS_MESSAGE.POLL_UPDATE_PUBLIC} - Poll ID: ${pollId}`,
                );
                throw new ForbiddenException(POLLS_MESSAGE.POLL_UPDATE_PUBLIC);
            }

            poll.setPublic(isPublic);

            const updatedIsPublic = await this.pollsRepository.updateIsPublic(poll);
            if (updatedIsPublic === null) {
                throw new BadRequestException('Failed to update poll active status');
            }

            await Promise.all([
                this.redisService.del(cacheKey),
                this.redisService.delPattern(KEYS_POLL.POLLS_ALL_PATTERN),
            ]);

            this.logger.log(
                `[${this.context}] - Poll TogglePublic successfully - User ID: ${userId}, ` +
                    `Poll ID: ${pollId}, Duration: ${Date.now() - startTime}ms`,
            );

            return updatedIsPublic;
        } catch (error) {
            this.logger.error(`[${this.context}] - ${operation} operation failed`);
            throw error;
        }
    }
}
