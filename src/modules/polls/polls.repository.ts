import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PollEntity } from './domain/polls.entity';
import { PaginationDto } from './dto/pagination-poll.dto';
import { PollModel } from './models/polls.model';
import { IPollsRepository } from './polls.repository.interface';

@Injectable()
export class PollsRepository implements IPollsRepository {
    constructor(
        @InjectRepository(PollModel)
        private readonly pollRepository: Repository<PollModel>,
    ) {}

    async save(poll: PollEntity): Promise<PollEntity> {
        const savedPoll = await this.pollRepository.save(poll);

        const fullPoll = await this.pollRepository.findOne({
            where: { id: savedPoll.id },
            relations: ['createUser'],
            select: {
                id: true,
                title: true,
                description: true,
                isActive: true,
                isPublic: true,
                createdAt: true,
                updatedAt: true,
                createUser: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        });

        if (!fullPoll) {
            throw new Error('Poll not found after save');
        }

        return PollEntity.toEntity(fullPoll);
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
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;

        const queryBuilder = this.pollRepository
            .createQueryBuilder('poll')
            .leftJoinAndSelect('poll.createUser', 'createUser')
            .select([
                'poll.id',
                'poll.title',
                'poll.description',
                'poll.isActive',
                'poll.isPublic',
                'poll.createdAt',
                'poll.updatedAt',
                'createUser.id',
                'createUser.name',
                'createUser.email',
            ])
            .where('poll.isPublic = :isPublic OR poll.createUser.id = :userId', {
                isPublic: true,
                userId,
            })
            .skip(skip)
            .take(limit)
            .orderBy('poll.createdAt', 'DESC');

        const [polls, total] = await queryBuilder.getManyAndCount();

        return {
            data: polls.map((poll) => PollEntity.toEntity(poll)),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findById(id: number): Promise<PollEntity | null> {
        const poll = await this.pollRepository.findOne({
            where: { id },
            relations: ['createUser'],
            select: {
                id: true,
                title: true,
                description: true,
                isActive: true,
                isPublic: true,
                createdAt: true,
                updatedAt: true,
                createUser: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        });

        if (!poll) {
            return null;
        }

        return PollEntity.toEntity(poll);
    }

    async remove(id: number) {
        await this.pollRepository.delete({ id });
    }

    async updateIsActive(poll: PollEntity): Promise<boolean | null> {
        await this.pollRepository.update({ id: poll.id }, { isActive: poll.isActive });
        const updatedPoll = await this.pollRepository.findOneBy({ id: poll.id });
        if (!updatedPoll) {
            return null;
        }
        return PollEntity.toEntity(updatedPoll).isActive;
    }

    async updateIsPublic(poll: PollEntity): Promise<boolean | null> {
        await this.pollRepository.update({ id: poll.id }, { isActive: poll.isPublic });
        const updatedPoll = await this.pollRepository.findOneBy({ id: poll.id });
        if (!updatedPoll) {
            return null;
        }
        return PollEntity.toEntity(updatedPoll).isPublic;
    }
}
