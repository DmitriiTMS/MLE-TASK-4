// documentation/find-question-documentation.decorator.ts
import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiOperation,
    ApiOkResponse,
    ApiUnauthorizedResponse,
    ApiNotFoundResponse,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiParam,
} from '@nestjs/swagger';
import { POLLS_MESSAGE } from '../../../../polls/constants/types.message';
import { ResponseQuestionDto } from '../../constants/types';
import { QUESTIONS_MESSAGE } from '../../constants/types.messages';

export function ApiFindQuestionDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Получение конкретного вопроса',
            description: `
Возвращает конкретный вопрос с его вариантами ответов.

**Права доступа:**
- Владелец опроса видит любой вопрос своего опроса
- Другие пользователи видят вопросы только публичных опросов

**Процесс получения:**
1. Проверяется существование опроса
2. Проверяется существование вопроса в опросе
3. Проверяются права доступа
4. Возвращается вопрос с вариантами ответов

**Примечания:**
- Варианты ответов возвращаются в порядке возрастания orderNum
- Вопрос возвращается только если он принадлежит указанному опросу
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
            description: 'ID вопроса',
            example: 1,
            type: Number,
            required: true,
        }),
        ApiBearerAuth(),
        ApiOkResponse({
            description: 'Вопрос успешно получен',
            type: ResponseQuestionDto,
            schema: {
                example: {
                    id: 1,
                    pollId: 1,
                    text: 'Какой язык программирования вы используете?',
                    type: 'single',
                    orderNum: 0,
                    questionOptions: [
                        { id: 1, questionId: 1, text: 'JavaScript', orderNum: 1 },
                        { id: 2, questionId: 1, text: 'Python', orderNum: 2 },
                        { id: 3, questionId: 1, text: 'Java', orderNum: 3 },
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
            description: 'Доступ запрещен (опрос не публичный и пользователь не владелец)',
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
