import { ArrayMinSize, ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsNumber, Min } from "class-validator"

export class CreateAnswerDto {

    @IsNumber({}, { message: "Поле 'questionId' должно быть числом" })
    @IsNotEmpty({ message: "Поле 'questionId' не может быть пустым" })
    @Min(1, { message: "Поле 'questionId' должно быть больше 0" })
    @IsInt({ message: "Поле 'questionId' должно быть целым числом" })
    questionId: number

    @IsArray({ message: "Поле 'questionOptionIds' должно быть массивом" })
    @ArrayNotEmpty({ message: "Массив questionOptionIds не может быть пустым" })
    @ArrayMinSize(1, { message: "Должен быть выбран хотя бы один вариант" })
    @IsInt({ each: true, message: "Каждый ID варианта должен быть целым числом" })
    @Min(1, { each: true, message: "Каждый ID варианта должен быть больше 0" })
    questionOptionIds: number[]
}