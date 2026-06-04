import { QuestionOptionEntity } from '../../questions/question-options/domain/question-options.entity';
import { QuestionEntity } from '../../questions/questions-variant/domain/questions.entity';
import { UserEntity } from '../../users/domain/user.entity';
import { UserModel } from '../../users/models/user.model';
import { PollResponse, PollWithQuestions } from '../constants/types';
import { PollModel } from '../models/polls.model';

export class PollEntity {
    id: number;
    title: string;
    description?: string;
    isActive: boolean;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    createUser: UserEntity;
    questions: QuestionEntity[];

    belongsToUser(userId: number): boolean {
        return this.createUser?.id === userId;
    }

    isPublicStatus(): boolean {
        return this.isPublic === true;
    }

    static createInstance(
        title: string,
        description: string | undefined,
        createUser: UserEntity,
    ): PollEntity {
        const poll = new PollEntity();
        poll.title = title;
        poll.description = description;
        poll.isActive = true;
        poll.isPublic = false;
        poll.createUser = createUser;
        return poll;
    }

    update(
        data: Partial<Pick<PollEntity, 'title' | 'description' | 'isActive' | 'isPublic'>>,
    ): void {
        if (data.title !== undefined) {
            this.title = data.title;
        }
        if (data.description !== undefined) {
            this.description = data.description;
        }
        if (data.isActive !== undefined) {
            this.isActive = data.isActive;
        }
        if (data.isPublic !== undefined) {
            this.isPublic = data.isPublic;
        }
    }

    toResponse() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            isActive: this.isActive,
            isPublic: this.isPublic,
            createUser: {
                id: this.createUser.id,
                name: this.createUser.name,
            },
        };
    }

    static toResponseList(polls: PollEntity[]) {
        return polls.map((poll) => poll.toResponse());
    }

    static fromJSON(data: PollResponse): PollEntity {
        const poll = new PollEntity();
        poll.id = data.id;
        poll.title = data.title;
        poll.description = data.description;
        poll.isActive = data.isActive;
        poll.isPublic = data.isPublic;

        const userEntity = new UserEntity();
        userEntity.id = data.createUser.id;
        userEntity.name = data.createUser.name;
        poll.createUser = userEntity;

        return poll;
    }

    static fromJSONArray(dataArray: PollResponse[]): PollEntity[] {
        if (!Array.isArray(dataArray)) return [];
        return dataArray.map((data) => this.fromJSON(data));
    }

    static toResponsePollWithQuestions(data: PollEntity): PollWithQuestions {
        return {
            id: data.id,
            title: data.title,
            description: data.description,
            isActive: data.isActive,
            isPublic: data.isPublic,
            questions: data.questions.map((question) => {
                return {
                    id: question.id,
                    text: question.text,
                    type: question.type,
                    orderNum: question.orderNum,
                    questionOptions: question.questionOptions.map((option) => {
                        return {
                            id: option.id,
                            text: option.text,
                            orderNum: option.orderNum,
                        };
                    }),
                };
            }),
        };
    }

    static toEntity(data: PollModel): PollEntity {
        const poll = new PollEntity();
        poll.id = data.id;
        poll.title = data.title;
        poll.description = data.description;
        poll.isActive = data.isActive;
        poll.isPublic = data.isPublic;
        poll.createdAt = data.createdAt;
        poll.updatedAt = data.updatedAt;

        const userEntity = new UserEntity();
        userEntity.id = data.createUser.id;
        userEntity.name = data.createUser.name;
        userEntity.email = data.createUser.email;
        userEntity.createdAt = data.createUser.createdAt;
        userEntity.updatedAt = data.createUser.updatedAt;

        poll.createUser = userEntity;

        return poll;
    }

    static toEntityPollWithQuestions(data: PollModel): PollEntity {
        const poll = new PollEntity();
        poll.id = data.id;
        poll.title = data.title;
        poll.description = data.description;
        poll.isActive = data.isActive;
        poll.isPublic = data.isPublic;
        poll.createdAt = data.createdAt;
        poll.updatedAt = data.updatedAt;

        poll.questions = data.questions.map((quest) => {
            const question = new QuestionEntity();
            question.id = quest.id;
            question.pollId = quest.pollId;
            question.text = quest.text;
            question.type = quest.type;
            question.orderNum = quest.orderNum;
            question.createdAt = quest.createdAt;
            question.updatedAt = quest.updatedAt;
            question.questionOptions = quest.questionOptions.map((option) => {
                const optionEntity = new QuestionOptionEntity();
                optionEntity.id = option.id;
                optionEntity.text = option.text;
                optionEntity.orderNum = option.orderNum;
                optionEntity.questionId = option.questionId;
                return optionEntity;
            });
            return question;
        });

        return poll;
    }

    setActive(isActive: boolean): void {
        this.isActive = isActive;
    }

    setPublic(isPublic: boolean): void {
        this.isPublic = isPublic;
    }
}
