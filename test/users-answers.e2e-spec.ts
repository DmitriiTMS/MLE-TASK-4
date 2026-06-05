// yarn test:e2e -- test/users-answers.e2e-spec.ts
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
import { UsersAnswersModel } from '../src/modules/users-answers/models/users-answers.model';
import { POLLS_MESSAGE } from '../src/modules/polls/constants/types.message';

describe('UsersAnswersController (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let httpServer: any;

    let answersRepository: Repository<UsersAnswersModel>;
    let pollsRepository: Repository<PollModel>;
    let questionsRepository: Repository<QuestionModel>;
    let optionsRepository: Repository<QuestionOptionModel>;
    let usersRepository: Repository<UserModel>;

    let authToken: string;
    let testUserId: number;

    let testPollId: number;
    let testQuestionId: number;
    let testOptionIds: number[];

    const testUser = {
        name: 'Answer Test User',
        email: 'answertest@example.com',
        password: 'Test123!',
    };

    const secondUser = {
        name: 'Second User',
        email: 'seconduser@example.com',
        password: 'Test123!',
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

        answersRepository = moduleFixture.get(getRepositoryToken(UsersAnswersModel));
        pollsRepository = moduleFixture.get(getRepositoryToken(PollModel));
        questionsRepository = moduleFixture.get(getRepositoryToken(QuestionModel));
        optionsRepository = moduleFixture.get(getRepositoryToken(QuestionOptionModel));
        usersRepository = moduleFixture.get(getRepositoryToken(UserModel));
    });

    beforeEach(async () => {

        await answersRepository.query('TRUNCATE TABLE "users_answers" RESTART IDENTITY CASCADE');
        await optionsRepository.query('TRUNCATE TABLE "question_options" RESTART IDENTITY CASCADE');
        await questionsRepository.query('TRUNCATE TABLE "questions" RESTART IDENTITY CASCADE');
        await pollsRepository.query('TRUNCATE TABLE "polls" RESTART IDENTITY CASCADE');
        await usersRepository.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');


        const registerResponse = await request(httpServer)
            .post('/auth/register')
            .send(testUser);


        if (registerResponse.status === 201) {
            authToken = registerResponse.body.accessToken;
        } else if (registerResponse.status === 409) {

            const loginResponse = await request(httpServer)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200);
            authToken = loginResponse.body.accessToken;
        } else {
            throw new Error(`Registration failed with status ${registerResponse.status}`);
        }
        const user = await usersRepository.findOne({ where: { email: testUser.email } });
        if (!user) {
            throw new Error('User not found after registration');
        }
        testUserId = user.id;


        await setupTestData();
    });

    afterAll(async () => {
        await dataSource.destroy();
        await app.close();
    });

    async function setupTestData() {

        const pollResponse = await request(httpServer)
            .post('/polls')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                title: 'Test Poll for Answers',
                description: 'Test Description',
            })
            .expect(201);

        testPollId = pollResponse.body.id;


        const createQuestionDto = {
            text: 'Test Question?',
            type: 'single',
            orderNum: 1,
            options: [
                { text: 'Option 1', orderNum: 1 },
                { text: 'Option 2', orderNum: 2 },
            ],
        };

        const questionResponse = await request(httpServer)
            .post(`/polls/${testPollId}/questions`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(createQuestionDto)
            .expect(201);

        testQuestionId = questionResponse.body.id;
        testOptionIds = questionResponse.body.questionOptions.map((opt: any) => opt.id);
    }

    describe('POST /answers/:pollId', () => {
        beforeEach(async () => {

            await answersRepository.delete({ pollId: testPollId });
        });

        it('should successfully create an answer', async () => {
            const createAnswerDto = {
                questionId: testQuestionId,
                questionOptionIds: [testOptionIds[0]],
            };

            const response = await request(httpServer)
                .post(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(createAnswerDto)
                .expect(201);

            expect(response.body).toHaveProperty('userAnswerSave');
            expect(response.body.userAnswerSave).toBe(true);
        });

        it('should successfully create answer with multiple options', async () => {
            const createAnswerDto = {
                questionId: testQuestionId,
                questionOptionIds: testOptionIds,
            };

            const response = await request(httpServer)
                .post(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(createAnswerDto)
                .expect(201);

            expect(response.body.userAnswerSave).toBe(true);
        });

        it('should return 400 when questionId is missing', async () => {
            const createAnswerDto = {
                questionOptionIds: [testOptionIds[0]],
            };

            await request(httpServer)
                .post(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(createAnswerDto)
                .expect(400);
        });

        it('should return 400 when questionOptionIds is empty', async () => {
            const createAnswerDto = {
                questionId: testQuestionId,
                questionOptionIds: [],
            };

            await request(httpServer)
                .post(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(createAnswerDto)
                .expect(400);
        });

        it('should return 400 when questionOptionIds contains invalid values', async () => {
            const createAnswerDto = {
                questionId: testQuestionId,
                questionOptionIds: [0, -1],
            };

            await request(httpServer)
                .post(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(createAnswerDto)
                .expect(400);
        });

        it('should return 400 when questionOptionIds is not an array', async () => {
            const createAnswerDto = {
                questionId: testQuestionId,
                questionOptionIds: 'not-an-array' as any,
            };

            await request(httpServer)
                .post(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(createAnswerDto)
                .expect(400);
        });

        it('should return 404 when poll does not exist', async () => {
            const nonExistentPollId = 99999;
            const createAnswerDto = {
                questionId: testQuestionId,
                questionOptionIds: [testOptionIds[0]],
            };

            await request(httpServer)
                .post(`/answers/${nonExistentPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(createAnswerDto)
                .expect(404);
        });

        it('should return 404 when question does not exist', async () => {
            const createAnswerDto = {
                questionId: 99999,
                questionOptionIds: [testOptionIds[0]],
            };

            await request(httpServer)
                .post(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(createAnswerDto)
                .expect(404);
        });

        it('should return 403 when question does not belong to poll', async () => {

            const anotherPollResponse = await request(httpServer)
                .post('/polls')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Another Poll',
                    description: 'Another Description',
                })
                .expect(201);

            const anotherPollId = anotherPollResponse.body.id;

            const anotherQuestionDto = {
                text: 'Another Question?',
                type: 'single',
                orderNum: 1,
                options: [
                    { text: 'Option A', orderNum: 1 },
                ],
            };

            const anotherQuestionResponse = await request(httpServer)
                .post(`/polls/${anotherPollId}/questions`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(anotherQuestionDto)
                .expect(201);

            const anotherQuestionId = anotherQuestionResponse.body.id;

            const createAnswerDto = {
                questionId: anotherQuestionId,
                questionOptionIds: [testOptionIds[0]],
            };

            await request(httpServer)
                .post(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(createAnswerDto)
                .expect(403);
        });

        it('should return 400 when options do not belong to question', async () => {
            const createAnswerDto = {
                questionId: testQuestionId,
                questionOptionIds: [99999, 99998],
            };

            await request(httpServer)
                .post(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(createAnswerDto)
                .expect(400);
        });

        it('should return 400 when user already answered this question with same options', async () => {
            const createAnswerDto = {
                questionId: testQuestionId,
                questionOptionIds: [testOptionIds[0]],
            };


            await request(httpServer)
                .post(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(createAnswerDto)
                .expect(201);

            await request(httpServer)
                .post(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(createAnswerDto)
                .expect(400);
        });

        it('should return 401 without authentication token', async () => {
            const createAnswerDto = {
                questionId: testQuestionId,
                questionOptionIds: [testOptionIds[0]],
            };

            await request(httpServer)
                .post(`/answers/${testPollId}`)
                .send(createAnswerDto)
                .expect(401);
        });

        it('should return 401 with invalid token', async () => {
            const createAnswerDto = {
                questionId: testQuestionId,
                questionOptionIds: [testOptionIds[0]],
            };

            await request(httpServer)
                .post(`/answers/${testPollId}`)
                .set('Authorization', 'Bearer invalid.token.here')
                .send(createAnswerDto)
                .expect(401);
        });
    });

    describe('GET /answers/:pollId', () => {
        let secondUserToken: string;
        let thirdUserToken: string;

        beforeEach(async () => {

            await answersRepository.delete({ pollId: testPollId });


            const secondUserRegister = await request(httpServer)
                .post('/auth/register')
                .send({
                    name: 'Second User',
                    email: 'seconduser_answers@example.com',
                    password: 'Test123!',
                });

            if (secondUserRegister.status === 201) {
                secondUserToken = secondUserRegister.body.accessToken;
            } else if (secondUserRegister.status === 409) {
                const loginResponse = await request(httpServer)
                    .post('/auth/login')
                    .send({
                        email: 'seconduser_answers@example.com',
                        password: 'Test123!',
                    })
                    .expect(200);
                secondUserToken = loginResponse.body.accessToken;
            } else {
                throw new Error(`Registration failed with status ${secondUserRegister.status}`);
            }


            const thirdUserRegister = await request(httpServer)
                .post('/auth/register')
                .send({
                    name: 'Third User',
                    email: 'thirduser_answers@example.com',
                    password: 'Test123!',
                });

            if (thirdUserRegister.status === 201) {
                thirdUserToken = thirdUserRegister.body.accessToken;
            } else if (thirdUserRegister.status === 409) {
                const loginResponse = await request(httpServer)
                    .post('/auth/login')
                    .send({
                        email: 'thirduser_answers@example.com',
                        password: 'Test123!',
                    })
                    .expect(200);
                thirdUserToken = loginResponse.body.accessToken;
            } else {
                throw new Error(`Registration failed with status ${thirdUserRegister.status}`);
            }


            await request(httpServer)
                .post(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    questionId: testQuestionId,
                    questionOptionIds: [testOptionIds[0]],
                })
                .expect(201);

            await request(httpServer)
                .post(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${secondUserToken}`)
                .send({
                    questionId: testQuestionId,
                    questionOptionIds: [testOptionIds[0]],
                })
                .expect(201);


            await request(httpServer)
                .post(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${thirdUserToken}`)
                .send({
                    questionId: testQuestionId,
                    questionOptionIds: [testOptionIds[0]],
                })
                .expect(201);

            await request(httpServer)
                .post(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    questionId: testQuestionId,
                    questionOptionIds: [testOptionIds[1]],
                })
                .expect(201);
        });

        it('should return quantity of answers for poll', async () => {
            const response = await request(httpServer)
                .get(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);

            const firstItem = response.body[0];
            expect(firstItem).toHaveProperty('pollId');
            expect(firstItem).toHaveProperty('pollTitle');
            expect(firstItem).toHaveProperty('questionId');
            expect(firstItem).toHaveProperty('questionText');
            expect(firstItem).toHaveProperty('questionOptionId');
            expect(firstItem).toHaveProperty('optionText');
            expect(firstItem).toHaveProperty('count');
        });

        it('should return empty result for poll without answers', async () => {

            const newPollResponse = await request(httpServer)
                .post('/polls')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Empty Poll',
                    description: 'No Answers Yet',
                })
                .expect(201);

            const newPollId = newPollResponse.body.id;

            const newQuestionDto = {
                text: 'Empty Question?',
                type: 'single',
                orderNum: 1,
                options: [
                    { text: 'Option X', orderNum: 1 },
                ],
            };

            await request(httpServer)
                .post(`/polls/${newPollId}/questions`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(newQuestionDto)
                .expect(201);

            const response = await request(httpServer)
                .get(`/answers/${newPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });

        it('should return 404 for non-existent poll', async () => {
            const response = await request(httpServer)
                .get('/answers/99999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe(POLLS_MESSAGE.POLL_NOT_FOUND);
        });

        it('should return 401 without authentication token', async () => {
            await request(httpServer)
                .get(`/answers/${testPollId}`)
                .expect(401);
        });

        it('should return 401 with invalid token', async () => {
            await request(httpServer)
                .get(`/answers/${testPollId}`)
                .set('Authorization', 'Bearer invalid.token.here')
                .expect(401);
        });

        it('should return correct count values', async () => {
            const response = await request(httpServer)
                .get(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);

            const totalCount = response.body.reduce((sum: number, item: any) => sum + item.count, 0);

            expect(totalCount).toBe(4);
        });

        it('should return answers grouped by options', async () => {
            const response = await request(httpServer)
                .get(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);

            const option1 = response.body.find((item: any) => item.questionOptionId === testOptionIds[0]);
            const option2 = response.body.find((item: any) => item.questionOptionId === testOptionIds[1]);

            expect(option1).toBeDefined();
            expect(option2).toBeDefined();
            expect(option1.count).toBe(3);
            expect(option2.count).toBe(1);
        });

        it('should return poll title correctly', async () => {
            const response = await request(httpServer)
                .get(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);

            const pollTitle = response.body[0].pollTitle;
            expect(pollTitle).toBe('Test Poll for Answers');

            response.body.forEach((item: any) => {
                expect(item.pollTitle).toBe('Test Poll for Answers');
            });
        });

        it('should return question text correctly', async () => {
            const response = await request(httpServer)
                .get(`/answers/${testPollId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);


            const questionText = response.body[0].questionText;
            expect(questionText).toBe('Test Question?');

            response.body.forEach((item: any) => {
                expect(item.questionText).toBe('Test Question?');
            });
        });
    });
});