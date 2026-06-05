import { PollEntity } from "../../polls/domain/polls.entity";
import { QuestionOptionEntity } from "../../questions/question-options/domain/question-options.entity";
import { QuestionEntity } from "../../questions/questions-variant/domain/questions.entity";
import { UserEntity } from "../../users/domain/user.entity";
import { ResultsWithNamesRaw, ResultsWithNamesRawResponse } from "../constants/types";
import { UsersAnswersModel } from "../models/users-answers.model";


export class UsersAnswersEntity {
    id: number;
    userId: number;
    pollId: number;
    questionId: number;
    optionId: number;
    createdAt: Date;
    updatedAt: Date;
    user: UserEntity;
    poll: PollEntity;
    question: QuestionEntity;
    option: QuestionOptionEntity;

    static createInstance(
        userId: number,
        pollId: number,
        questionId: number,
        optionId: number,
    ): UsersAnswersEntity {
        const entity = new UsersAnswersEntity();
        entity.userId = userId;
        entity.pollId = pollId;
        entity.questionId = questionId;
        entity.optionId = optionId;
        return entity;
    }

    static createMultipleInstances(
        userId: number,
        pollId: number,
        questionId: number,
        optionIds: number[],
    ): UsersAnswersEntity[] {
        return optionIds.map(optionId =>
            this.createInstance(userId, pollId, questionId, optionId)
        );
    }


    static toEntity(data: UsersAnswersModel): UsersAnswersEntity {
        const entity = new UsersAnswersEntity();
        entity.id = data.id;
        entity.userId = data.userId;
        entity.pollId = data.pollId;
        entity.questionId = data.questionId;
        entity.optionId = data.optionId;

        if (data.user) {
            entity.user = UserEntity.toEntity(data.user);
        }
        if (data.poll) {
            entity.poll = PollEntity.toEntity(data.poll);
        }
        if (data.question) {
            entity.question = QuestionEntity.toEntity(data.question);
        }
        if (data.option) {
            entity.option = QuestionOptionEntity.toEntity(data.option);
        }
        return entity;
    }

    static toEntityList(data: UsersAnswersModel[]): UsersAnswersEntity[] {
        if (!data || data.length === 0) {
            return [];
        }
        return data.map(item => this.toEntity(item));
    }

    static toResponseGetQuantity(data: ResultsWithNamesRaw[]): ResultsWithNamesRawResponse[] {
        if (!data || data.length === 0) {
            return [];
        }
        return data.map((item) => {
            return {
                pollId: item.pollId,
                questionId: item.questionId,
                questionOptionId: item.questionOptionId,
                pollTitle: item.pollTitle,
                questionText: item.questionText,
                optionText: item.optionText,
                count: parseInt(item.count)
            }
        })

    }

}