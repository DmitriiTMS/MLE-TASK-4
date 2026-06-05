import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTooManyRequestsResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { POLLS_MESSAGE } from '../../constants/types.message';

export function ApiToggleActiveDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Переключение статуса активности опроса',
            description: `
Изменяет статус активности опроса (isActive).

**Требования:**
- Пользователь должен быть авторизован
- Пользователь должен быть владельцем опроса
- Опрос должен существовать
- Параметр isActive должен быть булевым значением

**Процесс изменения:**
1. Проверяется существование опроса
2. Проверяется право владения опросом
3. Обновляется статус isActive
4. Инвалидируется кэш опроса и списков опросов
5. Возвращается обновленный статус

**Примечания:**
- Неактивные опросы не отображаются в публичных списках
- Владелец всегда может просматривать свой опрос
- Активные опросы видны другим пользователям (если публичные)
            `,
        }),
        ApiBody({
            schema: {
                type: 'object',
                required: ['isActive'],
                properties: {
                    isActive: {
                        type: 'boolean',
                        description: 'Новый статус активности',
                        example: false,
                    },
                },
            },
            description: 'Новый статус активности опроса',
            examples: {
                activate: {
                    summary: 'Активировать опрос',
                    description: 'Устанавливает статус isActive = true',
                    value: {
                        isActive: true,
                    },
                },
                deactivate: {
                    summary: 'Деактивировать опрос',
                    description: 'Устанавливает статус isActive = false',
                    value: {
                        isActive: false,
                    },
                },
            },
        }),
        ApiBearerAuth(),
        ApiOkResponse({
            description: 'Статус активности успешно изменен',
            schema: {
                type: 'object',
                properties: {
                    isActive: {
                        type: 'boolean',
                        description: 'Обновленный статус активности опроса',
                        example: false,
                    },
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
        ApiForbiddenResponse({
            description: 'Пользователь не является владельцем опроса',
            schema: {
                example: {
                    statusCode: HttpStatus.FORBIDDEN,
                    message: POLLS_MESSAGE.POLL_UPDATE_ACTIVE,
                    error: 'Forbidden',
                },
            },
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
        ApiBadRequestResponse({
            description: 'Ошибка валидации входных данных или ID опроса',
            schema: {
                example: {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: [
                        'Validation failed (numeric string is expected)',
                        'isActive must be a boolean value',
                    ],
                    error: 'Bad Request',
                },
            },
        }),
        ApiTooManyRequestsResponse({
            description: 'Превышен лимит запросов (ThrottlerGuard)',
            schema: {
                example: {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: 'Too Many Requests',
                    error: 'Too Many Requests',
                },
            },
        }),
    );
}
