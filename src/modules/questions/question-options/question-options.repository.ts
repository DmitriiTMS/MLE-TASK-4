import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionOptionEntity } from './entities/question-options.entity';
import { IQuestionOptionsRepository } from './question-options.repository.interface';

@Injectable()
export class QuestionOptionsRepository implements IQuestionOptionsRepository {
    private readonly context = QuestionOptionsRepository.name;

    constructor(
        private readonly logger: Logger,
        @InjectRepository(QuestionOptionEntity)
        private readonly questionOptionEntity: Repository<QuestionOptionEntity>,
    ) {}

    async createOption(questionOption: {
        questionId: number;
        text: string;
        orderNum: number;
    }): Promise<QuestionOptionEntity> {
        try {
            const savedOption = await this.questionOptionEntity.save(questionOption);
            return savedOption;
        } catch (error: unknown) {
            this.logger.error(`${this.context} - failed createOption: ${error}`);
            throw error;
        }
    }

    async findMany(questionId: number): Promise<QuestionOptionEntity[]> {
        return await this.questionOptionEntity.find({ where: { questionId } });
    }
}
