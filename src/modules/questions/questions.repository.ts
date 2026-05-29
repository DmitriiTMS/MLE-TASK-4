import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { QuestionOptionEntity } from '../question-options/entities/question-options.entity';
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
        @InjectRepository(PollEntity)
        private readonly pollRepository: Repository<PollEntity>,
        private readonly dataSource: DataSource,
    ) { }

    async createQuestion(
        question: QuestionEntity,
        questionOptions: QuestionOptionEntity[],
    ): Promise<QuestionEntity> {
        try {
            return await this.dataSource.transaction(async (transactionalEntityManager) => {
                const savedQuestion = await transactionalEntityManager.save(QuestionEntity, question);

                const savedOptions = await transactionalEntityManager.save(
                    QuestionOptionEntity,
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
        const whereCondition: { id: number, isPublic?: boolean } = { id: pollId };

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

    async findQuestion(pollId: number, questionId: number): Promise<QuestionEntity | null> {
        return await this.questionRepository.findOne({
            where: { id: questionId, pollId },
            relations: {
                questionOptions: true
            },
            order: {
                questionOptions: {
                    orderNum: 'ASC'
                }
            }
        });
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
                    QuestionEntity,
                    { id: question.id, pollId: question.pollId },
                    {
                        text: question.text,
                        type: question.type,
                        orderNum: question.orderNum,
                    }
                );

                if (question.questionOptions && question.questionOptions.length > 0) {
                    for (const option of question.questionOptions) {
                        if (option.id) {
                            await transactionalEntityManager.update(
                                QuestionOptionEntity,
                                {
                                    id: option.id,
                                    questionId: question.id
                                },
                                {
                                    text: option.text,
                                    orderNum: option.orderNum
                                }
                            );
                        }
                    }
                }
            });

            const updatedQuestion = await this.findQuestion(question.pollId, question.id);

            if (!updatedQuestion) {
                throw new NotFoundException(`Question with id ${question.id} not found after update`);
            }

            this.logger.log(`${this.context} - Question with options saved successfully: ${question.id}`);

            return updatedQuestion;
        } catch (error: unknown) {
            this.logger.error(`${this.context} - transaction failed: ${error}`);
            throw error;
        }
    }

    async deleteQuestionWithOptions(pollId: number, questionId: number): Promise<void> {
        await this.questionRepository.delete({
            pollId, id: questionId
        })
    }
}
