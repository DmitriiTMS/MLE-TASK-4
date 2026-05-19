import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Logger,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/utils/jwt/jwt-auth.guard';
import { PaginatedResponse, PollResponse } from './constants/types';
import { CreatePollDto } from './dto/create-poll.dto';
import { PaginationDto } from './dto/pagination-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { PollEntity } from './entities/polls.entity';
import type { IPollsService } from './polls.service.interface';

@ApiTags('Опросы')
@Controller('polls')
@UseGuards(JwtAuthGuard)
export class PollsController {
    private readonly context = PollsController.name;

    constructor(
        private readonly logger: Logger,
        @Inject('IPollsService') private readonly pollsService: IPollsService,
    ) {}

    @Post()
    @UseGuards(ThrottlerGuard)
    @HttpCode(HttpStatus.CREATED)
    async create(
        @CurrentUser() user: { id: number },
        @Body() createDto: CreatePollDto,
    ): Promise<PollResponse> {
        const startTime = Date.now();
        const method = 'POST';
        const route = '/polls';

        this.logger.log(
            `[${this.context}] - Creating poll - User ID: ${user.id}, ` +
                `Data: ${JSON.stringify(createDto)}`,
        );
        try {
            const result = await this.pollsService.create(user.id, createDto);
            this.logger.log(
                `[${this.context}] - Poll created successfully - User ID: ${user.id}, ` +
                    `Poll ID: ${result.id}, Duration: ${Date.now() - startTime}ms`,
            );

            return result.toResponse();
        } catch (error: unknown) {
            this.logError(error, method, route, { userId: user.id, createDto });
            throw error;
        }
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    async findAll(
        @CurrentUser() user: { id: number },
        @Query() paginationDto: PaginationDto,
    ): Promise<PaginatedResponse> {
        const startTime = Date.now();
        const method = 'GET';
        const route = '/polls';

        this.logger.log(`[${this.context}] - Fetching all polls`);

        try {
            const result = await this.pollsService.findAll(user.id, paginationDto);

            this.logger.log(
                `[${this.context}] - Polls fetched successfully` +
                    `Count: ${result.data.length}, Duration: ${Date.now() - startTime}ms`,
            );

            return {
                data: PollEntity.toResponseList(result.data),
                meta: result.meta,
            };
        } catch (error) {
            this.logError(error, method, route);
            throw error;
        }
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findOne(
        @CurrentUser() user: { id: number },
        @Param('id', ParseIntPipe) id: number,
    ): Promise<PollResponse> {
        const startTime = Date.now();
        const method = 'GET';
        const route = `/polls/${id}`;

        this.logger.log(`[${this.context}] - Fetching poll, Poll ID: ${id}`);

        try {
            const result = await this.pollsService.findOne(user.id, id);

            this.logger.log(
                `[${this.context}] - Poll fetched successfully, ` +
                    `Poll ID: ${id}, Duration: ${Date.now() - startTime}ms`,
            );

            return result.toResponse();
        } catch (error) {
            this.logError(error, method, route, { pollId: id });
            throw error;
        }
    }

    @Put(':id')
    @UseGuards(ThrottlerGuard)
    @HttpCode(HttpStatus.OK)
    async update(
        @CurrentUser() user: { id: number },
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdatePollDto,
    ): Promise<PollResponse> {
        const startTime = Date.now();
        const method = 'PUT';
        const route = `/polls/${id}`;

        this.logger.log(
            `[${this.context}] - Updating poll - User ID: ${user.id}, Poll ID: ${id}, ` +
                `Data: ${JSON.stringify(updateDto)}`,
        );

        try {
            const result = await this.pollsService.update(user.id, id, updateDto);

            this.logger.log(
                `[${this.context}] - Poll updated successfully - User ID: ${user.id}, ` +
                    `Poll ID: ${id}, Duration: ${Date.now() - startTime}ms`,
            );

            return result.toResponse();
        } catch (error) {
            this.logError(error, method, route, { userId: user.id, pollId: id, updateDto });
            throw error;
        }
    }

    @Delete(':id')
    @UseGuards(ThrottlerGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
        const startTime = Date.now();
        const method = 'DELETE';
        const route = `/polls/${id}`;

        this.logger.log(`[${this.context}] - Deleting poll - User ID: ${user.id}, Poll ID: ${id}`);

        try {
            await this.pollsService.remove(user.id, id);

            this.logger.log(
                `[${this.context}] - Poll deleted successfully - User ID: ${user.id}, ` +
                    `Poll ID: ${id}, Duration: ${Date.now() - startTime}ms`,
            );
        } catch (error) {
            this.logError(error, method, route, { userId: user.id, pollId: id });
            throw error;
        }
    }

    private logError(error: unknown, method: string, route: string, context?: any): void {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;

        this.logger.error(
            `[${this.context}] - Request failed - Method: ${method}, Route: ${route}, ` +
                `Context: ${JSON.stringify(context)}, Error: ${errorMessage}`,
        );

        if (errorStack && process.env.NODE_ENV !== 'production') {
            this.logger.warn(`[${this.context}] - Stack trace: ${errorStack}`);
        }
    }
}
