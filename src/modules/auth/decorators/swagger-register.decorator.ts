import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiOperation,
    ApiBody,
    ApiTooManyRequestsResponse,
    ApiBadRequestResponse,
    ApiConflictResponse,
    ApiCreatedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto';
import { RegisterResponseDto } from '../dto/register-response.dto';
import { RegisterDto } from '../dto/register.dto';
import { AUTH_MESSAGE } from '../types/constants/types';

export function ApiRegisterDocumentation() {
    return applyDecorators(
        ApiOperation({
            summary: 'Регистрация пользователя',
            description: `
        Создание нового аккаунта пользователя.
        
        Процесс регистрации включает:
        1. Валидацию входных данных (имя, email, пароль)
        2. Проверку уникальности email
        3. Хеширование пароля
        4. Сохранение пользователя в БД
        5. Генерацию JWT токенов (access + refresh)
        6. Установку refresh token в httpOnly cookie
        7. Возврат access token
      `,
        }),
        ApiBody({
            type: RegisterDto,
            description: 'Данные для регистрации пользователя',
        }),
        ApiCreatedResponse({
            description:
                'Пользователь успешно зарегистрирован. Access token возвращается в теле ответа, refresh token установлен в httpOnly cookie.',
            type: RegisterResponseDto,
            headers: {
                'Set-Cookie': {
                    description: 'Refresh token установлен в cookie',
                    schema: {
                        type: 'string',
                        example:
                            'refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800',
                    },
                },
            },
        }),
        ApiConflictResponse({
            description: 'Пользователь с таким email уже существует',
            type: ErrorResponseDto,
            example: {
                statusCode: HttpStatus.CONFLICT,
                message: AUTH_MESSAGE.USER_EXIST,
                error: 'ConflictException',
            },
        }),
        ApiBadRequestResponse({
            description: 'Неверные входные данные (некорректный email, слабый пароль и т.д.)',
            schema: {
                example: {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: [
                        'Поле "email" не соответствует формату email',
                        'Минимальная длина поля "password должна быть 4 символов, максимальная - 8',
                    ],
                    error: 'Bad Request',
                },
            },
        }),
        ApiTooManyRequestsResponse({
            description: 'Слишком много запросов с этого IP (при использовании ThrottlerGuard)',
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
