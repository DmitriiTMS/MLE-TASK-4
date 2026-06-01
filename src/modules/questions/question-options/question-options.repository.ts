import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionOptionModel } from './models/question-options.model';
import { IQuestionOptionsRepository } from './question-options.repository.interface';
import { QuestionOptionEntity } from './domain/question-options.entity';

@Injectable()
export class QuestionOptionsRepository implements IQuestionOptionsRepository {
    private readonly context = QuestionOptionsRepository.name;

    constructor(
        private readonly logger: Logger,
        @InjectRepository(QuestionOptionModel)
        private readonly questionOptionEntity: Repository<QuestionOptionModel>,
    ) { }

    async createOption(questionOption: {
        questionId: number;
        text: string;
        orderNum: number;
    }): Promise<QuestionOptionEntity> {
        try {
            const savedOption = await this.questionOptionEntity.save(questionOption);
            return QuestionOptionEntity.toEntity(savedOption);
        } catch (error: unknown) {
            this.logger.error(`${this.context} - failed createOption: ${error}`);
            throw error;
        }
    }

}
