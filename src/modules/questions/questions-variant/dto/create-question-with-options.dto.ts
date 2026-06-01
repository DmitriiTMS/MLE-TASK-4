import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsString,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';
import { CreateOptionDto } from '../../question-options/dto/create-question-option.dto';
import { QuestionType } from '../constants/question-type.enum';

export class CreateQuestionWithOptionsDto {
    @ApiProperty({
        description: 'Текст вопроса',
        example: 'Какой язык программирования вам нравится больше всего?',
        maxLength: 1000,
        required: true,
        type: String,
    })
    @IsString({ message: "Поле 'text' должно быть строкой" })
    @MaxLength(1000, {
        message: "Максимальная длина поля 'text' не может быть больше 1000 символов",
    })
    @IsNotEmpty({ message: "Поле 'text' не может быть пустым" })
    text: string;

    @ApiProperty({
        description: 'Тип вопроса',
        enum: QuestionType,
        example: QuestionType.SINGLE,
        required: true,
        enumName: 'QuestionType',
    })
    @IsEnum(QuestionType, {
        message: "Поле 'type' должно быть одним из допустимых значений: single или multiple",
    })
    @IsNotEmpty({ message: "Поле 'type' не может быть пустым" })
    type: QuestionType;

    @ApiProperty({
        description: 'Порядковый номер вопроса (начиная с 0)',
        example: 0,
        minimum: 0,
        required: true,
        type: Number,
    })
    @IsInt({ message: "Поле 'orderNum' должно быть целым числом" })
    @IsNotEmpty({ message: "Поле 'orderNum' не может быть пустым" })
    @Min(0, { message: "Поле 'orderNum' должно быть не меньше 0" })
    orderNum: number;

    @ApiProperty({
        description: 'Список вариантов ответов',
        type: [CreateOptionDto],
        required: true,
        minItems: 1,
        example: [
            { text: 'JavaScript', orderNum: 1 },
            { text: 'Python', orderNum: 2 },
            { text: 'Java', orderNum: 3 },
            { text: 'TypeScript', orderNum: 4 },
        ],
    })
    @IsArray({ message: "Поле 'options' должно быть массивом" })
    @ArrayMinSize(1, { message: "Поле 'options' должно содержать хотя бы один элемент" })
    @ValidateNested({
        each: true,
        message: 'Каждый элемент options должен быть валидным объектом OptionDto',
    })
    @Type(() => CreateOptionDto)
    @IsNotEmpty({ message: "Поле 'options' не может быть пустым" })
    options: CreateOptionDto[];
}
