import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PollEntity } from '../../polls/domain/polls.entity';
import { PollModel } from '../../polls/models/polls.model';
import { QuestionOptionEntity } from '../question-options/domain/question-options.entity';
import { QuestionOptionModel } from '../question-options/models/question-options.model';
import { QuestionEntity } from './domain/questions.entity';
import { QuestionModel } from './models/questions.model';
import { IQuestionsRepository } from './questions.repository.interface';

@Injectable()
export class QuestionsRepository implements IQuestionsRepository {
    private readonly context = QuestionsRepository.name;

    constructor(
        private readonly logger: Logger,
        @InjectRepository(QuestionModel)
        private readonly questionRepository: Repository<QuestionModel>,
        @InjectRepository(PollModel)
        private readonly pollRepository: Repository<PollModel>,
        private readonly dataSource: DataSource,
    ) {}

    async createQuestion(
        question: QuestionEntity,
        questionOptions: QuestionOptionEntity[],
    ): Promise<QuestionEntity> {
        try {
            return await this.dataSource.transaction(async (transactionalEntityManager) => {
                const savedQuestion = await transactionalEntityManager.save(
                    QuestionModel,
                    question,
                );

                const savedOptions = await transactionalEntityManager.save(
                    QuestionOptionModel,
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

    async findPollWithQuestions(
        pollId: number,
        isOwner: boolean = false,
    ): Promise<PollEntity | null> {
        const whereCondition: { id: number; isPublic?: boolean } = { id: pollId };

        if (!isOwner) {
            whereCondition.isPublic = true;
        }

        const poll = await this.pollRepository.findOne({
            where: whereCondition,
            relations: {
                questions: {
                    questionOptions: true,
                },
            },
            order: {
                questions: {
                    orderNum: 'ASC',
                    questionOptions: {
                        orderNum: 'ASC',
                    },
                },
            },
        });

        if (!poll) {
            return null;
        }

        return PollEntity.toEntityPollWithQuestions(poll);
    }

    async findQuestion(pollId: number, questionId: number): Promise<QuestionEntity | null> {
        const question = await this.questionRepository.findOne({
            where: { id: questionId, pollId },
            relations: {
                questionOptions: true,
            },
            order: {
                questionOptions: {
                    orderNum: 'ASC',
                },
            },
        });
        return question ? QuestionEntity.toEntity(question) : null;
    }

    async updateQuestionWithOptions(question: QuestionEntity): Promise<QuestionEntity> {
        try {
            for (const option of question.questionOptions) {
                if (!option.id) {
                    throw new NotFoundException(`Option for questionId:${question.id} not found`);
                }
            }

            await this.dataSource.transaction(async (transactionalEntityManager) => {
                await transactionalEntityManager.update(
                    QuestionModel,
                    { id: question.id, pollId: question.pollId },
                    {
                        text: question.text,
                        type: question.type,
                        orderNum: question.orderNum,
                    },
                );

                if (question.questionOptions && question.questionOptions.length > 0) {
                    for (const option of question.questionOptions) {
                        if (option.id) {
                            await transactionalEntityManager.update(
                                QuestionOptionModel,
                                {
                                    id: option.id,
                                    questionId: question.id,
                                },
                                {
                                    text: option.text,
                                    orderNum: option.orderNum,
                                },
                            );
                        }
                    }
                }
            });

            const updatedQuestion = await this.findQuestion(question.pollId, question.id);

            if (!updatedQuestion) {
                throw new NotFoundException(
                    `Question with id ${question.id} not found after update`,
                );
            }

            this.logger.log(
                `${this.context} - Question with options saved successfully: ${question.id}`,
            );

            return QuestionEntity.toEntity(updatedQuestion);
        } catch (error: unknown) {
            this.logger.error(`${this.context} - transaction failed: ${error}`);
            throw error;
        }
    }

    async deleteQuestionWithOptions(pollId: number, questionId: number): Promise<void> {
        await this.questionRepository.delete({
            pollId,
            id: questionId,
        });
    }

    async findOneQuestion(questionId: number): Promise<QuestionEntity | null> {
        const question = await this.questionRepository.findOne({
            where: { id: questionId },
        });

        return question ? QuestionEntity.toEntity(question) : null;
    }
}
