import { QuestionEntity } from '../../questions-variant/domain/questions.entity';
import { CreateOptionResponseDto } from '../constants/types';

import { QuestionOptionModel } from '../models/question-options.model';

export class QuestionOptionEntity {
    id: number;
    questionId: number;
    text: string;
    orderNum: number;
    question: QuestionEntity;

    static createInstance(
        questionId: number,
        text: string,
        orderNum: number,
    ): QuestionOptionEntity {
        const questionsOption = new QuestionOptionEntity();
        questionsOption.questionId = questionId;
        questionsOption.text = text;
        questionsOption.orderNum = orderNum;
        return questionsOption;
    }

    static toResponse(data: QuestionOptionEntity): CreateOptionResponseDto {
        return {
            id: data.id,
            text: data.text,
            orderNum: data.orderNum,
        };
    }

    static toEntity(data: QuestionOptionModel): QuestionOptionEntity {
        const questionOption = new QuestionOptionEntity();
        questionOption.id = data.id;
        questionOption.questionId = data.questionId;
        questionOption.text = data.text;
        questionOption.orderNum = data.orderNum;
        return questionOption;
    }
}
