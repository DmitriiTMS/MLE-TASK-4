import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionOptionEntity } from './domain/question-options.entity';
import { QuestionOptionModel } from './models/question-options.model';
import { IQuestionOptionsRepository } from './question-options.repository.interface';

@Injectable()
export class QuestionOptionsRepository implements IQuestionOptionsRepository {
    private readonly context = QuestionOptionsRepository.name;

    constructor(
        private readonly logger: Logger,
        @InjectRepository(QuestionOptionModel)
        private readonly questionOptionRepository: Repository<QuestionOptionModel>,
    ) {}

    async createOption(questionOption: {
        questionId: number;
        text: string;
        orderNum: number;
    }): Promise<QuestionOptionEntity> {
        try {
            const savedOption = await this.questionOptionRepository.save(questionOption);
            return QuestionOptionEntity.toEntity(savedOption);
        } catch (error: unknown) {
            this.logger.error(`${this.context} - failed createOption: ${error}`);
            throw error;
        }
    }

    async findOptionById(optionId: number): Promise<QuestionOptionEntity | null> {
        const option = await this.questionOptionRepository.findOne({
            where: { id: optionId },
        });
        if (!option) {
            return null;
        }
        return QuestionOptionEntity.toEntity(option);
    }

    async deleteOption(optionId: number): Promise<void> {
        await this.questionOptionRepository.delete(optionId);
    }
}
