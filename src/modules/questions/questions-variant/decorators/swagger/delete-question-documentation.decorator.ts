// documentation/delete-question-documentation.decorator.ts
import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiOperation,
    ApiNoContentResponse,
    ApiUnauthorizedResponse,
    ApiNotFoundResponse,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiParam,
} from '@nestjs/swagger';

import { POLLS_MESSAGE } from '../../../../polls/constants/types.message';
import { QUESTIONS_MESSAGE } from '../../constants/types.messages';

export function ApiDeleteQuestionDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Удаление вопроса',
            description: `
Удаляет вопрос и все связанные с ним варианты ответов.

**Требования:**
- Пользователь должен быть авторизован
- Пользователь должен быть владельцем опроса

**Процесс удаления:**
1. Проверяется существование опроса
2. Проверяется, что пользователь является владельцем опроса
3. Проверяется существование вопроса в опросе
4. Удаляется вопрос (варианты ответов удаляются автоматически благодаря CASCADE)
5. Возвращается статус 204 No Content

**Примечания:**
- Удаление вопроса необратимо
- Все ответы пользователей на этот вопрос также будут удалены (если есть каскадное удаление)
- Варианты ответов удаляются автоматически благодаря CASCADE в базе данных
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
            description: 'ID вопроса для удаления',
            example: 1,
            type: Number,
            required: true,
        }),
        ApiBearerAuth(),
        ApiNoContentResponse({
            description: 'Вопрос успешно удален (не возвращает тела ответа)',
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
    );
}
