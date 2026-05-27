import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { QuestionOptionEntity } from './entities/question-options.entity';
import { QuestionEntity } from './entities/questions.entity';
import { IQuestionsRepository } from './questions.repository.interface';

@Injectable()
export class QuestionsRepository implements IQuestionsRepository {
    private readonly context = QuestionsRepository.name;

    constructor(
        private readonly logger: Logger,
        @InjectRepository(QuestionEntity)
        private readonly questionRepository: Repository<QuestionEntity>,
        @InjectRepository(QuestionOptionEntity)
        private readonly questionOptionRepository: Repository<QuestionOptionEntity>,
        private readonly dataSource: DataSource,
    ) {}

    async createQuestion(
        question: QuestionEntity,
        questionOptions: QuestionOptionEntity[],
    ): Promise<QuestionEntity> {
        try {
            return await this.dataSource.transaction(async (transactionalEntityManager) => {
                const savedQuestion = await transactionalEntityManager.save(question);

                const savedOptions = await transactionalEntityManager.save(
                    questionOptions.map((option) => {
                        option.questionId = savedQuestion.id;
                        return option;
                    }),
                );

                savedQuestion.questionOptions = savedOptions;
                return savedQuestion;
            });
        } catch (error: unknown) {
            this.logger.error(`${this.context} - transaction failed: ${error}`);
            throw error;
        }
    }
}
