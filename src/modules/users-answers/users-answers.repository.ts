import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UsersAnswersModel } from "./models/users-answers.model";
import { DataSource, In, Repository } from "typeorm";
import { UsersAnswersEntity } from "./domain/users-answers.entity";
import { IUsersAnswersRepository } from "./users-answers.repository.interface";

@Injectable()
export class UsersAnswersRepository implements IUsersAnswersRepository {
    constructor(
        @InjectRepository(UsersAnswersModel)
        private readonly answersRepository: Repository<UsersAnswersModel>,
        private readonly dataSource: DataSource,
    ) { }

    async createMultipleAnswers(answerEntities: UsersAnswersEntity[]): Promise<void> {
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
}
