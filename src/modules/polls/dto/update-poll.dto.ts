import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePollDto {
    @MaxLength(255, {
        message: "Максимальная длина поля 'title' не может быть больше 255 символов",
    })
    @IsOptional()
    title?: string;

    @MaxLength(3000, {
        message: "Максимальная длина поля 'description' не может быть больше 3000 символов",
    })
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

    @IsOptional()
    @IsBoolean({ message: "Поле 'isPublic' должно быть булевым значением" })
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    isPublic?: boolean;
}
