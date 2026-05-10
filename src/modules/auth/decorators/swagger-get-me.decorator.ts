import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiOperation,
    ApiOkResponse,
    ApiUnauthorizedResponse,
    ApiNotFoundResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto';
import { GetMeResponseDto } from '../dto/get-me-response.dto';
import { UnauthorizedErrorDto } from '../dto/unauthorized-error.dto';

export function ApiGetMeDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Получение профиля текущего пользователя',
            description: `
                Возвращает информацию о текущем авторизованном пользователе.
                
                Особенности:
                - Требует валидный JWT токен в заголовке Authorization
                - Возвращает только базовую информацию пользователя (id, name, email)
                - Используется для получения данных текущего сеанса
                - Поле password исключено из ответа по соображениям безопасности
                
                Требования к авторизации:
                - Токен должен быть передан в формате: Bearer <token>
                - Токен должен быть не истекшим
                - Пользователь должен существовать в системе
            `,
        }),
        ApiBearerAuth(),
        ApiOkResponse({
            description: 'Успешное получение профиля пользователя',
            type: GetMeResponseDto,
            example: {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@example.com',
            },
        }),
        ApiUnauthorizedResponse({
            description: 'Не авторизован. Отсутствует или невалидный JWT токен',
            type: UnauthorizedErrorDto,
            examples: {
                no_token: {
                    summary: 'Отсутствует токен',
                    value: {
                        statusCode: HttpStatus.UNAUTHORIZED,
                        message: 'Unauthorized',
                        error: 'Unauthorized',
                    },
                },
                invalid_token: {
                    summary: 'Невалидный токен',
                    value: {
                        statusCode: HttpStatus.UNAUTHORIZED,
                        message: 'Invalid token',
                        error: 'Unauthorized',
                    },
                },
                expired_token: {
                    summary: 'Истекший токен',
                    value: {
                        statusCode: HttpStatus.UNAUTHORIZED,
                        message: 'Token expired',
                        error: 'Unauthorized',
                    },
                },
            },
        }),
        ApiNotFoundResponse({
            description: 'Пользователь не найден в системе',
            type: ErrorResponseDto,
            example: {
                statusCode: HttpStatus.NOT_FOUND,
                message: 'User not found',
                error: 'Not Found',
            },
        }),
    );
}
