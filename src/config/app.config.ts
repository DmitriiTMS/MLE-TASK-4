import { IsEnum, IsNotEmpty, IsString, Max, Min } from "class-validator";
import { Environment } from "./types/configurations.enums";
import { Transform, Type } from "class-transformer";

export class ApplicationConfig {

    @IsEnum(Environment, { always: true, message: 'NODE_ENV должно быть одним из [development, test, production]' })
    @IsNotEmpty({ always: true, message: 'NODE_ENV обязательно к заполнению' })
    NODE_ENV: Environment;

    @Min(1, { message: 'HTTP_PORT должен быть больше 0' })
    @Max(65535, { message: 'HTTP_PORT должен быть меньше 65536' })
    @IsNotEmpty({ always: true, message: 'HTTP_PORT обязательно к заполнению' })
    @Transform(({ value }) => parseInt(value, 10))
    @Type(() => Number)
    HTTP_PORT: number;

    @IsString({ always: true })
    @IsNotEmpty({ always: true, message: 'HTTP_HOST обязательно к заполнению' })
    HTTP_HOST: string;

    @IsString({ always: true })
    @IsNotEmpty({ always: true, message: 'HTTP_PREFIX обязательно к заполнению' })
    HTTP_PREFIX: string;

}