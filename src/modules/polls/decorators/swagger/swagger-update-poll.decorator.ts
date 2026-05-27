import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiOperation,
    ApiParam,
    ApiBody,
    ApiOkResponse,
    ApiNotFoundResponse,
    ApiForbiddenResponse,
    ApiUnauthorizedResponse,
    ApiBadRequestResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { PollResponse } from '../../constants/types';
import { POLLS_MESSAGE } from '../../constants/types.message';
import { UpdatePollDto } from '../../dto/update-poll.dto';

export function ApiUpdatePollDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Обновление опроса',
            description: `
Обновляет существующий опрос.

**Права доступа:**
- Только ВЛАДЕЛЕЦ опроса может его обновить

**Обновляемые поля:**
- title: название опроса (макс. 255 символов)
- description: описание опроса (макс. 3000 символов)
- isActive: статус активности (boolean)

**Процесс обновления:**
1. Проверка существования опроса
2. Проверка прав доступа (владелец)
3. Обновление указанных полей
4. Сохранение в базу данных
5. Обновление кэша опроса
6. Инвалидация кэша списков опросов

**Кэширование:**
- Кэш конкретного опроса обновляется
- Все кэши списков опросов удаляются
            `,
        }),
        ApiParam({
            name: 'id',
            type: Number,
            required: true,
            example: 1,
            description: 'ID опроса для обновления',
            schema: {
                minimum: 1,
            },
        }),
        ApiBody({
            type: UpdatePollDto,
            description: 'Данные для обновления опроса (хотя бы одно поле обязательно)',
            examples: {
                updateTitle: {
                    summary: 'Обновить заголовок',
                    value: {
                        title: 'Новый заголовок опроса',
                    },
                },
                updateDescription: {
                    summary: 'Обновить описание',
                    value: {
                        description: 'Новое подробное описание опроса',
                    },
                },
                updateStatus: {
                    summary: 'Изменить статус',
                    value: {
                        isActive: false,
                    },
                },
                updateAll: {
                    summary: 'Обновить все поля',
                    value: {
                        title: 'Полностью обновленный опрос',
                        description: 'Новое описание',
                        isActive: true,
                    },
                },
            },
        }),
        ApiBearerAuth(),
        ApiOkResponse({
            description: 'Опрос успешно получен',
            type: PollResponse,
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
        ApiForbiddenResponse({
            description: 'Нет прав на обновление опроса',
            schema: {
                example: {
                    statusCode: HttpStatus.FORBIDDEN,
                    message: POLLS_MESSAGE.NO_UPDATE_PERMISSION,
                    error: 'Forbidden',
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
        ApiBadRequestResponse({
            description: 'Ошибка валидации входных данных',
            schema: {
                example: {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: [
                        'Максимальная длина поля "title" не может быть больше 255 символов',
                        'Максимальная длина поля "description" не может быть больше 3000 символов',
                        'Поле "isActive" должно быть булевым значением',
                    ],
                    error: 'Bad Request',
                },
            },
        }),
    );
}
