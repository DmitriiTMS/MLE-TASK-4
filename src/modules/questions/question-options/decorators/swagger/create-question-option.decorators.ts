import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiCreatedResponse,
    ApiUnauthorizedResponse,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
    ApiBearerAuth,
    ApiTooManyRequestsResponse,
    ApiForbiddenResponse,
    ApiParam,
} from '@nestjs/swagger';
import { QUESTIONS_MESSAGE } from '../../../questions-variant/constants/types.messages';
import { CreateOptionResponseDto } from '../../constants/types';
import { CreateOptionDto } from '../../dto/create-question-option.dto';

export function ApiCreateOptionDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Создание нового варианта ответа',
            description: `
Создает новый вариант ответа для указанного вопроса.

**Требования:**
- Пользователь должен быть авторизован
- Пользователь должен быть владельцем опроса (через вопрос)
- Поле text обязательно и не может быть пустым
- Максимальная длина text: 2000 символов
- Поле orderNum обязательно (начиная с 1)
- Вариант ответа должен быть уникальным в рамках вопроса

**Процесс создания:**
1. Проверяется существование вопроса
2. Проверяется, что пользователь является владельцем опроса
3. Проверяется уникальность варианта в рамках вопроса
4. Создается новый вариант ответа
5. Вариант сохраняется в базу данных
6. Возвращается созданный вариант ответа

**Примечания:**
- Порядок вариантов определяется полем orderNum
- Варианты ответов можно создавать только для существующих вопросов
            `,
        }),
        ApiParam({
            name: 'questionId',
            description: 'ID вопроса, к которому добавляется вариант ответа',
            example: 1,
            type: Number,
            required: true,
        }),
        ApiBody({
            type: CreateOptionDto,
            description: 'Данные для создания варианта ответа',
            examples: {
                default: {
                    description: 'Создание варианта ответа',
                    value: {
                        text: 'JavaScript',
                        orderNum: 1,
                    },
                },
            },
        }),
        ApiBearerAuth(),
        ApiCreatedResponse({
            type: CreateOptionResponseDto,
            description: 'Вариант ответа успешно создан',
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
            description: 'Доступ запрещен (пользователь не владелец опроса)',
            schema: {
                example: {
                    statusCode: HttpStatus.FORBIDDEN,
                    message: QUESTIONS_MESSAGE.USER_NOT_THE_SURVEY_CREATOR,
                    error: 'Forbidden',
                },
            },
        }),
        ApiNotFoundResponse({
            description: 'Вопрос не найден',
            schema: {
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: QUESTIONS_MESSAGE.QUESTION_NOT_FOUND,
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
                        "Поле 'text' не может быть пустым",
                        "Поле 'text' должно быть строкой",
                        "Поле 'orderNum' обязательно",
                        'Вариант ответа с таким текстом уже существует для этого вопроса',
                    ],
                    error: 'Bad Request',
                },
            },
        }),
        ApiTooManyRequestsResponse({
            description: 'Превышен лимит запросов',
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
