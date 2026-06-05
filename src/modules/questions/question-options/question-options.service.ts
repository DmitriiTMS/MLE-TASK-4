import {
    BadRequestException,
    ForbiddenException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { POLL_INJECTION_TOKENS } from '../../polls/constants/poll-injection-tokens';
import { POLLS_MESSAGE } from '../../polls/constants/types.message';

import { QUESTIONS_INJECTION_TOKENS } from '../questions-variant/constants/questions-injection-tokens';
import { QUESTIONS_MESSAGE } from '../questions-variant/constants/types.messages';
import { OPTIONS_INJECTION_TOKENS } from './constants/option-injection-tokens';
import { ICreateOptioData, IDeleteOptionData } from './constants/types';
import { OPTIONS_MESSAGE } from './constants/types-messages';
import { QuestionOptionEntity } from './domain/question-options.entity';
import { IQuestionOptionsService } from './question-options.service.interface';
import type { IQuestionOptionsRepository } from './question-options.repository.interface';
import type { IPollsRepository } from '../../polls/polls.repository.interface';
import type { IQuestionsRepository } from '../questions-variant/questions.repository.interface';

@Injectable()
export class QuestionOptionsService implements IQuestionOptionsService {
    private readonly context = QuestionOptionsService.name;

    constructor(
        private readonly logger: Logger,
        @Inject(QUESTIONS_INJECTION_TOKENS.IQUESTIONS_REPOSITORY)
        private readonly questionsRepository: IQuestionsRepository,
        @Inject(POLL_INJECTION_TOKENS.IPOLL_REPOSITORY)
        private readonly pollsRepository: IPollsRepository,
        @Inject(OPTIONS_INJECTION_TOKENS.IOPTIONS_REPOSITORY)
        private readonly questionOptionsRepository: IQuestionOptionsRepository,
    ) { }

    async createOption(data: ICreateOptioData): Promise<QuestionOptionEntity> {
        const operation = 'createOption';
        const { userId, questionId, createOptionDto } = data;

        const question = await this.checkingPollQuestions(questionId, userId, operation)

        const existingOrderNum = question.questionOptions?.some(
            (opt) => opt.orderNum === createOptionDto.orderNum,
        );
        if (existingOrderNum) {
            throw new BadRequestException(OPTIONS_MESSAGE.OPTION_ORDER_NUMBER);
        }

        const option = QuestionOptionEntity.createInstance(
            questionId,
            createOptionDto.text,
            createOptionDto.orderNum,
        );

        try {
            const savedOption = await this.questionOptionsRepository.createOption(option);
            this.logger.log(
                `[${this.context}] - [${operation}] -  questionId: ${JSON.stringify(savedOption)}`,
            );
            return savedOption;
        } catch (error) {
            this.logger.error(`${this.context} - [${operation}] - ${error}`);
            throw error;
        }
    }

    async deleteOption(data: IDeleteOptionData): Promise<void> {
        const operation = 'deleteOption';
        const { userId, questionId, optionId } = data;

        await this.checkingPollQuestions(questionId, userId, operation)

        const option = await this.questionOptionsRepository.findOptionById(optionId);
        if (!option) {
            throw new NotFoundException(`Option with ID ${optionId} not found`);
        }

        try {
            await this.questionOptionsRepository.deleteOption(optionId);
            this.logger.log(`[${this.context}] - [${operation}] -  optionId:${optionId}`);
        } catch (error) {
            this.logger.error(`${this.context} - [${operation}] - ${error}`);
            throw error;
        }
    }

    async checkingPollQuestions(questionId: number, userId: number, operation: string) {
        const question = await this.questionsRepository.findOneQuestion(questionId);
        if (!question) {
            this.logger.warn(
                `[${this.context}] - [${operation}] - Question with ID: ${questionId} not found`,
            );
            throw new NotFoundException(QUESTIONS_MESSAGE.QUESTION_NOT_FOUND);
        }

        const poll = await this.pollsRepository.findById(question.pollId);
        if (!poll) {
            this.logger.warn(
                `[${this.context}] - [${operation}] - Poll with ID: ${question.pollId} not found`,
            );
            throw new NotFoundException(POLLS_MESSAGE.POLL_NOT_FOUND);
        }

        if (!poll.belongsToUser(userId)) {
            this.logger.warn(
                `[${this.context}] - [${operation}] - ${QUESTIONS_MESSAGE.USER_NOT_THE_SURVEY_CREATOR}`,
            );
            throw new ForbiddenException(QUESTIONS_MESSAGE.USER_NOT_THE_SURVEY_CREATOR);
        }

        return question
    }
}
