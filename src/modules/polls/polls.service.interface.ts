import { DeepPartial } from 'typeorm';
import { PaginatedResponse } from './constants/types';
import { CreatePollDto } from './dto/create-poll.dto';
import { PaginationDto } from './dto/pagination-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { PollEntity } from './entities/polls.entity';

export interface IPollsService {
    create(userId: number, data: CreatePollDto): Promise<PollEntity>;
    findAll(
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
    }>;
    findOne(userId: number, pollId: number): Promise<PollEntity>;
    update(userId: number, pollId: number, data: UpdatePollDto): Promise<PollEntity>;
    remove(userId: number, pollId: number): Promise<void>;
}
