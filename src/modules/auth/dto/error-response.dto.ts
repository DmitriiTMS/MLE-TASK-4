import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
    @ApiProperty({ example: 409, description: 'HTTP статус код' })
    statusCode: number;

    @ApiProperty({ example: 'User already exists', description: 'Сообщение об ошибке' })
    message: string;

    @ApiProperty({ example: 'Conflict', description: 'Тип ошибки' })
    error: string;
}
