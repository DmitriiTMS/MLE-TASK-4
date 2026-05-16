import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePollDto {

    @MaxLength(255, {
        message: "Максимальная длина поля 'title' не может быть больше 255 символов",
    })
    @IsNotEmpty({ message: "Поле 'title' не может быть пустым" })
    title: string;

    @MaxLength(3000, { message: "Максимальная длина поля 'description' не может быть больше 3000 символов" })
    @IsString({ message: "Поле 'description' должно быть строкой" })
    @IsOptional()
    description?: string;

    @IsOptional()
    @IsBoolean({ message: "Поле 'isActive' должно быть булевым значением" })
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    isActive?: boolean;
}
