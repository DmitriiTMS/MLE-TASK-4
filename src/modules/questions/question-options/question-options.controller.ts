import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Inject,
    Logger,
    Param,
    ParseIntPipe,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/utils/jwt/jwt-auth.guard';
import { OPTIONS_INJECTION_TOKENS } from './constants/option-injection-tokens';
import { ICreateOptioData, ICreateOptionResponseData } from './constants/types';
import { CreateOptionDto } from './dto/create-question-option.dto';
import type { IQuestionOptionsService } from './question-options.service.interface';
import { QuestionOptionEntity } from './domain/question-options.entity';


@ApiTags('Варианты ответов')
@Controller('question/:questionId/option')
@UseGuards(JwtAuthGuard)
export class QuestionOptionsController {
    private readonly context = QuestionOptionsController.name;

    constructor(
        private readonly logger: Logger,
        @Inject(OPTIONS_INJECTION_TOKENS.IOPTIONS_SERVICE)
        private readonly questionOptionsService: IQuestionOptionsService,
    ) { }

    @Post()
    @UseGuards(ThrottlerGuard)
    @HttpCode(HttpStatus.CREATED)
    async createOption(
        @CurrentUser() user: { id: number },
        @Param('questionId', ParseIntPipe) questionId: number,
        @Body() createOptionDto: CreateOptionDto,
    ): Promise<ICreateOptionResponseData> {
        const method = 'POST';
        const route = `question/${questionId}/option`;

        const data: ICreateOptioData = {
            userId: user.id,
            questionId,
            createOptionDto,
        };

        try {
            const option = await this.questionOptionsService.createOption(data);
            this.logger.log(
                `[${this.context}] - Option successfully PollId: ${option.id}`,
            );
            return QuestionOptionEntity.toResponse(option)
        } catch (error) {
            this.logError(error, method, route);
            throw error;
        }
    }

    private logError(error: unknown, method: string, route: string, context?: any): void {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;

        this.logger.error(
            `[${this.context}] - Request failed - Method: ${method}, Route: ${route}, ` +
            `Context: ${JSON.stringify(context)}, Error: ${errorMessage}`,
        );

        if (errorStack && process.env.NODE_ENV !== 'production') {
            this.logger.warn(`[${this.context}] - Stack trace: ${errorStack}`);
        }
    }
}
