import { ApiProperty } from '@nestjs/swagger';

export class UnauthorizedErrorDto {
    @ApiProperty({
        example: 401,
        description: 'HTTP статус код',
    })
    statusCode: number;

    @ApiProperty({
        example: 'Unauthorized',
        description: 'Сообщение об ошибке',
    })
    message: string;

    @ApiProperty({
        example: 'Unauthorized',
        description: 'Тип ошибки',
    })
    error: string;
}
