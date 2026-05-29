import { ApiProperty } from '@nestjs/swagger';

export class PollResponse {
    @ApiProperty({
        example: 1,
        description: 'Уникальный идентификатор опроса',
    })
    id: number;

    @ApiProperty({
        example: 'Мой первый опрос',
        description: 'Название опроса',
        maxLength: 255,
    })
    title: string;

    @ApiProperty({
        example: 'Это пример опроса',
        description: 'Описание опроса',
        required: false,
        nullable: true,
        maxLength: 3000,
    })
    description?: string | undefined;

    @ApiProperty({
        example: false,
        description: 'Статус активности опроса',
    })
    isActive: boolean;

    @ApiProperty({
        example: false,
        description: 'Статус публичности опроса',
    })
    isPublic: boolean;

    @ApiProperty({
        type: 'object',
        properties: {
            id: { type: 'number', example: 1, description: 'ID создателя' },
            name: { type: 'string', example: 'Иван Иванов', description: 'Имя создателя' },
        },
        description: 'Информация о создателе опроса',
    })
    createUser: {
        id: number;
        name: string;
    };
}

export class PaginatedResponse {
    @ApiProperty({
        type: [PollResponse],
        description: 'Массив опросов',
        example: [
            {
                id: 1,
                title: 'Мой первый опрос',
                description: 'Это пример опроса',
                isActive: false,
                isPublic: true,
                createUser: {
                    id: 1,
                    name: 'Иван Иванов',
                },
            },
        ],
    })
    data: PollResponse[];

    @ApiProperty({
        type: 'object',
        properties: {
            page: { type: 'number', example: 1, description: 'Текущая страница' },
            limit: { type: 'number', example: 10, description: 'Элементов на странице' },
            total: { type: 'number', example: 25, description: 'Всего элементов' },
            totalPages: { type: 'number', example: 3, description: 'Всего страниц' },
        },
        description: 'Метаданные пагинации',
    })
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export class QuestionOptionDto {
    @ApiProperty({
        description: 'Unique identifier of the question option',
        example: 1,
        type: Number,
    })
    id: number;

    @ApiProperty({
        description: 'Text of the question option',
        example: 'JavaScript/TypeScript',
        type: String,
    })
    text: string;

    @ApiProperty({
        description: 'Order number of the option in the question (for sorting)',
        example: 1,
        minimum: 1,
        type: Number,
    })
    orderNum: number;
}

export class QuestionDto {
    @ApiProperty({
        description: 'Unique identifier of the question',
        example: 1,
        type: Number,
    })
    id: number;

    @ApiProperty({
        description: 'Text of the question',
        example: 'Какой язык программирования вы предпочитаете?',
        type: String,
    })
    text: string;

    @ApiProperty({
        description: 'Type of the question (single choice or multiple choice)',
        example: 'single',
        enum: ['single', 'multiple'],
        enumName: 'QuestionType',
    })
    type: string;

    @ApiProperty({
        description: 'Order number of the question in the poll (for sorting)',
        example: 1,
        minimum: 1,
        type: Number,
    })
    orderNum: number;

    @ApiProperty({
        description: 'List of answer options for the question',
        type: [QuestionOptionDto],
    })
    questionOptions: QuestionOptionDto[];
}

export class PollWithQuestions {
    @ApiProperty({
        description: 'Unique identifier of the poll',
        example: 1,
        type: Number,
    })
    id: number;

    @ApiProperty({
        description: 'Title of the poll',
        example: 'Опрос о предпочтениях в IT',
        maxLength: 255,
        type: String,
    })
    title: string;

    @ApiProperty({
        description: 'Detailed description of the poll',
        example: 'Расскажите о ваших предпочтениях в программировании',
        required: false,
        nullable: true,
        maxLength: 3000,
        type: String,
    })
    description?: string;

    @ApiProperty({
        description: 'Whether the poll is active and accepting responses',
        example: true,
        default: true,
        type: Boolean,
    })
    isActive: boolean;

    @ApiProperty({
        description: 'Whether the poll is publicly accessible',
        example: false,
        default: false,
        type: Boolean,
    })
    isPublic: boolean;

    @ApiProperty({
        description: 'List of questions in the poll',
        type: [QuestionDto],
    })
    questions: QuestionDto[];
}
