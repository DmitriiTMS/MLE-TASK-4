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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/utils/jwt/jwt-auth.guard';
import { QUESTIONS_INJECTION_TOKENS } from './constants/questions-injection-tokens';
import { IDataRequestQuestion, IResponseQuestion } from './constants/types';
import { CreateQuestionWithOptionsDto } from './dto/create-question-with-options.dto';
import { QuestionEntity } from './entities/questions.entity';
import type { IQuestionsService } from './questions.service.interface';

@ApiTags('Вопросы')
@Controller('polls/:pollId/questions')
@UseGuards(JwtAuthGuard)
export class QuestionsController {
    private readonly context = QuestionsController.name;

    constructor(
        private readonly logger: Logger,
        @Inject(QUESTIONS_INJECTION_TOKENS.IQUESTIONS_SERVICE)
        private readonly questionsService: IQuestionsService,
    ) {}

    @Post()
    @UseGuards(ThrottlerGuard)
    @HttpCode(HttpStatus.CREATED)
    async createQuestionWithOptions(
        @CurrentUser() user: { id: number },
        @Param('pollId', ParseIntPipe) pollId: number,
        @Body() createQuestionDto: CreateQuestionWithOptionsDto,
    ): Promise<IResponseQuestion> {
        const method = 'POST';
        const route = `/polls/${pollId}/questions`;

        const data: IDataRequestQuestion = {
            userId: user.id,
            pollId,
            createQuestionDto,
        };
        try {
            const question = await this.questionsService.createQuestionWithOptions(data);
            return QuestionEntity.toResponse(question);
        } catch (error) {
            this.logError(error, method, route, { createQuestionDto });
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
