import { PollEntity } from './domain/polls.entity';
import { CreatePollDto } from './dto/create-poll.dto';
import { PaginationDto } from './dto/pagination-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';


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
