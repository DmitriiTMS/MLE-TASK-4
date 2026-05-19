import { PaginationDto } from './dto/pagination-poll.dto';
import { PollEntity } from './entities/polls.entity';

export interface IPollsRepository {
    save(poll: PollEntity): Promise<PollEntity>;
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
    findById(id: number): Promise<PollEntity | null>;
    remove(id: number): Promise<void>;
}
