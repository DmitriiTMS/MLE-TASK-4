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
import { CreateQuestionWithOptionsDto } from '../../dto/create-question-with-options.dto';
import { ResponseQuestionDto } from '../../constants/types';
import { QUESTIONS_MESSAGE } from '../../constants/types.messages';


export function ApiCreateQuestionDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Создание нового вопроса с вариантами ответов',
            description: `
Создает новый вопрос с вариантами ответов для указанного опроса.

**Требования:**
- Пользователь должен быть авторизован
- Пользователь должен быть владельцем опроса
- Поле text обязательно и не может быть пустым
- Максимальная длина text: 1000 символов
- Поле type обязательно (single или multiple)
- Поле orderNum обязательно (начиная с 0)
- Поле options обязательно, должно содержать хотя бы один вариант
- Каждый вариант должен иметь text (макс. 2000 символов) и orderNum (начиная с 1)

**Процесс создания:**
1. Проверяется существование опроса
2. Проверяется, что пользователь является владельцем опроса
3. Создается новый вопрос с вариантами ответов
4. Вопрос и варианты сохраняются в базу данных
5. Возвращается созданный вопрос с вариантами

**Примечания:**
- Для типа 'single' пользователь сможет выбрать только один вариант
- Для типа 'multiple' пользователь сможет выбрать несколько вариантов
- Порядок вопросов и вариантов определяется полем orderNum
            `,
        }),
        ApiParam({
            name: 'pollId',
            description: 'ID опроса, к которому добавляется вопрос',
            example: 1,
            type: Number,
            required: true,
        }),
        ApiBody({
            type: CreateQuestionWithOptionsDto,
            description: 'Данные для создания вопроса',
            examples: {
                single_choice: {
                    summary: 'Вопрос с одиночным выбором',
                    description: 'Создание вопроса, где можно выбрать только один вариант',
                    value: {
                        text: 'Какой язык программирования вы используете?',
                        type: 'single',
                        orderNum: 0,
                        options: [
                            { text: 'JavaScript', orderNum: 1 },
                            { text: 'Python', orderNum: 2 },
                            { text: 'Java', orderNum: 3 },
                            { text: 'TypeScript', orderNum: 4 },
                        ],
                    },
                },
                multiple_choice: {
                    summary: 'Вопрос с множественным выбором',
                    description: 'Создание вопроса, где можно выбрать несколько вариантов',
                    value: {
                        text: 'Какие технологии вы изучаете?',
                        type: 'multiple',
                        orderNum: 1,
                        options: [
                            { text: 'React', orderNum: 1 },
                            { text: 'Vue', orderNum: 2 },
                            { text: 'Angular', orderNum: 3 },
                            { text: 'Node.js', orderNum: 4 },
                        ],
                    },
                },
                minimal: {
                    summary: 'Минимальные данные',
                    description: 'Создание вопроса с минимальным количеством опций',
                    value: {
                        text: 'Вам понравился опрос?',
                        type: 'single',
                        orderNum: 2,
                        options: [
                            { text: 'Да', orderNum: 1 },
                            { text: 'Нет', orderNum: 2 },
                        ],
                    },
                },
            },
        }),
        ApiBearerAuth(),
        ApiCreatedResponse({
            description: 'Вопрос успешно создан',
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
                        { id: 4, questionId: 1, text: 'TypeScript', orderNum: 4 },
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
                    message: QUESTIONS_MESSAGE.USER_NOT_THE_SURVEY_CREATOR,
                    error: 'Forbidden',
                },
            },
        }),
        ApiNotFoundResponse({
            description: 'Опрос не найден',
            schema: {
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'Опрос не найден',
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
                        "Поле 'type' должно быть одним из допустимых значений: single или multiple",
                        "Поле 'options' должно содержать хотя бы один элемент",
                        "Поле 'options' не может быть пустым",
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