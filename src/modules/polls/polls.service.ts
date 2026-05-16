import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { IUsersRepository } from "../users/users.repository.interface";
import { POLLS_MESSAGE } from "./constants/types.message";
import { PollEntity } from "./entities/polls.entity";
import { IPollsService } from "./polls.service.interface";
import { CreatePollDto } from "./dto/create-poll.dto";
import type { IPollsRepository } from "./polls.repository.interface";

@Injectable()
export class PollsService implements IPollsService {
    private readonly context = PollsService.name;
    // private readonly operationCreate = 'create';

    constructor(
        private readonly logger: Logger,
        @Inject('IUsersRepository') private readonly userRepository: IUsersRepository,
        @Inject('IPollsRepository') private readonly pollsRepository: IPollsRepository,
    ) { }

    async create(userId: number, data: CreatePollDto) {
        try {

            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new NotFoundException(POLLS_MESSAGE.USER_NOT_FOUND);
            }

            // 3. Создаем опрос
            const poll = PollEntity.createInstance(
                data.title,
                data.description,
                data.isActive,
                user
            );

            // 4. Сохраняем
            const savedPoll = await this.pollsRepository.save(poll);

            return savedPoll
        } catch (error) {
            return error;
        }
    }
}