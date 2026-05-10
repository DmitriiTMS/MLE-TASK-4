import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiOperation,
    ApiOkResponse,
    ApiUnauthorizedResponse,
    ApiBody,
    ApiResponse,
} from '@nestjs/swagger';
import { RefreshTokenResponseDto } from '../dto/refresh-token-response.dto';

export function ApiRefreshTokenDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Обновление JWT токенов',
            description: `
                Обновление access и refresh токенов с использованием refresh token из cookies.
                
                Процесс обновления токенов:
                1. Извлечение refresh token из httpOnly cookie
                2. Валидация refresh token (проверка подписи и срока действия)
                3. Поиск пользователя в базе данных по ID из токена
                4. Генерация новой пары токенов (access + refresh)
                5. Обновление refresh token в cookie
                6. Возврат нового access token
                
                Особенности:
                - Refresh token должен находиться в cookie и иметь название 'refreshToken'
                - Старый refresh token автоматически аннулируется (заменяется новым)
                - При успешном обновлении возвращается новый access token
                - При любой ошибке refresh token в cookie очищается
                - Требуется валидный и неистекший refresh token
                
                Сценарии использования:
                - Клиент получает 401 Unauthorized при истекшем access token
                - Вызов этого эндпоинта для получения новой пары токенов
                - После успешного обновления повтор запроса с новым access token
            `,
        }),
        ApiBody({
            description: 'Тело запроса не требуется. Refresh token передается в cookie',
            required: false,
            schema: {
                type: 'object',
                example: {},
            },
        }),
        ApiOkResponse({
            description:
                'Токены успешно обновлены. Новый access token возвращен, refresh token обновлен в cookie.',
            type: RefreshTokenResponseDto,
            headers: {
                'Set-Cookie': {
                    description: 'Новый refresh token установлен в httpOnly cookie',
                    schema: {
                        type: 'string',
                        example:
                            'refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800',
                    },
                },
            },
            content: {
                'application/json': {
                    example: {
                        accessToken:
                            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTY5OTk5OTk5OSwiZXhwIjoxNzAwMDAzNTk5fQ.signature',
                    },
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: 'Ошибка обновления токенов',
            headers: {
                'Set-Cookie': {
                    description: 'При ошибке refresh token очищается из cookie',
                    schema: {
                        type: 'string',
                        example: 'refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
                    },
                },
            },
            content: {
                'application/json': {
                    examples: {
                        token_not_found: {
                            summary: 'Refresh token не найден в cookie',
                            value: {
                                statusCode: HttpStatus.UNAUTHORIZED,
                                message: 'Refresh token not found',
                                error: 'Unauthorized',
                            },
                        },
                        invalid_token: {
                            summary: 'Невалидный refresh token',
                            value: {
                                statusCode: HttpStatus.UNAUTHORIZED,
                                message: 'Invalid refresh token',
                                error: 'Unauthorized',
                            },
                        },
                        expired_token: {
                            summary: 'Истекший refresh token',
                            value: {
                                statusCode: HttpStatus.UNAUTHORIZED,
                                message: 'Refresh token expired',
                                error: 'Unauthorized',
                            },
                        },
                        user_not_found: {
                            summary: 'Пользователь не найден',
                            value: {
                                statusCode: HttpStatus.UNAUTHORIZED,
                                message: 'User not found',
                                error: 'Unauthorized',
                            },
                        },
                        invalid_signature: {
                            summary: 'Неверная подпись токена',
                            value: {
                                statusCode: HttpStatus.UNAUTHORIZED,
                                message: 'Invalid token signature',
                                error: 'Unauthorized',
                            },
                        },
                    },
                },
            },
        }),
        ApiResponse({
            status: HttpStatus.BAD_REQUEST,
            description: 'Неверный запрос (некорректный формат и т.д.)',
            schema: {
                example: {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Bad Request',
                    error: 'Bad Request',
                },
            },
        }),
    );
}
