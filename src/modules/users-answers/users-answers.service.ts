import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { IDataCreateAnswer } from "./constants/types";
import { IUsersAnswersService } from "./users-answers.service.interface";
import { UsersAnswersEntity } from "./domain/users-answers.entity";
import { USERS_ANSWERS_INJECTION_TOKENS } from "./constants/users-answers-injection-tokens";
import type { IUsersAnswersRepository } from "./users-answers.repository.interface";
import { QUESTIONS_MESSAGE } from "../questions/questions-variant/constants/types.messages";
import { POLLS_MESSAGE } from "../polls/constants/types.message";
import { QUESTIONS_INJECTION_TOKENS } from "../questions/questions-variant/constants/questions-injection-tokens";
import type { IQuestionsRepository } from "../questions/questions-variant/questions.repository.interface";
import { POLL_INJECTION_TOKENS } from "../polls/constants/poll-injection-tokens";
import type { IPollsRepository } from "../polls/polls.repository.interface";
import { OPTIONS_MESSAGE } from "../questions/question-options/constants/types-messages";
import { USERS_ANSWERS_MESSAGE } from "./constants/types-messages";
import { UsersAnswersGateway } from "./users-answers.gateway";

@Injectable()
export class UsersAnswersService implements IUsersAnswersService {
    private readonly context = UsersAnswersService.name;

    constructor(
        private readonly logger: Logger,
        @Inject(QUESTIONS_INJECTION_TOKENS.IQUESTIONS_REPOSITORY)
        private readonly questionsRepository: IQuestionsRepository,
        @Inject(POLL_INJECTION_TOKENS.IPOLL_REPOSITORY)
        private readonly pollsRepository: IPollsRepository,
        @Inject(USERS_ANSWERS_INJECTION_TOKENS.IUSERS_ANSWERS_REPOSITORY)
        private readonly usersAnswersRepository: IUsersAnswersRepository,
        private readonly usersAnswersGateway: UsersAnswersGateway
    ) { }

    async createAnswer(data: IDataCreateAnswer): Promise<{ userAnswerSave: boolean }> {
        const { userId, pollId, questionId, questionOptionIds } = data
        const operation = 'createAnswer';
        this.logger.log(
            `[${this.context}] - Starting ${operation} operation - User ID: ${userId}, ` +
            `Data: ${JSON.stringify(data)}`,
        );

        await this.checkingPollQuestionOptions(pollId, questionId, questionOptionIds, operation)

        const existingAnswers = await this.usersAnswersRepository.findByUserAndQuestion(
            userId,
            pollId,
            questionId,
            questionOptionIds
        );

        if (existingAnswers.length > 0) {
            this.logger.warn(
                `[${this.context}] - ${USERS_ANSWERS_MESSAGE.THERE_ARE_VOICES}`
            );
            throw new BadRequestException(USERS_ANSWERS_MESSAGE.THERE_ARE_VOICES);
        }

        const answerEntities = UsersAnswersEntity.createMultipleInstances(
            userId,
            pollId,
            questionId,
            questionOptionIds,
        );

        try {
            const result = await this.usersAnswersRepository.createMultipleAnswers(answerEntities);
            await this.usersAnswersGateway.getQuantityAnswers(pollId);
            return { userAnswerSave: result.userAnswerSave }
        } catch (error) {
            this.logger.error(
                `[${this.context}] - ${operation} operation failed - User ID: ${userId}`,
            );
            throw error;
        }
    }

    async checkingPollQuestionOptions(pollId: number, questionId: number, questionOptionIds: number[], operation: string) {
        const poll = await this.pollsRepository.findById(pollId);
        if (!poll) {
            this.logger.warn(
                `[${this.context}] - [${operation}] - ${POLLS_MESSAGE.POLL_NOT_FOUND}`,
            );
            throw new NotFoundException(POLLS_MESSAGE.POLL_NOT_FOUND);
        }

        const question = await this.questionsRepository.findOneQuestion(questionId);
        if (!question) {
            this.logger.warn(
                `[${this.context}] - [${operation}] - ${QUESTIONS_MESSAGE.QUESTION_NOT_FOUND}`,
            );
            throw new NotFoundException(QUESTIONS_MESSAGE.QUESTION_NOT_FOUND);
        }

        if (!question.belongsToPoll(pollId)) {
            this.logger.warn(
                `[${this.context}] - [${operation}] - ${QUESTIONS_MESSAGE.QUESTION_DOES_NOT_POLL}`,
            );
            throw new ForbiddenException(QUESTIONS_MESSAGE.QUESTION_DOES_NOT_POLL);
        }

        if (!question.hasAllOptions(questionOptionIds)) {
            this.logger.warn(
                `[${this.context}] - [${operation}] - ${OPTIONS_MESSAGE.OPTION_DO_NOT_BELONG_TO_QUESTION}`,
            );
            throw new BadRequestException(OPTIONS_MESSAGE.OPTION_DO_NOT_BELONG_TO_QUESTION);
        }

    }
}