import { Type } from 'class-transformer';
import {
    IsArray,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';
import { QuestionType } from '../constants/types';

class UpdateOptionDto {
    @IsOptional()
    @IsString({ message: "Поле 'text' должно быть строкой" })
    @MaxLength(2000, {
        message: "Максимальная длина поля 'text' не может быть больше 2000 символов",
    })
    text: string;

    @IsOptional()
    @IsNumber({}, { message: "Поле 'orderNum' должно быть числом" })
    @Min(1, { message: "Поле 'orderNum' должно быть больше 0" })
    @IsInt({ message: "Поле 'orderNum' должно быть целым числом" })
    orderNum: number;
}

export class UpdateQuestionWithOptionsDto {

    @IsOptional()
    @IsString({ message: "Поле 'text' должно быть строкой" })
    @MaxLength(1000, {
        message: "Максимальная длина поля 'text' не может быть больше 1000 символов",
    })
    text: string;

    @IsOptional()
    @IsEnum(QuestionType, {
        message: "Поле 'type' должно быть одним из допустимых значений: single или multiple",
    })
    type: QuestionType;

    @IsOptional()
    @IsInt({ message: "Поле 'orderNum' должно быть целым числом" })
    @Min(0, { message: "Поле 'orderNum' должно быть не меньше 0" })
    orderNum: number;

    @IsOptional()
    @IsArray({ message: "Поле 'options' должно быть массивом" })
    @ValidateNested({
        each: true,
        message: 'Каждый элемент options должен быть валидным объектом OptionDto',
    })
    @Type(() => UpdateOptionDto)
    options: UpdateOptionDto[];
}
