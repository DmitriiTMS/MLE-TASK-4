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
    ApiParam,
} from '@nestjs/swagger';
import { CreateAnswerDto } from '../../dto/create-answer.dto';


export function ApiCreateAnswerDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Создание ответа пользователя на вопрос опроса',
            description: `
Сохраняет ответ пользователя на конкретный вопрос опроса.

**Требования:**
- Пользователь должен быть авторизован
- pollId должен быть валидным числом и существовать в базе
- questionId должен быть валидным числом и существовать в базе
- questionOptionIds должен содержать минимум один вариант ответа
- Каждый ID варианта ответа должен быть положительным числом

**Процесс создания:**
1. Проверяется существование опроса
2. Проверяется существование вопроса
3. Проверяется существование выбранных вариантов ответов
4. Проверяется, что варианты ответов принадлежат указанному вопросу
5. Сохраняется ответ пользователя
6. Возвращается статус сохранения

**Примечания:**
- Пользователь может ответить на один вопрос только один раз
- При повторной попытке ответа обновляется существующий ответ
            `,
        }),
        ApiParam({
            name: 'pollId',
            type: Number,
            description: 'ID опроса, на который отвечает пользователь',
            example: 1,
            required: true,
        }),
        ApiBody({
            type: CreateAnswerDto,
            description: 'Данные для создания ответа',
            examples: {
                singleChoice: {
                    summary: 'Выбор одного варианта',
                    description: 'Для вопросов с одним правильным ответом',
                    value: {
                        questionId: 10,
                        questionOptionIds: [5],
                    },
                },
                multipleChoice: {
                    summary: 'Выбор нескольких вариантов',
                    description: 'Для вопросов с множественным выбором',
                    value: {
                        questionId: 10,
                        questionOptionIds: [5, 7, 9],
                    },
                },
            },
        }),
        ApiBearerAuth(),
        ApiCreatedResponse({
            description: 'Ответ успешно сохранен',
            schema: {
                example: {
                    userAnswerSave: true,
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
                        "Поле 'questionId' должно быть числом",
                        "Поле 'questionId' не может быть пустым",
                        "Поле 'questionId' должно быть больше 0",
                        "Поле 'questionId' должно быть целым числом",
                        "Поле 'questionOptionIds' должно быть массивом",
                        "Массив questionOptionIds не может быть пустым",
                        "Должен быть выбран хотя бы один вариант",
                        "Каждый ID варианта должен быть целым числом",
                        "Каждый ID варианта должен быть больше 0",
                    ],
                    error: 'Bad Request',
                },
            },
        }),
        ApiNotFoundResponse({
            description: 'Ресурс не найден',
            schema: {
                oneOf: [
                    {
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            message: 'Опрос не найден',
                            error: 'Not Found',
                        },
                    },
                    {
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            message: 'Вопрос не найден',
                            error: 'Not Found',
                        },
                    },
                    {
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            message: 'Вариант ответа не найден',
                            error: 'Not Found',
                        },
                    },
                ],
            },
        }),
    );
}