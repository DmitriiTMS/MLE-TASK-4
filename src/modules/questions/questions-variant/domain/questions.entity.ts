
import { ResponseQuestionDto } from '../constants/types';
import { PollModel } from '../../../polls/models/polls.model';
import { QuestionModel } from '../models/questions.model';
import { QuestionOptionEntity } from '../../question-options/domain/question-options.entity';

export type QuestionType = 'single' | 'multiple';

export class QuestionEntity {

    id: number;
    pollId: number;
    text: string;
    type: QuestionType;
    orderNum: number;
    createdAt: Date;
    updatedAt: Date;
    poll: PollModel;
    questionOptions: QuestionOptionEntity[];

    static createInstance(
        pollId: number,
        text: string,
        orderNum: number,
        type: QuestionType,
    ): QuestionEntity {
        const question = new QuestionEntity();
        question.pollId = pollId;
        question.text = text;
        question.orderNum = orderNum;
        question.type = type;
        return question;
    }

    static updateWithOptions(question: {
        id: number;
        pollId: number;
        text?: string;
        type?: QuestionType;
        orderNum?: number;
        questionOptions: {
            id: number;
            text?: string;
            orderNum?: number;
        }[];
    }): QuestionEntity {
        const updatedQuestion = new QuestionEntity();
        updatedQuestion.id = question.id;
        updatedQuestion.pollId = question.pollId;
        if (question.text) {
            updatedQuestion.text = question.text;
        }
        if (question.type) {
            updatedQuestion.type = question.type;
        }
        if (question.orderNum) {
            updatedQuestion.orderNum = question.orderNum;
        }

        updatedQuestion.questionOptions = question.questionOptions.map((opt) => {
            const option = new QuestionOptionEntity();
            option.id = opt.id;
            if (opt.text) {
                option.text = opt.text;
            }
            if (opt.orderNum) {
                option.orderNum = opt.orderNum;
            }
            return option;
        });

        return updatedQuestion;
    }

    static toResponse(data: QuestionEntity): ResponseQuestionDto {
        return {
            id: data.id,
            pollId: data.pollId,
            text: data.text,
            type: data.type,
            orderNum: data.orderNum,
            questionOptions: data.questionOptions.map((option) => {
                return {
                    id: option.id,
                    text: option.text,
                    orderNum: option.orderNum,
                };
            }),
        };
    }

    static toEntity(data: QuestionModel): QuestionEntity {
        const entity = new QuestionEntity();
        entity.id = data.id;
        entity.pollId = data.pollId;
        entity.text = data.text;
        entity.type = data.type;
        entity.orderNum = data.orderNum;
        entity.createdAt = data.createdAt;
        entity.updatedAt = data.updatedAt;

        entity.questionOptions = data.questionOptions?.map((option) => {
            const optionEntity = new QuestionOptionEntity();
            optionEntity.id = option.id;
            optionEntity.text = option.text;
            optionEntity.orderNum = option.orderNum;
            optionEntity.questionId = option.questionId;
            return optionEntity;
        });

        return entity;
    }
}
