import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PollEntity } from './entities/polls.entity';
import { IPollsRepository } from './polls.repository.interface';


@Injectable()
export class PollsRepository implements IPollsRepository {
    constructor(
        @InjectRepository(PollEntity)
        private readonly pollRepository: Repository<PollEntity>,
    ) { }

    async save(poll: PollEntity): Promise<PollEntity> {
        return await this.pollRepository.save(poll)
    }


}