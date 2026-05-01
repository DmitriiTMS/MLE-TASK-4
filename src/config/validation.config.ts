import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import { ApplicationConfig } from './app.config';
import { Logger } from '@nestjs/common';

function formatErrors(errors: ValidationError[]): string {
    return errors.map(error => {
        if (error.constraints) {
            return `${error.property}: ${Object.values(error.constraints).join(', ')}`;
        }
        if (error.children && error.children.length) {
            return formatErrors(error.children);
        }
        return '';
    }).filter(Boolean).join('\n');
}

export function validateConfig(config: Record<string, unknown>) {
    Logger.log('🔍 Валидация конфигурации...')

    const validatedConfig = plainToInstance(ApplicationConfig, config, {
        enableImplicitConversion: true,
    });

    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
        validationError: { target: false, value: true },
        forbidUnknownValues: true,
    });

    if (errors.length > 0) {
        const errorMessage = formatErrors(errors);
        console.error('❌ Ошибки валидации:\n', errorMessage);
        throw new Error(`Config validation error:\n${errorMessage}`);
    }

    Logger.log('✅ Конфигурация валидна')
    return validatedConfig;
}