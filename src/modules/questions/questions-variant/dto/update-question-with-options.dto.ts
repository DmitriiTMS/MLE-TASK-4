import { ApiPropertyOptional } from '@nestjs/swagger';
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
import { QuestionType } from '../constants/question-type.enum';

class UpdateOptionDto {
    @ApiPropertyOptional({
        description: 'Текст варианта ответа',
        example: 'JavaScript/TypeScript',
        maxLength: 2000,
        type: String,
    })
    @IsOptional()
    @IsString({ message: "Поле 'text' должно быть строкой" })
    @MaxLength(2000, {
        message: "Максимальная длина поля 'text' не может быть больше 2000 символов",
    })
    text: string;

    @ApiPropertyOptional({
        description: 'Порядковый номер варианта ответа (начиная с 1)',
        example: 1,
        minimum: 1,
        type: Number,
    })
    @IsOptional()
    @IsNumber({}, { message: "Поле 'orderNum' должно быть числом" })
    @Min(1, { message: "Поле 'orderNum' должно быть больше 0" })
    @IsInt({ message: "Поле 'orderNum' должно быть целым числом" })
    orderNum: number;
}

export class UpdateQuestionWithOptionsDto {
    @ApiPropertyOptional({
        description: 'Текст вопроса',
        example: 'Какой язык программирования вам нравится больше всего? (Обновленный вопрос)',
        maxLength: 1000,
        type: String,
    })
    @IsOptional()
    @IsString({ message: "Поле 'text' должно быть строкой" })
    @MaxLength(1000, {
        message: "Максимальная длина поля 'text' не может быть больше 1000 символов",
    })
    text: string;

    @ApiPropertyOptional({
        description: 'Тип вопроса',
        enum: QuestionType,
        example: QuestionType.MULTIPLE,
        enumName: 'QuestionType',
    })
    @IsOptional()
    @IsEnum(QuestionType, {
        message: "Поле 'type' должно быть одним из допустимых значений: single или multiple",
    })
    type: QuestionType;

    @ApiPropertyOptional({
        description: 'Порядковый номер вопроса (начиная с 0)',
        example: 1,
        minimum: 0,
        type: Number,
    })
    @IsOptional()
    @IsInt({ message: "Поле 'orderNum' должно быть целым числом" })
    @Min(0, { message: "Поле 'orderNum' должно быть не меньше 0" })
    orderNum: number;

    @ApiPropertyOptional({
        description:
            'Список вариантов ответов (будет произведено обновление существующих вариантов)',
        type: [UpdateOptionDto],
        example: [
            { text: 'JavaScript/TypeScript', orderNum: 1 },
            { text: 'Python', orderNum: 2 },
            { text: 'Rust', orderNum: 3 },
        ],
    })
    @IsOptional()
    @IsArray({ message: "Поле 'options' должно быть массивом" })
    @ValidateNested({
        each: true,
        message: 'Каждый элемент options должен быть валидным объектом OptionDto',
    })
    @Type(() => UpdateOptionDto)
    options: UpdateOptionDto[];
}
