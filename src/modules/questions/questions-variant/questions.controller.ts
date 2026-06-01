import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Logger,
    Param,
    ParseIntPipe,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/utils/jwt/jwt-auth.guard';
import { PollWithQuestions } from '../../polls/constants/types';
import { PollEntity } from '../../polls/domain/polls.entity';
import { QUESTIONS_INJECTION_TOKENS } from './constants/questions-injection-tokens';
import { DataRequestQuestionDto, ResponseQuestionDto } from './constants/types';
import { ApiCreateQuestionDocumentation } from './decorators/swagger/create-questions.decorator';
import { ApiDeleteQuestionDocumentation } from './decorators/swagger/delete-question-documentation.decorator';
import { ApiFindPollQuestionsDocumentation } from './decorators/swagger/find-poll-questions-documentation.decorator';
import { ApiFindQuestionDocumentation } from './decorators/swagger/find-question-documentation.decorator';
import { ApiUpdateQuestionDocumentation } from './decorators/swagger/update-question-documentation.decorator';
import { QuestionEntity } from './domain/questions.entity';
import { CreateQuestionWithOptionsDto } from './dto/create-question-with-options.dto';
import { UpdateQuestionWithOptionsDto } from './dto/update-question-with-options.dto';
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
    @ApiCreateQuestionDocumentation()
    async createQuestionWithOptions(
        @CurrentUser() user: { id: number },
        @Param('pollId', ParseIntPipe) pollId: number,
        @Body() createQuestionDto: CreateQuestionWithOptionsDto,
    ): Promise<ResponseQuestionDto> {
        const method = 'POST';
        const route = `/polls/${pollId}/questions`;

        const data: DataRequestQuestionDto = {
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

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiFindPollQuestionsDocumentation()
    async findPollWithAllQuestions(
        @CurrentUser() user: { id: number },
        @Param('pollId', ParseIntPipe) pollId: number,
    ): Promise<PollWithQuestions> {
        const method = 'GET';
        const route = `/polls/${pollId}/questions`;

        this.logger.log(`[${this.context}] - Fetching all questions for poll`);

        try {
            const result = await this.questionsService.findPollWithAllQuestions(user.id, pollId);
            this.logger.log(
                `[${this.context}] - Poll with questions fetched successfully PollId: ${result.id}`,
            );
            return PollEntity.toResponsePollWithQuestions(result);
        } catch (error) {
            this.logError(error, method, route);
            throw error;
        }
    }

    @Get(':questionId')
    @HttpCode(HttpStatus.OK)
    @ApiFindQuestionDocumentation()
    async findQuestion(
        @CurrentUser() user: { id: number },
        @Param('pollId', ParseIntPipe) pollId: number,
        @Param('questionId', ParseIntPipe) questionId: number,
    ): Promise<ResponseQuestionDto> {
        const method = 'GET';
        const route = `/polls/${pollId}/questions/${questionId}`;

        this.logger.log(`[${this.context}] - fetching question`);

        const data: {
            userId: number;
            pollId: number;
            questionId: number;
        } = {
            userId: user.id,
            pollId,
            questionId,
        };

        try {
            const question = await this.questionsService.findQuestion(data);
            this.logger.log(
                `[${this.context}] - question fetched successfully QuestionId: ${question.id}`,
            );
            return QuestionEntity.toResponse(question);
        } catch (error) {
            this.logError(error, method, route);
            throw error;
        }
    }

    @Put(':questionId')
    @UseGuards(ThrottlerGuard)
    @HttpCode(HttpStatus.OK)
    @ApiUpdateQuestionDocumentation()
    async updateQuestion(
        @CurrentUser() user: { id: number },
        @Param('pollId', ParseIntPipe) pollId: number,
        @Param('questionId', ParseIntPipe) questionId: number,
        @Body() updateData: UpdateQuestionWithOptionsDto,
    ): Promise<ResponseQuestionDto> {
        const method = 'PUT';
        const route = `/polls/${pollId}/questions/${questionId}`;

        this.logger.log(`[${this.context}] - Updating question ${questionId}`);

        try {
            const question = await this.questionsService.updateQuestion({
                userId: user.id,
                pollId,
                questionId,
                updateData,
            });

            this.logger.log(`[${this.context}] - Question updated successfully: ${questionId}`);

            return QuestionEntity.toResponse(question);
        } catch (error) {
            this.logError(error, method, route);
            throw error;
        }
    }

    @Delete(':questionId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiDeleteQuestionDocumentation()
    async deleteQuestion(
        @CurrentUser() user: { id: number },
        @Param('pollId', ParseIntPipe) pollId: number,
        @Param('questionId', ParseIntPipe) questionId: number,
    ): Promise<void> {
        const method = 'DELETE';
        const route = `/polls/${pollId}/questions/${questionId}`;

        this.logger.log(`[${this.context}] - delete question`);

        const data: {
            userId: number;
            pollId: number;
            questionId: number;
        } = {
            userId: user.id,
            pollId,
            questionId,
        };

        try {
            await this.questionsService.deleteQuestionWithOptions(data);
            this.logger.log(
                `[${this.context}] - question delete successfully QuestionId: ${questionId}`,
            );
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
