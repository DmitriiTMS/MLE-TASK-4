import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiCreatedResponse,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
    ApiBearerAuth,
    ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { CreatePollDto } from '../../dto/create-poll.dto';
import { POLLS_MESSAGE } from '../../constants/types.message';
import { PollResponse } from '../../constants/types';


export function ApiCreatePollDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Создание нового опроса',
            description: `
Создает новый опрос для авторизованного пользователя.

**Требования:**
- Пользователь должен быть авторизован
- Поле title обязательно и не может быть пустым
- Максимальная длина title: 255 символов
- Максимальная длина description: 3000 символов

**Процесс создания:**
1. Проверяется существование пользователя
2. Создается новый опрос с активным статусом (isActive = false)
3. Опрос сохраняется в базу данных
4. Инвалидируется кэш списков опросов
5. Возвращается созданный опрос

**Примечания:**
- После создания опрос автоматически становится активным
- Владельцем опроса становится текущий пользователь
- Опрос сразу становится доступным для других пользователей (если активен)
            `,
        }),
        ApiBody({
            type: CreatePollDto,
            description: 'Данные для создания опроса',
            examples: {
                minimal: {
                    summary: 'Минимальные данные',
                    description: 'Только обязательное поле title',
                    value: {
                        title: 'Мой опрос',
                    },
                },
                full: {
                    summary: 'Полные данные',
                    description: 'С заголовком и описанием',
                    value: {
                        title: 'Опрос о качестве обслуживания',
                        description: 'Пожалуйста, оцените качество обслуживания в нашей компании',
                    },
                },
            },
        }),
        ApiBearerAuth(),
        ApiCreatedResponse({
            description: 'Опрос успешно создан',
            type: PollResponse,
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
        ApiBadRequestResponse({
            description: 'Ошибка валидации входных данных',
            schema: {
                example: {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: [
                        "Поле 'title' не может быть пустым",
                        "Максимальная длина поля 'title' не может быть больше 255 символов",
                        "Максимальная длина поля 'description' не может быть больше 3000 символов",
                    ],
                    error: 'Bad Request',
                },
            },
        }),
        ApiNotFoundResponse({
            description: 'Пользователь не найден',
            schema: {
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: POLLS_MESSAGE.USER_NOT_FOUND,
                    error: 'Not Found',
                },
            },
        }),
    );
}