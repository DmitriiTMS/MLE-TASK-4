import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiOperation,
    ApiUnauthorizedResponse,
    ApiNotFoundResponse,
    ApiBearerAuth,
    ApiParam,
    ApiOkResponse,
} from '@nestjs/swagger';

export function ApiGetQuantityAnswersDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Получение статистики ответов по опросу',
            description: `
Возвращает детальную статистику ответов для указанного опроса.

**Требования:**
- Пользователь должен быть авторизован
- pollId должен быть валидным числом и существовать в базе

**Возвращаемые данные:**
Массив объектов, содержащих информацию о каждом ответе:
- pollId: ID опроса
- pollTitle: Название опроса
- questionId: ID вопроса
- questionText: Текст вопроса
- questionOptionId: ID выбранного варианта ответа
- optionText: Текст выбранного варианта
- count: Количество выборов данного варианта

**Примечания:**
- Статистика показывает количество выборов каждого варианта ответа
- Данные кэшируются для оптимизации производительности
- Возвращается плоский массив для удобства последующей агрегации
            `,
        }),
        ApiParam({
            name: 'pollId',
            type: Number,
            description: 'ID опроса для получения статистики',
            example: 1,
            required: true,
        }),
        ApiBearerAuth(),
        ApiOkResponse({
            description: 'Статистика успешно получена',
            schema: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        pollId: {
                            type: 'number',
                            description: 'ID опроса',
                            example: 1,
                        },
                        questionId: {
                            type: 'number',
                            description: 'ID вопроса',
                            example: 10,
                        },
                        questionOptionId: {
                            type: 'number',
                            description: 'ID варианта ответа',
                            example: 5,
                        },
                        pollTitle: {
                            type: 'string',
                            description: 'Название опроса',
                            example: 'Опрос о качестве обслуживания',
                        },
                        questionText: {
                            type: 'string',
                            description: 'Текст вопроса',
                            example: 'Как вы оцениваете качество обслуживания?',
                        },
                        optionText: {
                            type: 'string',
                            description: 'Текст варианта ответа',
                            example: 'Отлично',
                        },
                        count: {
                            type: 'number',
                            description: 'Количество выборов данного варианта',
                            example: 75,
                        },
                    },
                },
                example: [
                    {
                        pollId: 1,
                        pollTitle: 'Опрос о качестве обслуживания',
                        questionId: 10,
                        questionText: 'Как вы оцениваете качество обслуживания?',
                        questionOptionId: 5,
                        optionText: 'Отлично',
                        count: 75,
                    },
                    {
                        pollId: 1,
                        pollTitle: 'Опрос о качестве обслуживания',
                        questionId: 10,
                        questionText: 'Как вы оцениваете качество обслуживания?',
                        questionOptionId: 6,
                        optionText: 'Хорошо',
                        count: 45,
                    },
                    {
                        pollId: 1,
                        pollTitle: 'Опрос о качестве обслуживания',
                        questionId: 10,
                        questionText: 'Как вы оцениваете качество обслуживания?',
                        questionOptionId: 7,
                        optionText: 'Удовлетворительно',
                        count: 30,
                    },
                    {
                        pollId: 1,
                        pollTitle: 'Опрос о качестве обслуживания',
                        questionId: 11,
                        questionText: 'Как часто вы пользуетесь нашими услугами?',
                        questionOptionId: 8,
                        optionText: 'Ежедневно',
                        count: 50,
                    },
                    {
                        pollId: 1,
                        pollTitle: 'Опрос о качестве обслуживания',
                        questionId: 11,
                        questionText: 'Как часто вы пользуетесь нашими услугами?',
                        questionOptionId: 9,
                        optionText: 'Еженедельно',
                        count: 70,
                    },
                    {
                        pollId: 1,
                        pollTitle: 'Опрос о качестве обслуживания',
                        questionId: 11,
                        questionText: 'Как часто вы пользуетесь нашими услугами?',
                        questionOptionId: 10,
                        optionText: 'Ежемесячно',
                        count: 30,
                    },
                ],
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
        ApiNotFoundResponse({
            description: 'Опрос не найден или ответы отсутствуют',
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
                            message: 'Ответы на опрос не найдены',
                            error: 'Not Found',
                        },
                    },
                ],
            },
        }),
    );
}