import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiOperation,
    ApiOkResponse,
    ApiUnauthorizedResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { LogoutResponseDto } from '../dto/logout-response.dto';
import { UnauthorizedErrorDto } from '../dto/unauthorized-error.dto';

export function ApiLogoutDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Выход из системы',
            description: `
                Завершение сессии пользователя и очистка refresh token.
                
                Процесс выхода из системы:
                1. Проверка валидности access token (через JwtAuthGuard)
                2. Очистка refresh token из httpOnly cookie
                3. Логирование действия пользователя
                4. Возврат подтверждения об успешном выходе
                
                Особенности:
                - Требует валидный access token в заголовке Authorization
                - Refresh token в cookie полностью удаляется (clearCookie)
                - После выхода access token становится недействительным
                - Клиент должен удалить access token из своего хранилища
                - Для повторного доступа потребуется повторная авторизация
                
                Безопасность:
                - Даже если access token скомпрометирован, выход очищает refresh token
                - Рекомендуется вызывать logout при завершении работы пользователя
                - Очищает все токены на серверной стороне
            `,
        }),
        ApiBearerAuth(),
        ApiOkResponse({
            description: 'Успешный выход из системы. Refresh token очищен, сессия завершена.',
            type: LogoutResponseDto,
            headers: {
                'Set-Cookie': {
                    description: 'Очистка refresh token из cookie',
                    schema: {
                        type: 'string',
                        example: 'refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
                    },
                },
            },
            content: {
                'application/json': {
                    examples: {
                        success: {
                            summary: 'Успешный выход',
                            value: {
                                message: 'Logged out successfully',
                            },
                        },
                    },
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: 'Ошибка авторизации. Отсутствует или невалидный access token.',
            type: UnauthorizedErrorDto,
            content: {
                'application/json': {
                    examples: {
                        no_token: {
                            summary: 'Отсутствует access token',
                            value: {
                                statusCode: HttpStatus.UNAUTHORIZED,
                                message: 'Unauthorized',
                                error: 'Unauthorized',
                            },
                        },
                        invalid_token: {
                            summary: 'Невалидный access token',
                            value: {
                                statusCode: HttpStatus.UNAUTHORIZED,
                                message: 'Invalid token',
                                error: 'Unauthorized',
                            },
                        },
                        expired_token: {
                            summary: 'Истекший access token',
                            value: {
                                statusCode: HttpStatus.UNAUTHORIZED,
                                message: 'Token expired',
                                error: 'Unauthorized',
                            },
                        },
                    },
                },
            },
        }),
    );
}
