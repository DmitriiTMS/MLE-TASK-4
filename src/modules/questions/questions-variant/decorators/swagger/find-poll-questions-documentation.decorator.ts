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
import { PollWithQuestions } from '../../../../polls/constants/types';
import { POLLS_MESSAGE } from '../../../../polls/constants/types.message';

export function ApiFindPollQuestionsDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Получение всех вопросов опроса',
            description: `
Возвращает опрос со всеми его вопросами и вариантами ответов.

**Права доступа:**
- Владелец опроса видит все вопросы (даже если опрос неактивен)
- Другие пользователи видят вопросы только публичных опросов

**Процесс получения:**
1. Проверяется существование опроса
2. Проверяются права доступа (владелец или публичный опрос)
3. Загружаются все вопросы с вариантами ответов
4. Вопросы и варианты сортируются по orderNum
5. Возвращается структурированный ответ

**Примечания:**
- Вопросы возвращаются в порядке возрастания orderNum
- Варианты ответов возвращаются в порядке возрастания orderNum
- Для невладельцев возвращаются только публичные опросы
            `,
        }),
        ApiParam({
            name: 'pollId',
            description: 'ID опроса',
            example: 1,
            type: Number,
            required: true,
        }),
        ApiBearerAuth(),
        ApiOkResponse({
            description: 'Опрос с вопросами успешно получен',
            type: PollWithQuestions,
            schema: {
                example: {
                    id: 1,
                    title: 'Опрос о программировании',
                    description: 'Расскажите о своем опыте в программировании',
                    isActive: true,
                    isPublic: true,
                    questions: [
                        {
                            id: 1,
                            text: 'Какой язык программирования вы используете?',
                            type: 'single',
                            orderNum: 0,
                            questionOptions: [
                                { id: 1, text: 'JavaScript', orderNum: 1 },
                                { id: 2, text: 'Python', orderNum: 2 },
                                { id: 3, text: 'Java', orderNum: 3 },
                            ],
                        },
                        {
                            id: 2,
                            text: 'Какие технологии вы изучаете?',
                            type: 'multiple',
                            orderNum: 1,
                            questionOptions: [
                                { id: 4, text: 'React', orderNum: 1 },
                                { id: 5, text: 'Vue', orderNum: 2 },
                                { id: 6, text: 'Angular', orderNum: 3 },
                            ],
                        },
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
            description: 'Опрос недоступен (не публичный и пользователь не владелец)',
            schema: {
                example: {
                    statusCode: HttpStatus.FORBIDDEN,
                    message: POLLS_MESSAGE.SURVEY_NOT_AVAILABLE,
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
    );
}
