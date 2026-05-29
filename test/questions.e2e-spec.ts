// yarn test:e2e -- test/questions.e2e-spec.ts
import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { getRepositoryToken } from '@nestjs/typeorm';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '../src/modules/app.module';
import { UserEntity } from '../src/modules/users/entities/user.entity';
import { PollEntity } from '../src/modules/polls/entities/polls.entity';
import { QuestionEntity } from '../src/modules/questions/entities/questions.entity';
import { QuestionOptionEntity } from '../src/modules/question-options/entities/question-options.entity';

describe('QuestionsController (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let userRepository: Repository<UserEntity>;
    let pollRepository: Repository<PollEntity>;
    let questionRepository: Repository<QuestionEntity>;
    let questionOptionRepository: Repository<QuestionOptionEntity>;
    let httpServer: any;
    let accessToken: string;
    let userId: number;
    let pollId: number;
    let questionId: number;

    const testUser = {
        name: 'Test User',
        email: 'questions_test@example.com',
        password: 'Test123!',
    };

    const testPoll = {
        title: 'Test Poll for Questions',
        description: 'This is a test poll for questions e2e tests',
    };

    const createQuestionDto = {
        text: 'What is your favorite programming language?',
        type: 'single',
        orderNum: 1,
        options: [
            { text: 'JavaScript', orderNum: 1 },
            { text: 'Python', orderNum: 2 },
            { text: 'Java', orderNum: 3 },
            { text: 'Go', orderNum: 4 },
        ],
    };

    const updateQuestionDto = {
        text: 'What is your favorite programming language? (Updated)',
        type: 'multiple',
        orderNum: 2,
        options: [
            { text: 'JavaScript/TypeScript', orderNum: 1 },
            { text: 'Python', orderNum: 2 },
            { text: 'Rust', orderNum: 3 },
        ],
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
        userRepository = moduleFixture.get(getRepositoryToken(UserEntity));
        pollRepository = moduleFixture.get(getRepositoryToken(PollEntity));
        questionRepository = moduleFixture.get(getRepositoryToken(QuestionEntity));
        questionOptionRepository = moduleFixture.get(getRepositoryToken(QuestionOptionEntity));
    });

    beforeEach(async () => {
     
        await questionOptionRepository.query('TRUNCATE TABLE "question_options" CASCADE');
        await questionRepository.query('TRUNCATE TABLE "questions" CASCADE');
        await pollRepository.query('TRUNCATE TABLE "polls" CASCADE');
        await userRepository.query('TRUNCATE TABLE "users" CASCADE');

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
    });

    afterAll(async () => {
        await dataSource.destroy();
        await app.close();
    });

    describe('POST /polls/:pollId/questions', () => {
        it('should create a new question with options successfully', () => {
            return request(httpServer)
                .post(`/polls/${pollId}/questions`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(createQuestionDto)
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body.pollId).toBe(pollId);
                    expect(res.body.text).toBe(createQuestionDto.text);
                    expect(res.body.type).toBe(createQuestionDto.type);
                    expect(res.body.orderNum).toBe(createQuestionDto.orderNum);
                    expect(res.body.questionOptions).toHaveLength(createQuestionDto.options.length);

                    questionId = res.body.id;

                    res.body.questionOptions.forEach((option: any, index: number) => {
                        expect(option.text).toBe(createQuestionDto.options[index].text);
                        expect(option.orderNum).toBe(createQuestionDto.options[index].orderNum);
                    });
                });
        });

        it('should return 401 without authentication', () => {
            return request(httpServer)
                .post(`/polls/${pollId}/questions`)
                .send(createQuestionDto)
                .expect(401);
        });

        it('should return 404 when poll does not exist', () => {
            const nonExistentPollId = 99999;
            return request(httpServer)
                .post(`/polls/${nonExistentPollId}/questions`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(createQuestionDto)
                .expect(404);
        });

        it('should return 400 when question data is invalid', () => {
            const invalidQuestionDto = {
                text: '',
                type: 'invalid_type',
                orderNum: -1,
                options: [],
            };

            return request(httpServer)
                .post(`/polls/${pollId}/questions`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidQuestionDto)
                .expect(400);
        });

        it('should return 400 when options array is empty', () => {
            const invalidQuestionDto = {
                text: 'Question without options',
                type: 'single',
                orderNum: 1,
                options: [],
            };

            return request(httpServer)
                .post(`/polls/${pollId}/questions`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidQuestionDto)
                .expect(400);
        });
    });

    describe('GET /polls/:pollId/questions', () => {
        beforeEach(async () => {
            await request(httpServer)
                .post(`/polls/${pollId}/questions`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(createQuestionDto);
        });

        it('should get poll with all questions successfully', () => {
            return request(httpServer)
                .get(`/polls/${pollId}/questions`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id', pollId);
                    expect(res.body).toHaveProperty('title', testPoll.title);
                    expect(res.body).toHaveProperty('description', testPoll.description);
                    expect(res.body).toHaveProperty('questions');
                    expect(Array.isArray(res.body.questions)).toBe(true);
                    expect(res.body.questions.length).toBeGreaterThan(0);

                    const question = res.body.questions[0];
                    expect(question).toHaveProperty('text', createQuestionDto.text);
                    expect(question).toHaveProperty('type', createQuestionDto.type);
                    expect(question).toHaveProperty('orderNum', createQuestionDto.orderNum);
                    expect(question.questionOptions).toHaveLength(createQuestionDto.options.length);
                });
        });

        it('should return 401 without authentication', () => {
            return request(httpServer)
                .get(`/polls/${pollId}/questions`)
                .expect(401);
        });

        it('should return 404 when poll does not exist', () => {
            const nonExistentPollId = 99999;
            return request(httpServer)
                .get(`/polls/${nonExistentPollId}/questions`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });
    });

    describe('GET /polls/:pollId/questions/:questionId', () => {
        beforeEach(async () => {
            const response = await request(httpServer)
                .post(`/polls/${pollId}/questions`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(createQuestionDto);

            questionId = response.body.id;
        });

        it('should get a specific question successfully', () => {
            return request(httpServer)
                .get(`/polls/${pollId}/questions/${questionId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id', questionId);
                    expect(res.body).toHaveProperty('pollId', pollId);
                    expect(res.body).toHaveProperty('text', createQuestionDto.text);
                    expect(res.body).toHaveProperty('type', createQuestionDto.type);
                    expect(res.body).toHaveProperty('orderNum', createQuestionDto.orderNum);
                    expect(res.body.questionOptions).toHaveLength(createQuestionDto.options.length);
                });
        });

        it('should return 401 without authentication', () => {
            return request(httpServer)
                .get(`/polls/${pollId}/questions/${questionId}`)
                .expect(401);
        });

        it('should return 404 when question does not exist', () => {
            const nonExistentQuestionId = 99999;
            return request(httpServer)
                .get(`/polls/${pollId}/questions/${nonExistentQuestionId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });

        it('should return 404 when poll does not exist', () => {
            const nonExistentPollId = 99999;
            return request(httpServer)
                .get(`/polls/${nonExistentPollId}/questions/${questionId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });
    });

    describe('PUT /polls/:pollId/questions/:questionId', () => {
        beforeEach(async () => {
            const response = await request(httpServer)
                .post(`/polls/${pollId}/questions`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(createQuestionDto);

            questionId = response.body.id;
        });

        it('should update a question successfully', () => {
            const updateSameOptionsDto = {
                text: 'What is your favorite programming language? (Updated)',
                type: 'multiple',
                orderNum: 2,
                options: [
                    { text: 'JavaScript/TypeScript', orderNum: 1 },  
                    { text: 'Python', orderNum: 2 },                 
                    { text: 'Java', orderNum: 3 },                   
                    { text: 'Go', orderNum: 4 }                     
                ]
            };

            return request(httpServer)
                .put(`/polls/${pollId}/questions/${questionId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(updateSameOptionsDto)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id', questionId);
                    expect(res.body).toHaveProperty('pollId', pollId);
                    expect(res.body.text).toBe(updateSameOptionsDto.text);
                    expect(res.body.type).toBe(updateSameOptionsDto.type);
                    expect(res.body.orderNum).toBe(updateSameOptionsDto.orderNum);
                    expect(res.body.questionOptions).toHaveLength(updateSameOptionsDto.options.length);

                    res.body.questionOptions.forEach((option: any, index: number) => {
                        expect(option.text).toBe(updateSameOptionsDto.options[index].text);
                        expect(option.orderNum).toBe(updateSameOptionsDto.options[index].orderNum);
                    });
                });
        });

        it('should return 401 without authentication', () => {
            return request(httpServer)
                .put(`/polls/${pollId}/questions/${questionId}`)
                .send(updateQuestionDto)
                .expect(401);
        });

        it('should return 404 when question does not exist', () => {
            const nonExistentQuestionId = 99999;
            return request(httpServer)
                .put(`/polls/${pollId}/questions/${nonExistentQuestionId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(updateQuestionDto)
                .expect(404);
        });

        it('should return 404 when poll does not exist', () => {
            const nonExistentPollId = 99999;
            return request(httpServer)
                .put(`/polls/${nonExistentPollId}/questions/${questionId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(updateQuestionDto)
                .expect(404);
        });

        it('should return 400 when update data is invalid', () => {
            const invalidUpdateDto = {
                text: '',
                type: 'invalid',
                orderNum: -5,
            };

            return request(httpServer)
                .put(`/polls/${pollId}/questions/${questionId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidUpdateDto)
                .expect(400);
        });
    });

    describe('DELETE /polls/:pollId/questions/:questionId', () => {
        beforeEach(async () => {
            const response = await request(httpServer)
                .post(`/polls/${pollId}/questions`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(createQuestionDto);

            questionId = response.body.id;
        });

        it('should delete a question successfully', () => {
            return request(httpServer)
                .delete(`/polls/${pollId}/questions/${questionId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(204);
        });

        it('should verify question is deleted', async () => {
            await request(httpServer)
                .delete(`/polls/${pollId}/questions/${questionId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(204);

            return request(httpServer)
                .get(`/polls/${pollId}/questions/${questionId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });

        it('should return 401 without authentication', () => {
            return request(httpServer)
                .delete(`/polls/${pollId}/questions/${questionId}`)
                .expect(401);
        });

        it('should return 404 when question does not exist', () => {
            const nonExistentQuestionId = 99999;
            return request(httpServer)
                .delete(`/polls/${pollId}/questions/${nonExistentQuestionId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });

        it('should return 404 when poll does not exist', () => {
            const nonExistentPollId = 99999;
            return request(httpServer)
                .delete(`/polls/${nonExistentPollId}/questions/${questionId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });
    });
});