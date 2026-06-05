import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UsersAnswersModel } from "./models/users-answers.model";
import { DataSource, In, Repository } from "typeorm";
import { UsersAnswersEntity } from "./domain/users-answers.entity";
import { IUsersAnswersRepository } from "./users-answers.repository.interface";
import { ResultsWithNamesRaw } from "./constants/types";
import { POLL_INJECTION_TOKENS } from "../polls/constants/poll-injection-tokens";
import type { IPollsRepository } from "../polls/polls.repository.interface";
import { POLLS_MESSAGE } from "../polls/constants/types.message";


@Injectable()
export class UsersAnswersRepository implements IUsersAnswersRepository {
    constructor(
        @InjectRepository(UsersAnswersModel)
        private readonly answersRepository: Repository<UsersAnswersModel>,
        private readonly dataSource: DataSource,
        @Inject(POLL_INJECTION_TOKENS.IPOLL_REPOSITORY)
        private readonly pollsRepository: IPollsRepository,
    ) { }

    async createMultipleAnswers(answerEntities: UsersAnswersEntity[]): Promise<{ userAnswerSave: boolean }> {
        return await this.dataSource.transaction(async (manager) => {
            const answerModels = answerEntities.map(entity =>
                manager.create(UsersAnswersModel, {
                    userId: entity.userId,
                    pollId: entity.pollId,
                    questionId: entity.questionId,
                    optionId: entity.optionId,
                })
            );

            await manager.save(answerModels);
            return { userAnswerSave: true }
            // return UsersAnswersEntity.toEntityList(savedAnswers);
        });
    }

    async findByUserAndQuestion(
        userId: number,
        pollId: number,
        questionId: number,
        questionOptionIds: number[]
    ): Promise<UsersAnswersEntity[]> {
        const answers = await this.answersRepository.find({
            where: {
                userId: userId,
                pollId: pollId,
                questionId: questionId,
                optionId: In(questionOptionIds),
            },
        });

        return UsersAnswersEntity.toEntityList(answers);
    }

    async findOneResults(pollId: number): Promise<ResultsWithNamesRaw[]> {

        const poll = await this.pollsRepository.findById(pollId);
        if (!poll) {
            throw new NotFoundException(POLLS_MESSAGE.POLL_NOT_FOUND);
        }

        const results = await this.answersRepository
            .createQueryBuilder('answer')
            .leftJoin('answer.poll', 'poll')
            .leftJoin('answer.question', 'question')
            .leftJoin('answer.option', 'option')
            .select('answer.pollId', 'pollId')
            .addSelect('poll.title', 'pollTitle')
            .addSelect('answer.questionId', 'questionId')
            .addSelect('question.text', 'questionText')
            .addSelect('answer.optionId', 'questionOptionId')
            .addSelect('option.text', 'optionText')
            .addSelect('COUNT(answer.optionId)', 'count')
            .where('answer.pollId = :pollId', { pollId })
            .groupBy('answer.pollId')
            .addGroupBy('poll.title')
            .addGroupBy('answer.questionId')
            .addGroupBy('question.text')
            .addGroupBy('answer.optionId')
            .addGroupBy('option.text')
            .orderBy('count', 'DESC')
            .getRawMany();

        return results;
    }
}
