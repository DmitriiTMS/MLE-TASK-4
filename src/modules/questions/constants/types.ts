import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateQuestionWithOptionsDto } from '../dto/create-question-with-options.dto';

export enum QuestionType {
    SINGLE = 'single',
    MULTIPLE = 'multiple',
}
export class DataRequestQuestionDto {
    @ApiProperty({
        description: 'ID пользователя',
        example: 1,
        type: Number,
    })
    userId: number;

    @ApiProperty({
        description: 'ID опроса',
        example: 1,
        type: Number,
    })
    pollId: number;

    @ApiProperty({
        description: 'Данные для создания вопроса',
        type: CreateQuestionWithOptionsDto,
    })
    createQuestionDto: CreateQuestionWithOptionsDto;

}

export class ResponseQuestionOptionDto {
    @ApiPropertyOptional({
        description: 'ID варианта ответа',
        example: 1,
        type: Number,
    })
    id?: number;

    @ApiPropertyOptional({
        description: 'ID вопроса',
        example: 1,
        type: Number,
    })
    questionId?: number;

    @ApiProperty({
        description: 'Текст варианта ответа',
        example: 'JavaScript',
        type: String,
        required: true,
    })
    text: string;

    @ApiProperty({
        description: 'Порядковый номер варианта ответа',
        example: 1,
        type: Number,
        required: true,
    })
    orderNum: number;

}

export class ResponseQuestionDto {
    @ApiProperty({
        description: 'ID вопроса',
        example: 1,
        type: Number,
    })
    id: number;

    @ApiProperty({
        description: 'ID опроса',
        example: 1,
        type: Number,
    })
    pollId: number;

    @ApiProperty({
        description: 'Текст вопроса',
        example: 'Какой язык программирования вам нравится?',
        type: String,
    })
    text: string;

    @ApiProperty({
        description: 'Тип вопроса',
        enum: ['single', 'multiple'],
        example: 'single',
        type: String,
    })
    type: string;

    @ApiProperty({
        description: 'Порядковый номер вопроса',
        example: 0,
        type: Number,
    })
    orderNum: number;

    @ApiProperty({
        description: 'Список вариантов ответов',
        type: [ResponseQuestionOptionDto],
    })
    questionOptions: ResponseQuestionOptionDto[];

}
