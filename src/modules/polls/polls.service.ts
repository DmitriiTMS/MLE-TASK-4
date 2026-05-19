import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { POLLS_MESSAGE } from './constants/types.message';
import { CreatePollDto } from './dto/create-poll.dto';
import { PaginationDto } from './dto/pagination-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { PollEntity } from './entities/polls.entity';
import { IPollsService } from './polls.service.interface';
import type { IPollsRepository } from './polls.repository.interface';
import type { IUsersRepository } from '../users/users.repository.interface';

@Injectable()
export class PollsService implements IPollsService {
    private readonly context = PollsService.name;

    constructor(
        private readonly logger: Logger,
        @Inject('IUsersRepository') private readonly userRepository: IUsersRepository,
        @Inject('IPollsRepository') private readonly pollsRepository: IPollsRepository,
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

        try {
            const polls = await this.pollsRepository.findAll(userId, paginationDto);

            this.logger.log(
                `[${this.context}] - Polls fetched successfully` +
                    `Count: ${polls.data.length}, Duration: ${Date.now() - startTime}ms`,
            );

            return polls;
        } catch (error) {
            this.logger.error(`[${this.context}] - ${operation} operation failed`);
            throw error;
        }
    }

    async findOne(userId: number, pollId: number): Promise<PollEntity> {
        const startTime = Date.now();
        const operation = 'findOne';

        this.logger.log(`[${this.context}] - Fetching poll, Poll ID: ${pollId}`);

        try {
            const poll = await this.pollsRepository.findById(pollId);

            if (!poll) {
                this.logger.warn(`[${this.context}] - Finding poll with ID: ${pollId}`);
                throw new NotFoundException(POLLS_MESSAGE.POLL_NOT_FOUND);
            }

            if (!poll.belongsToUser(userId) && !poll.isActiveStatus()) {
                this.logger.warn(
                    `[${this.context}] - ${POLLS_MESSAGE.SURVEY_NOT_AVAILABLE} with ID: ${pollId}`,
                );
                throw new ForbiddenException(POLLS_MESSAGE.SURVEY_NOT_AVAILABLE);
            }

            this.logger.log(
                `[${this.context}] - Poll fetched successfully, ` +
                    `Poll ID: ${pollId}, Duration: ${Date.now() - startTime}ms`,
            );

            return poll;
        } catch (error) {
            this.logger.error(`[${this.context}] - ${operation} operation failed`);
            throw error;
        }
    }

    async update(userId: number, pollId: number, data: UpdatePollDto): Promise<PollEntity> {
        const startTime = Date.now();
        const operation = 'update';

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
                    `[${this.context}] - ${POLLS_MESSAGE.NO_PERMISSION} - Poll ID: ${pollId}`,
                );
                throw new ForbiddenException(POLLS_MESSAGE.NO_PERMISSION);
            }

            poll.update(data);

            const updatedPoll = await this.pollsRepository.save(poll);

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
                    `[${this.context}] - ${POLLS_MESSAGE.NO_PERMISSION} - Poll ID: ${pollId}`,
                );
                throw new ForbiddenException(POLLS_MESSAGE.NO_PERMISSION);
            }

            await this.pollsRepository.remove(pollId);

            this.logger.log(
                `[${this.context}] - Poll deleted successfully - User ID: ${userId}, ` +
                    `Poll ID: ${pollId}, Duration: ${Date.now() - startTime}ms`,
            );
        } catch (error) {
            this.logger.error(`[${this.context}] - ${operation} operation failed`);
            throw error;
        }
    }
}
