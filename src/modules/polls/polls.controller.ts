import { Body, Controller, HttpCode, HttpStatus, Inject, Logger, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ThrottlerGuard } from "@nestjs/throttler";
import { JwtAuthGuard } from "../auth/utils/jwt/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CreatePollDto } from "./dto/create-poll.dto";
import type { IPollsService } from "./polls.service.interface";

@ApiTags('Опросы')
@Controller('polls')
export class PollsController {
    private readonly context = PollsController.name;

    constructor(
        private readonly logger: Logger,
        @Inject('IPollsService') private readonly authService: IPollsService,
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async create(
        @CurrentUser() user: { id: number },
        @Body() createDto: CreatePollDto,

    ) {
        try {
            this.logger.log("start");

            return await this.authService.create(user.id, createDto)
            
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error("error");
            throw error;
        }
    }
}