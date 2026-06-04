import { ApiProperty } from '@nestjs/swagger';

export interface ICreateOptioData {
    userId: number;
    questionId: number;
    createOptionDto: {
        text: string;
        orderNum: number;
    };
}

export interface IDeleteOptionData {
    userId: number;
    questionId: number;
    optionId: number;
}

export class CreateOptionResponseDto {
    @ApiProperty({
        description: 'Уникальный идентификатор варианта ответа',
        example: 1,
        minimum: 1,
    })
    id: number;

    @ApiProperty({
        description: 'Текст варианта ответа',
        example: 'JavaScript',
        maxLength: 2000,
    })
    text: string;

    @ApiProperty({
        description: 'Порядковый номер варианта ответа (начиная с 1)',
        example: 1,
        minimum: 1,
    })
    orderNum: number;
}
