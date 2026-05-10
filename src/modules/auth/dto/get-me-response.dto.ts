import { ApiProperty } from '@nestjs/swagger';

export class GetMeResponseDto {
    @ApiProperty({
        example: 1,
        description: 'Уникальный идентификатор пользователя',
        minimum: 1,
    })
    id: number;

    @ApiProperty({
        example: 'Anton',
        description: 'Имя пользователя',
        minLength: 1,
        maxLength: 255,
    })
    name: string;

    @ApiProperty({
        example: 'user@example.com',
        description: 'Email пользователя',
        format: 'email',
    })
    email: string;
}
