import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
    .setTitle('Система голосований')
    .setDescription(
        `Платформа для создания 
    и участия в опросах или голосованиях. Пользователи могут 
    создавать опросы с разными типами вопросов (мультивыбор, одиночный выбор),
    а другие могут голосовать.`,
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
