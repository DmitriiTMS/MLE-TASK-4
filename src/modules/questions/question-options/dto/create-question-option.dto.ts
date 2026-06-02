import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class CreateOptionDto {
    @ApiProperty({
        description: 'Текст варианта ответа',
        example: 'JavaScript',
        maxLength: 2000,
        required: true,
        type: String,
    })
    @IsString({ message: "Поле 'text' должно быть строкой" })
    @MaxLength(2000, {
        message: "Максимальная длина поля 'text' не может быть больше 2000 символов",
    })
    @IsNotEmpty({ message: "Поле 'text' не может быть пустым" })
    text: string;

    @ApiProperty({
        description: 'Порядковый номер варианта ответа (начиная с 1)',
        example: 1,
        minimum: 1,
        required: true,
        type: Number,
    })
    @IsNumber({}, { message: "Поле 'orderNum' должно быть числом" })
    @IsNotEmpty({ message: "Поле 'orderNum' не может быть пустым" })
    @Min(1, { message: "Поле 'orderNum' должно быть больше 0" })
    @IsInt({ message: "Поле 'orderNum' должно быть целым числом" })
    orderNum: number;
}
