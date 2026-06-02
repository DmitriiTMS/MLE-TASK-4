// yarn test:e2e -- test/question-options.e2e-spec.ts

import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { getRepositoryToken } from '@nestjs/typeorm';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '../src/modules/app.module';
import { UserModel } from '../src/modules/users/models/user.model';
import { PollModel } from '../src/modules/polls/models/polls.model';
import { QuestionModel } from '../src/modules/questions/questions-variant/models/questions.model';
import { QuestionOptionModel } from '../src/modules/questions/question-options/models/question-options.model';

describe('QuestionOptionsController (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let userRepository: Repository<UserModel>;
    let pollRepository: Repository<PollModel>;
    let questionRepository: Repository<QuestionModel>;
    let questionOptionRepository: Repository<QuestionOptionModel>;
    let httpServer: any;
    let accessToken: string;
    let userId: number;
    let pollId: number;
    let questionId: number;
    let optionId: number;

    const testUser = {
        name: 'Test User',
        email: 'options_test@example.com',
        password: 'Test123!',
    };

    const secondUser = {
        name: 'Second User',
        email: 'options_test2@example.com',
        password: 'Test123!',
    };

    const testPoll = {
        title: 'Test Poll for Options',
        description: 'This is a test poll for options e2e tests',
    };

    const createQuestionDto = {
        text: 'What is your favorite programming language?',
        type: 'single',
        orderNum: 1,
        options: [
            { text: 'JavaScript', orderNum: 1 },
            { text: 'Python', orderNum: 2 },
            { text: 'Java', orderNum: 3 },
        ],
    };

    const createOptionDto = {
        text: 'TypeScript',
        orderNum: 4,
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(Logger)
            .useValue({
                log: jest.fn(),
                error: jest.fn(),
                warn: jest.fn(),
            })
            .overrideGuard(ThrottlerGuard)
            .useValue({
                canActivate: () => true,
            })
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
            }),
        );
        app.use(cookieParser());

        await app.init();
        httpServer = app.getHttpServer();

        dataSource = moduleFixture.get(DataSource);
        userRepository = moduleFixture.get(getRepositoryToken(UserModel));
        pollRepository = moduleFixture.get(getRepositoryToken(PollModel));
        questionRepository = moduleFixture.get(getRepositoryToken(QuestionModel));
        questionOptionRepository = moduleFixture.get(getRepositoryToken(QuestionOptionModel));
    });

    beforeEach(async () => {
        await questionOptionRepository.query('TRUNCATE TABLE "question_options" RESTART IDENTITY CASCADE');
        await questionRepository.query('TRUNCATE TABLE "questions" RESTART IDENTITY CASCADE');
        await pollRepository.query('TRUNCATE TABLE "polls" RESTART IDENTITY CASCADE');
        await userRepository.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');

        const registerResponse = await request(httpServer)
            .post('/auth/register')
            .send(testUser);

        accessToken = registerResponse.body.accessToken;
        userId = registerResponse.body.user?.id || 1;

        const pollResponse = await request(httpServer)
            .post('/polls')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(testPoll);

        pollId = pollResponse.body.id;

        const questionResponse = await request(httpServer)
            .post(`/polls/${pollId}/questions`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send(createQuestionDto);

        questionId = questionResponse.body.id;
        optionId = questionResponse.body.questionOptions[0].id;
    });

    afterAll(async () => {
        await dataSource.destroy();
        await app.close();
    });

    describe('POST /question/:questionId/option', () => {
        it('should create a new option successfully', async () => {

            const response = await request(httpServer)
                .post(`/question/${questionId}/option`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(createOptionDto)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.text).toBe(createOptionDto.text);
            expect(response.body.orderNum).toBe(createOptionDto.orderNum);
            
            const savedOption = await questionOptionRepository.findOne({
                where: { id: response.body.id }
            });
            expect(savedOption).toBeDefined();
            expect(savedOption?.text).toBe(createOptionDto.text);
        });

        it('should return 401 when no access token provided', () => {
            return request(httpServer)
                .post(`/question/${questionId}/option`)
                .send(createOptionDto)
                .expect(401);
        });

        it('should return 404 when question does not exist', () => {
            const nonExistentQuestionId = 99999;
            return request(httpServer)
                .post(`/question/${nonExistentQuestionId}/option`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(createOptionDto)
                .expect(404);
        });

        it('should return 403 when user is not the poll creator', async () => {
            const secondUserResponse = await request(httpServer)
                .post('/auth/register')
                .send(secondUser);
            
            const secondUserToken = secondUserResponse.body.accessToken;

            return request(httpServer)
                .post(`/question/${questionId}/option`)
                .set('Authorization', `Bearer ${secondUserToken}`)
                .send(createOptionDto)
                .expect(403);
        });

        it('should return 400 when text is empty', () => {
            const invalidDto = {
                text: '',
                orderNum: 5,
            };

            return request(httpServer)
                .post(`/question/${questionId}/option`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidDto)
                .expect(400);
        });

        it('should return 400 when text exceeds max length', () => {
            const invalidDto = {
                text: 'a'.repeat(2001),
                orderNum: 5,
            };

            return request(httpServer)
                .post(`/question/${questionId}/option`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidDto)
                .expect(400);
        });

        it('should return 400 when orderNum is less than 1', () => {
            const invalidDto = {
                text: 'Invalid Option',
                orderNum: 0,
            };

            return request(httpServer)
                .post(`/question/${questionId}/option`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidDto)
                .expect(400);
        });

        it('should return 400 when orderNum is not an integer', () => {
            const invalidDto = {
                text: 'Invalid Option',
                orderNum: 1.5,
            };

            return request(httpServer)
                .post(`/question/${questionId}/option`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidDto)
                .expect(400);
        });

    });

    describe('DELETE /question/:questionId/option/:optionId', () => {
        it('should delete an option successfully', async () => {

            const beforeOption = await questionOptionRepository.findOne({
                where: { id: optionId }
            });
            expect(beforeOption).toBeDefined();

            await request(httpServer)
                .delete(`/question/${questionId}/option/${optionId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(204);

            const afterOption = await questionOptionRepository.findOne({
                where: { id: optionId }
            });
            expect(afterOption).toBeNull();
        });

        it('should return 401 when no access token provided', () => {
            return request(httpServer)
                .delete(`/question/${questionId}/option/${optionId}`)
                .expect(401);
        });

        it('should return 404 when question does not exist', () => {
            const nonExistentQuestionId = 99999;
            return request(httpServer)
                .delete(`/question/${nonExistentQuestionId}/option/${optionId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });

        it('should return 404 when option does not exist', () => {
            const nonExistentOptionId = 99999;
            return request(httpServer)
                .delete(`/question/${questionId}/option/${nonExistentOptionId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });

        it('should return 403 when user is not the poll creator', async () => {
            const secondUserResponse = await request(httpServer)
                .post('/auth/register')
                .send(secondUser);
            
            const secondUserToken = secondUserResponse.body.accessToken;

            return request(httpServer)
                .delete(`/question/${questionId}/option/${optionId}`)
                .set('Authorization', `Bearer ${secondUserToken}`)
                .expect(403);
        });

        it('should allow deleting options one by one', async () => {

            const freshQuestionResponse = await request(httpServer)
                .post(`/polls/${pollId}/questions`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    text: 'Test Delete All Options',
                    type: 'single',
                    orderNum: 4,
                    options: [
                        { text: 'Option A', orderNum: 1 },
                        { text: 'Option B', orderNum: 2 },
                        { text: 'Option C', orderNum: 3 },
                    ],
                });

            const freshQuestionId = freshQuestionResponse.body.id;
            
            let options = await questionOptionRepository.find({
                where: { questionId: freshQuestionId }
            });
            
            expect(options).toHaveLength(3);

            for (let i = 0; i < options.length; i++) {
                const currentOption = options[i];
                await request(httpServer)
                    .delete(`/question/${freshQuestionId}/option/${currentOption.id}`)
                    .set('Authorization', `Bearer ${accessToken}`)
                    .expect(204);
                
                const remainingOptions = await questionOptionRepository.find({
                    where: { questionId: freshQuestionId }
                });
                expect(remainingOptions).toHaveLength(options.length - i - 1);
            }

            const finalOptions = await questionOptionRepository.find({
                where: { questionId: freshQuestionId }
            });
            expect(finalOptions).toHaveLength(0);
        });

        it('should return 404 when trying to delete already deleted option', async () => {
            await request(httpServer)
                .delete(`/question/${questionId}/option/${optionId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(204);

            await request(httpServer)
                .delete(`/question/${questionId}/option/${optionId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });
    });
});