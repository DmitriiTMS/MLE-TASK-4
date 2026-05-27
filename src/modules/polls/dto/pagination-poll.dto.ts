import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class PaginationDto {
    @ApiPropertyOptional({
        description: 'Номер страницы',
        example: 1,
        minimum: 1,
        default: 1,
        type: Number,
    })
    @Type(() => Number)
    @IsInt({ message: 'Поле page должно быть целым числом' })
    @Min(1, { message: 'page должен быть больше или равен 1' })
    @IsOptional()
    page: number = 1;

    @ApiPropertyOptional({
        description: 'Количество элементов на странице',
        example: 10,
        minimum: 1,
        maximum: 100,
        default: 10,
        type: Number,
    })
    @Type(() => Number)
    @IsInt({ message: 'Поле limit должно быть целым числом' })
    @Min(1, { message: 'limit должен быть больше или равен 1' })
    @Max(100, { message: 'limit не может быть больше 100' })
    @IsOptional()
    limit: number = 10;
}
