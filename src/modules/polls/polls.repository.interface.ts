import { PollEntity } from "./entities/polls.entity";

export interface IPollsRepository {
    save(poll: PollEntity): Promise<PollEntity>;
}
