import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiOperation,
    ApiParam,
    ApiOkResponse,
    ApiNotFoundResponse,
    ApiForbiddenResponse,
    ApiUnauthorizedResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { PollResponse } from '../../constants/types';
import { POLLS_MESSAGE } from '../../constants/types.message';

export function ApiFindOnePollDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Получение опроса по ID',
            description: `
Возвращает опрос по его ID.

**Правила доступа:**
- Если пользователь является ВЛАДЕЛЬЦЕМ опроса → доступен ЛЮБОЙ опрос (даже неактивный)
- Если пользователь НЕ является владельцем → доступен ТОЛЬКО активный опрос (isActive = true)

**Кэширование:**
- Результаты кэшируются на 5 минут (300 секунд)
- Ключ кэша: poll:{id}
- При обновлении или удалении опроса кэш обновляется или удаляется

**Возможные ошибки:**
- 404: Опрос не найден
- 403: Опрос недоступен (неактивен и пользователь не владелец)
- 401: Пользователь не авторизован
            `,
        }),
        ApiParam({
            name: 'id',
            type: Number,
            required: true,
            example: 1,
            description: 'ID опроса',
            schema: {
                minimum: 1,
            },
        }),
        ApiBearerAuth(),
        ApiOkResponse({
            description: 'Опрос успешно получен',
            type: PollResponse,
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
            description: 'Доступ запрещен (опрос неактивен и пользователь не владелец)',
            schema: {
                example: {
                    statusCode: HttpStatus.FORBIDDEN,
                    message: POLLS_MESSAGE.SURVEY_NOT_AVAILABLE,
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
