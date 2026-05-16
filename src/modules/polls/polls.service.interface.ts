import { CreatePollDto } from "./dto/create-poll.dto";

export interface IPollsService {
    create(userId: number, data: CreatePollDto): Promise<any>
}
