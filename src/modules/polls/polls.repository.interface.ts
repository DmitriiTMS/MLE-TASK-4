import { PollEntity } from './domain/polls.entity';
import { PaginationDto } from './dto/pagination-poll.dto';

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
    updateIsActive(poll: PollEntity): Promise<boolean | null>;
    updateIsPublic(poll: PollEntity): Promise<boolean | null>;
}
