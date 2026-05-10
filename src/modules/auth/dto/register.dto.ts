import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
    @ApiProperty({
        example: 'Ivan',
        description: 'Имя пользователя',
        minLength: 1,
        maxLength: 255,
    })
    @MaxLength(255, { message: "Максимальная длина поля 'name' не может быть больше 255 символов" })
    @IsString({ message: "Поле 'name' должно быть строкой" })
    @IsNotEmpty({ message: "Поле 'name' не может быть пустым" })
    name: string;

    @ApiProperty({
        example: 'user@example.com',
        description: 'Email пользователя',
        format: 'email',
    })
    @MaxLength(255, {
        message: "Максимальная длина поля 'email' не может быть больше 255 символов",
    })
    @IsEmail({}, { message: "Поле 'email' не соответствует формату email" })
    @IsNotEmpty({ message: "Поле 'email' не может быть пустым" })
    email: string;

    @ApiProperty({
        example: 'Pass123',
        description: 'Пароль пользователя',
        minLength: 4,
        maxLength: 8,
        format: 'password',
    })
    @MaxLength(8, { message: "Максимальная длина поля 'password' не может быть больше 8 символов" })
    @MinLength(4, { message: "Минимальная длина поля 'password' должна быть 4 символов" })
    @IsString({ message: "Поле 'password' должно быть строкой" })
    @IsNotEmpty({ message: "Поле 'password' не может быть пустым" })
    password: string;
}
