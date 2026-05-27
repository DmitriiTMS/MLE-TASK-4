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