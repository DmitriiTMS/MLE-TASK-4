import { Body, Controller, HttpCode, HttpStatus, Inject, Logger, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/utils/jwt/jwt-auth.guard";
import { ThrottlerGuard } from "@nestjs/throttler";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CreateAnswerDto } from "./dto/create-answer.dto";
import { IDataCreateAnswer } from "./constants/types";
import { USERS_ANSWERS_INJECTION_TOKENS } from "./constants/users-answers-injection-tokens";
import type { IUsersAnswersService } from "./users-answers.service.interface";

@ApiTags('Ответы пользователей')
@Controller('answers')
@UseGuards(JwtAuthGuard)
export class UsersAnswersController {
    private readonly context = UsersAnswersController.name;

    constructor(
        private readonly logger: Logger,
        @Inject(USERS_ANSWERS_INJECTION_TOKENS.IUSERS_ANSWERS_SERVICE)
        private readonly usersAnswersService: IUsersAnswersService,
    ) { }

    @Post(":pollId")
    @UseGuards(ThrottlerGuard)
    @HttpCode(HttpStatus.CREATED)
    async createAnswer(
        @CurrentUser() user: { id: number },
        @Param('pollId', ParseIntPipe) pollId: number,
        @Body() createAnswerDto: CreateAnswerDto,
    ) {

        const method = 'POST';
        const route = `/answers/${pollId}`;

        const data: IDataCreateAnswer = {
            userId: user.id,
            pollId,
            questionId: createAnswerDto.questionId,
            questionOptionIds: createAnswerDto.questionOptionIds
        }

        try {
            await this.usersAnswersService.createAnswer(data)
            this.logger.log(
                `[${this.context}] - Creating answers - User ID: ${user.id}`
            );
            return
        } catch (error: unknown) {
            this.logError(error, method, route,);
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