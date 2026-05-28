import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { QuestionOptionEntity } from './entities/question-options.entity';
import { QuestionEntity } from './entities/questions.entity';
import { IQuestionsRepository } from './questions.repository.interface';
import { PollEntity } from '../polls/entities/polls.entity';

@Injectable()
export class QuestionsRepository implements IQuestionsRepository {
    private readonly context = QuestionsRepository.name;

    constructor(
        private readonly logger: Logger,
        @InjectRepository(QuestionEntity)
        private readonly questionRepository: Repository<QuestionEntity>,
        private readonly dataSource: DataSource,
        @InjectRepository(PollEntity)
        private readonly pollRepository: Repository<PollEntity>,
    ) { }

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

    async findPollWithQuestions(pollId: number, isOwner: boolean = false): Promise<PollEntity | null> {
        const whereCondition: {id: number, isPublic?: boolean} = { id: pollId };
        
        if (!isOwner) {
            whereCondition.isPublic = true;
        }

        return await this.pollRepository.findOne({
            where: whereCondition,
            relations: {
                questions: {
                    questionOptions: true
                }
            },
            order: {
                questions: {
                    orderNum: 'ASC',
                    questionOptions: {
                        orderNum: 'ASC'
                    }
                }
            }
        });
    }
}
