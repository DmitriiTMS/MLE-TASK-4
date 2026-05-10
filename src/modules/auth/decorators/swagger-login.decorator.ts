import { applyDecorators } from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiOkResponse,
    ApiUnauthorizedResponse,
    ApiBadRequestResponse,
    ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { LoginDto } from '../dto/login.dto';

export function ApiLoginDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Аутентификация пользователя',
            description: `
                Вход в систему существующего пользователя.
                
                Процесс аутентификации включает:
                1. Валидацию входных данных (email, пароль)
                2. Проверку существования пользователя в БД
                3. Верификацию пароля
                4. Генерацию JWT токенов (access + refresh)
                5. Установку refresh token в httpOnly cookie
                6. Возврат access token
            `,
        }),
        ApiBody({
            type: LoginDto,
            description: 'Учетные данные пользователя',
        }),
        ApiOkResponse({
            description:
                'Успешная аутентификация. Access token возвращается в теле ответа, refresh token установлен в httpOnly cookie.',
            type: LoginResponseDto,
            headers: {
                'Set-Cookie': {
                    description: 'Refresh token установлен в httpOnly cookie',
                    schema: {
                        type: 'string',
                        example:
                            'refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800',
                    },
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: 'Неверный email или пароль',
            type: ErrorResponseDto,
        }),
        ApiBadRequestResponse({
            description: 'Неверный формат входных данных',
        }),
        ApiTooManyRequestsResponse({
            description: 'Превышен лимит попыток входа. Попробуйте позже.',
        }),
    );
}
