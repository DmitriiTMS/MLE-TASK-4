// documentation/update-question-documentation.decorator.ts
import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiOkResponse,
    ApiUnauthorizedResponse,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiParam,
} from '@nestjs/swagger';
import { UpdateQuestionWithOptionsDto } from '../../dto/update-question-with-options.dto';
import { ResponseQuestionDto } from '../../constants/types';
import { POLLS_MESSAGE } from '../../../polls/constants/types.message';
import { QUESTIONS_MESSAGE } from '../../constants/types.messages';

export function ApiUpdateQuestionDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Обновление вопроса',
            description: `
Обновляет существующий вопрос и его варианты ответов.

**Требования:**
- Пользователь должен быть авторизован
- Пользователь должен быть владельцем опроса
- Все поля опциональны (можно обновить только необходимые поля)
- При обновлении options, обновляются существующие варианты
- Старые варианты, не переданные в запросе, остаются без изменений

**Процесс обновления:**
1. Проверяется существование опроса
2. Проверяется, что пользователь является владельцем опроса
3. Проверяется существование вопроса
4. Обновляются переданные поля вопроса
5. Обновляются переданные варианты ответов
6. Возвращается обновленный вопрос с вариантами

**Примечания:**
- Для обновления только части полей, остальные поля можно не передавать
- Порядок вопросов и вариантов можно изменить через orderNum
- Тип вопроса можно изменить с 'single' на 'multiple' и наоборот
            `,
        }),
        ApiParam({
            name: 'pollId',
            description: 'ID опроса',
            example: 1,
            type: Number,
            required: true,
        }),
        ApiParam({
            name: 'questionId',
            description: 'ID вопроса для обновления',
            example: 1,
            type: Number,
            required: true,
        }),
        ApiBody({
            type: UpdateQuestionWithOptionsDto,
            description: 'Данные для обновления вопроса (все поля опциональны)',
            examples: {
                full_update: {
                    summary: 'Полное обновление',
                    description: 'Обновление всех полей вопроса',
                    value: {
                        text: 'Обновленный текст вопроса',
                        type: 'multiple',
                        orderNum: 5,
                        options: [
                            { text: 'Обновленный вариант 1', orderNum: 1 },
                            { text: 'Обновленный вариант 2', orderNum: 2 },
                            { text: 'Новый вариант 3', orderNum: 3 },
                        ],
                    },
                },
                partial_update_text: {
                    summary: 'Частичное обновление',
                    description: 'Обновление только текста вопроса',
                    value: {
                        text: 'Новый текст вопроса',
                    },
                },
                update_order: {
                    summary: 'Изменение порядка',
                    description: 'Обновление только порядка вопроса',
                    value: {
                        orderNum: 10,
                    },
                },
                change_type: {
                    summary: 'Изменение типа',
                    description: 'Изменение типа вопроса с одиночного на множественный',
                    value: {
                        type: 'multiple',
                    },
                },
                update_options: {
                    summary: 'Обновление вариантов',
                    description: 'Обновление только вариантов ответов',
                    value: {
                        options: [
                            { text: 'Новый вариант 1', orderNum: 1 },
                            { text: 'Новый вариант 2', orderNum: 2 },
                        ],
                    },
                },
            },
        }),
        ApiBearerAuth(),
        ApiOkResponse({
            description: 'Вопрос успешно обновлен',
            type: ResponseQuestionDto,
            schema: {
                example: {
                    id: 1,
                    pollId: 1,
                    text: 'Обновленный текст вопроса',
                    type: 'multiple',
                    orderNum: 5,
                    questionOptions: [
                        { id: 1, questionId: 1, text: 'Обновленный вариант 1', orderNum: 1 },
                        { id: 2, questionId: 1, text: 'Обновленный вариант 2', orderNum: 2 },
                        { id: 3, questionId: 1, text: 'Новый вариант 3', orderNum: 3 },
                    ],
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
            description: 'Доступ запрещен (пользователь не владелец опроса)',
            schema: {
                example: {
                    statusCode: HttpStatus.FORBIDDEN,
                    message: POLLS_MESSAGE.SURVEY_NOT_AVAILABLE,
                    error: 'Forbidden',
                },
            },
        }),
        ApiNotFoundResponse({
            description: 'Опрос или вопрос не найден',
            schema: {
                examples: {
                    pollNotFound: {
                        summary: 'Опрос не найден',
                        value: {
                            statusCode: HttpStatus.NOT_FOUND,
                            message: POLLS_MESSAGE.POLL_NOT_FOUND,
                            error: 'Not Found',
                        },
                    },
                    questionNotFound: {
                        summary: 'Вопрос не найден',
                        value: {
                            statusCode: HttpStatus.NOT_FOUND,
                            message: QUESTIONS_MESSAGE.QUESTION_NOT_FOUND,
                            error: 'Not Found',
                        },
                    },
                },
            },
        }),
        ApiBadRequestResponse({
            description: 'Ошибка валидации входных данных',
            schema: {
                example: {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: [
                        "Поле 'orderNum' должно быть целым числом",
                        "Поле 'type' должно быть одним из допустимых значений: single или multiple",
                    ],
                    error: 'Bad Request',
                },
            },
        }),
    );
}