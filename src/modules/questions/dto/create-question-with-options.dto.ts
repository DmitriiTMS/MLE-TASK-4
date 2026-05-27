import { Type } from 'class-transformer';
import {
    IsArray,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsString,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';

export enum QuestionType {
    SINGLE = 'single',
    MULTIPLE = 'multiple',
}

class CreateOptionDto {
    @IsString({ message: "Поле 'text' должно быть строкой" })
    @MaxLength(2000, {
        message: "Максимальная длина поля 'text' не может быть больше 2000 символов",
    })
    @IsNotEmpty({ message: "Поле 'text' не может быть пустым" })
    text: string;

    @IsNumber({}, { message: "Поле 'orderNum' должно быть числом" })
    @IsNotEmpty({ message: "Поле 'orderNum' не может быть пустым" })
    @Min(1, { message: "Поле 'orderNum' должно быть больше 0" })
    @IsInt({ message: "Поле 'orderNum' должно быть целым числом" })
    orderNum: number;
}

export class CreateQuestionWithOptionsDto {
    @IsString({ message: "Поле 'text' должно быть строкой" })
    @MaxLength(1000, {
        message: "Максимальная длина поля 'text' не может быть больше 1000 символов",
    })
    @IsNotEmpty({ message: "Поле 'text' не может быть пустым" })
    text: string;

    @IsEnum(QuestionType, {
        message: "Поле 'type' должно быть одним из допустимых значений: single или multiple",
    })
    @IsNotEmpty({ message: "Поле 'type' не может быть пустым" })
    type: QuestionType;

    @IsInt({ message: "Поле 'orderNum' должно быть целым числом" })
    @IsNotEmpty({ message: "Поле 'orderNum' не может быть пустым" })
    @Min(0, { message: "Поле 'orderNum' должно быть не меньше 0" })
    orderNum: number;

    @IsArray({ message: "Поле 'options' должно быть массивом" })
    @ValidateNested({
        each: true,
        message: 'Каждый элемент options должен быть валидным объектом OptionDto',
    })
    @Type(() => CreateOptionDto)
    @IsNotEmpty({ message: "Поле 'options' не может быть пустым" })
    options: CreateOptionDto[];
}
