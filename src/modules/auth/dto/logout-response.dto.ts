import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
    @ApiProperty({
        example: 'Logged out successfully',
        description: 'Сообщение о успешном выходе из системы',
    })
    message: string;
}
