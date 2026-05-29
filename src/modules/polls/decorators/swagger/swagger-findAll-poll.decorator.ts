import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiOperation,
    ApiQuery,
    ApiOkResponse,
    ApiUnauthorizedResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { PaginatedResponse } from '../../constants/types';

export function ApiFindAllPollsDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Получение списка опросов',
            description: `
Возвращает список опросов с пагинацией.

**Правила доступа:**
- Пользователь видит ВСЕ свои опросы (активные и неактивные)
- Пользователь видит ТОЛЬКО активные опросы других пользователей
- Опросы отсортированы по дате создания (сначала новые)

**Кэширование:**
- Результаты кэшируются на 5 минут (300 секунд)
- Ключ кэша зависит от userId, page и limit
- При создании/обновлении/удалении опроса кэш инвалидируется

**Пагинация:**
- По умолчанию: page=1, limit=10
- Максимальный limit: 100
            `,
        }),
        ApiQuery({
            name: 'page',
            type: Number,
            required: false,
            example: 1,
            description: 'Номер страницы (по умолчанию: 1)',
            schema: {
                minimum: 1,
                default: 1,
            },
        }),
        ApiQuery({
            name: 'limit',
            type: Number,
            required: false,
            example: 10,
            description: 'Количество элементов на странице (по умолчанию: 10, максимум: 100)',
            schema: {
                minimum: 1,
                maximum: 100,
                default: 10,
            },
        }),
        ApiOkResponse({
            description: 'Список опросов успешно получен',
            type: PaginatedResponse,
        }),
        ApiBearerAuth(),
        ApiUnauthorizedResponse({
            description: 'Пользователь не авторизован',
            schema: {
                example: {
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: 'Unauthorized',
                    error: 'Unauthorized',
                },
            },
        }),
    );
}
