import { Inject, Logger, } from '@nestjs/common';
import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { USERS_ANSWERS_INJECTION_TOKENS } from './constants/users-answers-injection-tokens';
import type { IUsersAnswersRepository } from './users-answers.repository.interface';
import { UsersAnswersEntity } from './domain/users-answers.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';


@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true
    },
    namespace: 'answers'
})
export class UsersAnswersGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server

    constructor(
        private readonly logger: Logger,
        @Inject(USERS_ANSWERS_INJECTION_TOKENS.IUSERS_ANSWERS_REPOSITORY)
        private readonly usersAnswersRepository: IUsersAnswersRepository,
          private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    afterInit(server: Server) {

        server.use(async (socket: Socket, next) => {
            try {
                let token = socket.handshake.auth?.token;
                if (!token) {
                    token = socket.handshake.query?.token as string;
                }
                if (!token) {
                    const authHeader = socket.handshake.headers.authorization;
                    if (authHeader && authHeader.startsWith('Bearer ')) {
                        token = authHeader.substring(7);
                    }
                }

                if (!token) {
                    this.logger.warn(`[${socket.id}] No token provided`);
                    return next(new Error('Unauthorized: No token provided'));
                }

                const payload = await this.jwtService.verifyAsync(token, {
                    secret: this.configService.get('JWT_ACCESS_SECRET')
                });

                socket.data.user = payload;
                this.logger.log(`[${socket.id}] User ${payload.id} authenticated`);
                next();
            } catch (error: any) {
                this.logger.warn(`[${socket.id}] Authentication failed: ${error.message}`);
                next(new Error('Unauthorized: Invalid token'));
            }
        });

        this.logger.log('[UsersAnswersGateway] - WebSocket Gateway initialized with auth middleware');
    }

    handleConnection(client: Socket) {
        const userId = client.data.user?.id;
        this.logger.log(`[UsersAnswersGateway] - Client ${client.id} connected (User: ${userId})`);
    }

    handleDisconnect(client: Socket) {
        const userId = client.data.user?.id;
        this.logger.log(`[UsersAnswersGateway] - Client ${client.id} disconnected (User: ${userId})`);
    }


    async getQuantityAnswers(pollId: number) {
        try {
            const results = await this.usersAnswersRepository.findOneResults(+pollId);
            const response = UsersAnswersEntity.toResponseGetQuantity(results)
            this.server.emit('quantityAnswers', { response });
            return response;
        } catch (error) {
            throw error
        }
    }

}


