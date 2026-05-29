import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { POLL_INJECTION_TOKENS } from '../../polls/constants/poll-injection-tokens';
import { POLLS_MESSAGE } from '../../polls/constants/types.message';
import { PollEntity } from '../../polls/entities/polls.entity';
import { QuestionOptionEntity } from '../question-options/entities/question-options.entity';
import { QUESTIONS_INJECTION_TOKENS } from './constants/questions-injection-tokens';
import { DataRequestQuestionDto } from './constants/types';
import { QUESTIONS_MESSAGE } from './constants/types.messages';
import { UpdateQuestionWithOptionsDto } from './dto/update-question-with-options.dto';
import { QuestionEntity } from './entities/questions.entity';
import type { IQuestionsRepository } from './questions.repository.interface';
import type { IQuestionsService } from './questions.service.interface';
import type { IPollsRepository } from '../../polls/polls.repository.interface';

@Injectable()
export class QuestionsService implements IQuestionsService {
    private readonly context = QuestionsService.name;
    private readonly QUESTION_ID_PLUG = 0;

    constructor(
        private readonly logger: Logger,
        @Inject(POLL_INJECTION_TOKENS.IPOLL_REPOSITORY)
        private readonly pollsRepository: IPollsRepository,
        @Inject(QUESTIONS_INJECTION_TOKENS.IQUESTIONS_REPOSITORY)
        private readonly questionsRepository: IQuestionsRepository,
    ) {}

    async createQuestionWithOptions(data: DataRequestQuestionDto): Promise<QuestionEntity> {
        const operation = 'createQuestionWithOptions';
        const { userId, pollId, createQuestionDto } = data;

        const poll = await this.pollsRepository.findById(pollId);
        if (!poll) {
            this.logger.warn(
                `[${this.context}] - [${operation}] - Poll with ID: ${pollId} not found`,
            );
            throw new NotFoundException(POLLS_MESSAGE.POLL_NOT_FOUND);
        }

        if (!poll.belongsToUser(userId)) {
            this.logger.warn(
                `[${this.context}] - [${operation}] - ${QUESTIONS_MESSAGE.USER_NOT_THE_SURVEY_CREATOR}`,
            );
            throw new ForbiddenException(QUESTIONS_MESSAGE.USER_NOT_THE_SURVEY_CREATOR);
        }

        const question = QuestionEntity.createInstance(
            pollId,
            createQuestionDto.text,
            createQuestionDto.orderNum,
            createQuestionDto.type,
        );

        const options = createQuestionDto.options.map((optionDto) =>
            QuestionOptionEntity.createInstance(
                this.QUESTION_ID_PLUG,
                optionDto.text,
                optionDto.orderNum,
            ),
        );

        try {
            const savedQuestion = await this.questionsRepository.createQuestion(question, options);
            this.logger.log(
                `[${this.context}] - [${operation}] - ${QUESTIONS_MESSAGE.QUESTION_CREATED} - questionId: ${savedQuestion.id}`,
            );
            return savedQuestion;
        } catch (error) {
            this.logger.error(
                `${this.context} - [${operation}] - ${QUESTIONS_MESSAGE.QUESTION_CREATED} - ${error}`,
            );
            throw error;
        }
    }

    async findPollWithAllQuestions(userId: number, pollId: number): Promise<PollEntity> {
        const operation = 'findPollWithAllQuestions';

        const poll = await this.pollsRepository.findById(pollId);
        if (!poll) {
            this.logger.warn(
                `[${this.context}] - [${operation}] - Poll with ID: ${pollId} not found`,
            );
            throw new NotFoundException(POLLS_MESSAGE.POLL_NOT_FOUND);
        }

        if (!poll.belongsToUser(userId) && !poll.isPublicStatus()) {
            this.logger.warn(
                `[${this.context}] - ${POLLS_MESSAGE.SURVEY_NOT_AVAILABLE} with ID: ${pollId}`,
            );
            throw new ForbiddenException(POLLS_MESSAGE.SURVEY_NOT_AVAILABLE);
        }

        const isOwner = poll.belongsToUser(userId);
        const pollWithQuestions = await this.questionsRepository.findPollWithQuestions(
            pollId,
            isOwner,
        );

        if (!pollWithQuestions) {
            this.logger.warn(
                `[${this.context}] - ${POLLS_MESSAGE.SURVEY_NOT_AVAILABLE} with ID: ${pollId}`,
            );
            throw new ForbiddenException(POLLS_MESSAGE.SURVEY_NOT_AVAILABLE);
        }

        return pollWithQuestions;
    }

    async findQuestion(data: {
        userId: number;
        pollId: number;
        questionId: number;
    }): Promise<QuestionEntity> {
        const operation = 'findQuestion';
        const { userId, pollId, questionId } = data;

        const poll = await this.pollsRepository.findById(pollId);
        if (!poll) {
            this.logger.warn(
                `[${this.context}] - [${operation}] - Poll with ID: ${pollId} not found`,
            );
            throw new NotFoundException(POLLS_MESSAGE.POLL_NOT_FOUND);
        }

        if (!poll.belongsToUser(userId)) {
            this.logger.warn(
                `[${this.context}] - ${POLLS_MESSAGE.SURVEY_NOT_AVAILABLE} with ID: ${pollId}`,
            );
            throw new ForbiddenException(POLLS_MESSAGE.SURVEY_NOT_AVAILABLE);
        }

        const question = await this.questionsRepository.findQuestion(pollId, questionId);
        if (!question) {
            this.logger.warn(
                `[${this.context}] - ${QUESTIONS_MESSAGE.QUESTION_NOT_FOUND} with ID: ${questionId}`,
            );
            throw new NotFoundException(QUESTIONS_MESSAGE.QUESTION_NOT_FOUND);
        }

        return question;
    }

    async updateQuestion(data: {
        userId: number;
        pollId: number;
        questionId: number;
        updateData: UpdateQuestionWithOptionsDto;
    }): Promise<QuestionEntity> {
        const operation = 'updateQuestion';
        const { userId, pollId, questionId, updateData } = data;

        const poll = await this.pollsRepository.findById(pollId);
        if (!poll) {
            this.logger.warn(
                `[${this.context}] - [${operation}] - Poll with ID: ${pollId} not found`,
            );
            throw new NotFoundException(POLLS_MESSAGE.POLL_NOT_FOUND);
        }

        if (!poll.belongsToUser(userId)) {
            this.logger.warn(
                `[${this.context}] - [${operation}] - ${POLLS_MESSAGE.SURVEY_NOT_AVAILABLE} with ID: ${pollId}`,
            );
            throw new ForbiddenException(POLLS_MESSAGE.SURVEY_NOT_AVAILABLE);
        }

        const existingQuestion = await this.questionsRepository.findQuestion(pollId, questionId);
        if (!existingQuestion) {
            this.logger.warn(
                `[${this.context}] - [${operation}] - ${QUESTIONS_MESSAGE.QUESTION_NOT_FOUND} with ID: ${questionId}`,
            );
            throw new NotFoundException(QUESTIONS_MESSAGE.QUESTION_NOT_FOUND);
        }

        const updatedQuestion = QuestionEntity.updateWithOptions({
            id: existingQuestion.id,
            pollId: existingQuestion.pollId,
            text: updateData.text,
            type: updateData.type,
            orderNum: updateData.orderNum,
            questionOptions: updateData.options.map((opt, index) => {
                return {
                    id: existingQuestion.questionOptions?.[index]?.id,
                    text: opt.text,
                    orderNum: opt.orderNum,
                };
            }),
        });

        const updatedQuestionDb =
            await this.questionsRepository.updateQuestionWithOptions(updatedQuestion);

        return updatedQuestionDb;
    }

    async deleteQuestionWithOptions(data: {
        userId: number;
        pollId: number;
        questionId: number;
    }): Promise<void> {
        const operation = 'deleteQuestionWithOptions';
        const { userId, pollId, questionId } = data;

        const poll = await this.pollsRepository.findById(pollId);
        if (!poll) {
            this.logger.warn(
                `[${this.context}] - [${operation}] - Poll with ID: ${pollId} not found`,
            );
            throw new NotFoundException(POLLS_MESSAGE.POLL_NOT_FOUND);
        }

        if (!poll.belongsToUser(userId)) {
            this.logger.warn(
                `[${this.context}] - ${POLLS_MESSAGE.SURVEY_NOT_AVAILABLE} with ID: ${pollId}`,
            );
            throw new ForbiddenException(POLLS_MESSAGE.SURVEY_NOT_AVAILABLE);
        }

        const question = await this.questionsRepository.findQuestion(pollId, questionId);
        if (!question) {
            this.logger.warn(
                `[${this.context}] - ${QUESTIONS_MESSAGE.QUESTION_NOT_FOUND} with ID: ${questionId}`,
            );
            throw new NotFoundException(QUESTIONS_MESSAGE.QUESTION_NOT_FOUND);
        }

        await this.questionsRepository.deleteQuestionWithOptions(pollId, questionId);
    }
}
