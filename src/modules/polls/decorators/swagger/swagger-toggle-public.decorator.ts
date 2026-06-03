import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiOkResponse,
    ApiUnauthorizedResponse,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
    ApiBearerAuth,
    ApiTooManyRequestsResponse,
    ApiForbiddenResponse,
} from '@nestjs/swagger';
import { POLLS_MESSAGE } from '../../constants/types.message';

export function ApiTogglePublicDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Переключение статуса публичности опроса',
            description: `
Изменяет статус публичности опроса (isPublic).

**Требования:**
- Пользователь должен быть авторизован
- Пользователь должен быть владельцем опроса
- Опрос должен существовать
- Параметр isPublic должен быть булевым значением

**Процесс изменения:**
1. Проверяется существование опроса
2. Проверяется право владения опросом
3. Обновляется статус isPublic
4. Инвалидируется кэш опроса и списков опросов
5. Возвращается обновленный статус

**Примечания:**
- Публичные опросы могут просматривать другие пользователи
- Неактивные опросы не отображаются в публичных списках
- Владелец может просматривать опрос независимо от статусов
            `,
        }),
        ApiBody({
            schema: {
                type: 'object',
                required: ['isPublic'],
                properties: {
                    isPublic: {
                        type: 'boolean',
                        description: 'Новый статус публичности',
                        example: true,
                    },
                },
            },
            description: 'Новый статус публичности опроса',
            examples: {
                makePublic: {
                    summary: 'Сделать опрос публичным',
                    description: 'Устанавливает статус isPublic = true',
                    value: {
                        isPublic: true,
                    },
                },
                makePrivate: {
                    summary: 'Сделать опрос приватным',
                    description: 'Устанавливает статус isPublic = false',
                    value: {
                        isPublic: false,
                    },
                },
            },
        }),
        ApiBearerAuth(),
        ApiOkResponse({
            description: 'Статус публичности успешно изменен',
            schema: {
                type: 'object',
                properties: {
                    isPublic: {
                        type: 'boolean',
                        description: 'Обновленный статус публичности опроса',
                        example: true,
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
                    message: POLLS_MESSAGE.POLL_UPDATE_PUBLIC,
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
            description: 'Ошибка валидации входных данных',
            schema: {
                example: {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: [
                        'Validation failed (boolean string is expected)',
                        'isPublic must be a boolean value',
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