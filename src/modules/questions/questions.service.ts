import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { POLL_INJECTION_TOKENS } from '../polls/constants/poll-injection-tokens';
import { POLLS_MESSAGE } from '../polls/constants/types.message';
import { QUESTIONS_INJECTION_TOKENS } from './constants/questions-injection-tokens';
import { IDataRequestQuestion } from './constants/types';
import { QUESTIONS_MESSAGE } from './constants/types.messages';
import { QuestionOptionEntity } from './entities/question-options.entity';
import { QuestionEntity } from './entities/questions.entity';
import type { IQuestionsRepository } from './questions.repository.interface';
import type { IQuestionsService } from './questions.service.interface';
import type { IPollsRepository } from '../polls/polls.repository.interface';
import { PollEntity } from '../polls/entities/polls.entity';

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
    ) { }

    async createQuestionWithOptions(data: IDataRequestQuestion): Promise<QuestionEntity> {
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

    async findPollWithAllQuestions(userId: number, pollId: number): Promise<PollEntity | null> {
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
        const pollWithQuestionsPublic = await this.questionsRepository.findPollWithQuestions(pollId, isOwner);

        if (!pollWithQuestionsPublic) {
            this.logger.warn(
                `[${this.context}] - ${POLLS_MESSAGE.SURVEY_NOT_AVAILABLE} with ID: ${pollId}`,
            );
            throw new ForbiddenException(POLLS_MESSAGE.SURVEY_NOT_AVAILABLE);
        }

        return pollWithQuestionsPublic;
    }
}
