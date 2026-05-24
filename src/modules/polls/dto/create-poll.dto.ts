import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePollDto {
    @ApiProperty({
        description: 'Название опроса',
        example: 'Мой первый опрос',
        maxLength: 255,
        required: true,
        type: String,
    })
    @MaxLength(255, {
        message: "Максимальная длина поля 'title' не может быть больше 255 символов",
    })
    @IsNotEmpty({ message: "Поле 'title' не может быть пустым" })
    title: string;

    @ApiPropertyOptional({
        description: 'Описание опроса (необязательное поле)',
        example: 'Это опрос о важных вещах в нашей компании',
        maxLength: 3000,
        required: false,
        type: String,
        nullable: true,
    })
    @MaxLength(3000, {
        message: "Максимальная длина поля 'description' не может быть больше 3000 символов",
    })
    @IsString({ message: "Поле 'description' должно быть строкой" })
    @IsOptional()
    description?: string;
}
