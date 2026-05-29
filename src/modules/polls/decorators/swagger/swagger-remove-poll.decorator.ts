import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiOperation,
    ApiParam,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiForbiddenResponse,
    ApiUnauthorizedResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { POLLS_MESSAGE } from '../../constants/types.message';

export function ApiRemovePollDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Удаление опроса',
            description: `
Удаляет опрос из системы.

**Права доступа:**
- Только ВЛАДЕЛЕЦ опроса может его удалить

**Процесс удаления:**
1. Проверка существования опроса
2. Проверка прав доступа (владелец)
3. Удаление опроса из базы данных
4. Удаление кэша опроса
5. Инвалидация кэша списков опросов

**Кэширование:**
- Кэш конкретного опроса удаляется
- Все кэши списков опросов удаляются

**Важно:**
- Удаление опроса НЕОБРАТИМО
- Все связанные с опросом данные также удаляются (каскадное удаление)
            `,
        }),
        ApiParam({
            name: 'id',
            type: Number,
            required: true,
            example: 1,
            description: 'ID опроса для удаления',
            schema: {
                minimum: 1,
            },
        }),
        ApiBearerAuth(),
        ApiNoContentResponse({
            description: 'Опрос успешно удален (тело ответа пустое)',
        }),
        ApiNotFoundResponse({
            description: 'Опрос не найден',
            schema: {
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: POLLS_MESSAGE.POLL_NOT_FOUND,
                    error: 'Not Found',
                },
            },
        }),
        ApiForbiddenResponse({
            description: 'Нет прав на удаление опроса',
            schema: {
                example: {
                    statusCode: HttpStatus.FORBIDDEN,
                    message: POLLS_MESSAGE.NO_DELETE_PERMISSION,
                    error: 'Forbidden',
                },
            },
        }),
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
