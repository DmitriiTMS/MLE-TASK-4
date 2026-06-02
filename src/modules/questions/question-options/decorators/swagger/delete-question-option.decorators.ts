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
import { QUESTIONS_MESSAGE } from '../../../questions-variant/constants/types.messages';

export function ApiDeleteOptionDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Удаление варианта ответа',
            description: `
Удаляет существующий вариант ответа.

**Требования:**
- Пользователь должен быть авторизован
- Пользователь должен быть владельцем опроса (через вопрос)
- Вариант ответа должен существовать

**Процесс удаления:**
1. Проверяется существование вопроса
2. Проверяется существование варианта ответа
3. Проверяется, что пользователь является владельцем опроса
4. Удаляется вариант ответа из базы данных

**Примечания:**
- Удаление варианта ответа необратимо
- При удалении варианта ответа, порядок остальных вариантов не меняется
- Удаление варианта ответа не влияет на уже пройденные опросы
            `,
        }),
        ApiParam({
            name: 'questionId',
            description: 'ID вопроса, которому принадлежит вариант ответа',
            example: 1,
            type: Number,
            required: true,
        }),
        ApiParam({
            name: 'optionId',
            description: 'ID удаляемого варианта ответа',
            example: 1,
            type: Number,
            required: true,
        }),
        ApiBearerAuth(),
        ApiNoContentResponse({
            description: 'Вариант ответа успешно удален',
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
            description: 'Вариант ответа или вопрос не найдены',
            schema: {
                oneOf: [
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