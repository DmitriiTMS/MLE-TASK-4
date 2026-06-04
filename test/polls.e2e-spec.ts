// yarn test:e2e -- test/polls.e2e-spec.ts
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


describe('PollsController (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let userRepository: Repository<UserModel>;
    let pollRepository: Repository<PollModel>;
    let httpServer: any;
    let accessToken: string;
    let refreshToken: string;
    let userId: number;

    const testUser = {
        name: 'Test User',
        email: 'polls_test@example.com',
        password: 'Test123!',
    };

    const testPoll = {
        title: 'Test Poll',
        description: 'This is a test poll description',
    };

    const updatePollData = {
        title: 'Updated Poll Title',
        description: 'Updated poll description',
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
    });

    beforeEach(async () => {
        // Очищаем таблицы в правильном порядке (сначала polls, потом users)
        await pollRepository.query('TRUNCATE TABLE "polls" CASCADE');
        await userRepository.query('TRUNCATE TABLE "users" CASCADE');

        // Создаем тестового пользователя и получаем токены
        const registerResponse = await request(httpServer)
            .post('/auth/register')
            .send(testUser);

        accessToken = registerResponse.body.accessToken;
        refreshToken = registerResponse.headers['set-cookie'][0].split(';')[0].split('=')[1];
        userId = registerResponse.body.user?.id || 1;
    });

    afterAll(async () => {
        await dataSource.destroy();
        await app.close();
    });

    describe('POST /polls', () => {
        it('should create a new poll successfully', () => {
            return request(httpServer)
                .post('/polls')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(testPoll)
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body.title).toBe(testPoll.title);
                    expect(res.body.description).toBe(testPoll.description);
                    expect(res.body.isActive).toBe(true);
                    expect(res.body.isPublic).toBe(false);
                    expect(res.body.createUser).toHaveProperty('id');
                    expect(res.body.createUser).toHaveProperty('name');
                });
        });

        it('should create a poll without description', () => {
            const pollWithoutDescription = {
                title: 'Poll Without Description',
            };

            return request(httpServer)
                .post('/polls')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(pollWithoutDescription)
                .expect(201)
                .expect((res) => {
                    expect(res.body.title).toBe(pollWithoutDescription.title);
                    expect(res.body.description).toBeNull();
                });
        });

        it('should return 401 when no token provided', () => {
            return request(httpServer)
                .post('/polls')
                .send(testPoll)
                .expect(401);
        });

        it('should return 400 when title is empty', () => {
            const invalidPoll = {
                title: '',
                description: 'Test',
            };

            return request(httpServer)
                .post('/polls')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidPoll)
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain("Поле 'title' не может быть пустым");
                });
        });

        it('should return 400 when title exceeds max length', () => {
            const invalidPoll = {
                title: 'a'.repeat(256),
                description: 'Test',
            };

            return request(httpServer)
                .post('/polls')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidPoll)
                .expect(400)
                .expect((res) => {
                    expect(res.body.message[0]).toContain(
                        "Максимальная длина поля 'title' не может быть больше 255 символов",
                    );
                });
        });

        it('should return 400 when description exceeds max length', () => {
            const invalidPoll = {
                title: 'Test Poll',
                description: 'a'.repeat(3001),
            };

            return request(httpServer)
                .post('/polls')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidPoll)
                .expect(400)
                .expect((res) => {
                    expect(res.body.message[0]).toContain(
                        "Максимальная длина поля 'description' не может быть больше 3000 символов",
                    );
                });
        });
    });

    describe('GET /polls', () => {
        beforeEach(async () => {
            // Создаем несколько тестовых опросов
            for (let i = 0; i < 3; i++) {
                await request(httpServer)
                    .post('/polls')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send({
                        title: `Poll ${i + 1}`,
                        description: `Description ${i + 1}`,
                    });
            }
        });

        it('should return paginated list of polls', () => {
            return request(httpServer)
                .get('/polls')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('data');
                    expect(res.body).toHaveProperty('meta');
                    expect(Array.isArray(res.body.data)).toBe(true);
                    expect(res.body.meta).toHaveProperty('page');
                    expect(res.body.meta).toHaveProperty('limit');
                    expect(res.body.meta).toHaveProperty('total');
                    expect(res.body.meta).toHaveProperty('totalPages');
                    expect(res.body.data.length).toBeGreaterThan(0);
                });
        });

        it('should return polls with pagination parameters', () => {
            return request(httpServer)
                .get('/polls?page=1&limit=2')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.meta.page).toBe(1);
                    expect(res.body.meta.limit).toBe(2);
                    expect(res.body.data.length).toBeLessThanOrEqual(2);
                });
        });

        it('should return 401 when no token provided', () => {
            return request(httpServer)
                .get('/polls')
                .expect(401);
        });

        it('should handle invalid pagination parameters', () => {
            return request(httpServer)
                .get('/polls?page=0&limit=10')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(400);
        });
    });

    describe('GET /polls/:id', () => {
        let pollId: number;

        beforeEach(async () => {
            const response = await request(httpServer)
                .post('/polls')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(testPoll);
            pollId = response.body.id;
        });

        it('should return poll by id', () => {
            return request(httpServer)
                .get(`/polls/${pollId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.id).toBe(pollId);
                    expect(res.body.title).toBe(testPoll.title);
                    expect(res.body.description).toBe(testPoll.description);
                    expect(res.body.isActive).toBe(true);
                    expect(res.body.isPublic).toBe(false);
                });
        });

        it('should return 404 when poll not found', () => {
            return request(httpServer)
                .get('/polls/99999')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404)
                .expect((res) => {
                    expect(res.body.message).toBe("Poll not found");
                });
        });

        it('should return 401 when no token provided', () => {
            return request(httpServer)
                .get(`/polls/${pollId}`)
                .expect(401);
        });

        it('should return 400 when id is invalid', () => {
            return request(httpServer)
                .get('/polls/invalid')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(400);
        });
    });

    describe('PUT /polls/:id', () => {
        let pollId: number;

        beforeEach(async () => {
            const response = await request(httpServer)
                .post('/polls')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(testPoll);
            pollId = response.body.id;
        });

        it('should update poll successfully', () => {
            return request(httpServer)
                .put(`/polls/${pollId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(updatePollData)
                .expect(200)
                .expect((res) => {
                    expect(res.body.id).toBe(pollId);
                    expect(res.body.title).toBe(updatePollData.title);
                    expect(res.body.description).toBe(updatePollData.description);
                });
        });

        it('should update only title', () => {
            return request(httpServer)
                .put(`/polls/${pollId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ title: 'Only Title Updated' })
                .expect(200)
                .expect((res) => {
                    expect(res.body.title).toBe('Only Title Updated');
                    expect(res.body.description).toBe(testPoll.description);
                });
        });

        it('should update only description', () => {
            return request(httpServer)
                .put(`/polls/${pollId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ description: 'Only description updated' })
                .expect(200)
                .expect((res) => {
                    expect(res.body.title).toBe(testPoll.title);
                    expect(res.body.description).toBe('Only description updated');
                });
        });

        it('should update isActive status', () => {
            return request(httpServer)
                .put(`/polls/${pollId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ isActive: false })
                .expect(200)
                .expect((res) => {
                    expect(res.body.isActive).toBe(false);
                });
        });

        it('should return 403 when user is not the owner', async () => {
            // Создаем другого пользователя
            const anotherUser = {
                name: 'Another User',
                email: 'another@example.com',
                password: 'Test123!',
            };

            const registerResponse = await request(httpServer)
                .post('/auth/register')
                .send(anotherUser);

            const anotherAccessToken = registerResponse.body.accessToken;

            // Пытаемся обновить опрос первого пользователя
            return request(httpServer)
                .put(`/polls/${pollId}`)
                .set('Authorization', `Bearer ${anotherAccessToken}`)
                .send(updatePollData)
                .expect(403)
                .expect((res) => {
                    expect(res.body.message).toBe("You do not have permission to update this poll");
                });
        });

        it('should return 404 when poll not found', () => {
            return request(httpServer)
                .put('/polls/99999')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(updatePollData)
                .expect(404);
        });

        it('should return 401 when no token provided', () => {
            return request(httpServer)
                .put(`/polls/${pollId}`)
                .send(updatePollData)
                .expect(401);
        });

        it('should return 400 when title exceeds max length', () => {
            return request(httpServer)
                .put(`/polls/${pollId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ title: 'a'.repeat(256) })
                .expect(400);
        });
    });

    describe('DELETE /polls/:id', () => {
        let pollId: number;

        beforeEach(async () => {
            const response = await request(httpServer)
                .post('/polls')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(testPoll);
            pollId = response.body.id;
        });

        it('should delete poll successfully', () => {
            return request(httpServer)
                .delete(`/polls/${pollId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(204);
        });

        it('should return 403 when user is not the owner', async () => {
            // Создаем другого пользователя
            const anotherUser = {
                name: 'Another User',
                email: 'another2@example.com',
                password: 'Test123!',
            };

            const registerResponse = await request(httpServer)
                .post('/auth/register')
                .send(anotherUser);

            const anotherAccessToken = registerResponse.body.accessToken;

            return request(httpServer)
                .delete(`/polls/${pollId}`)
                .set('Authorization', `Bearer ${anotherAccessToken}`)
                .expect(403)
                .expect((res) => {
                    expect(res.body.message).toBe("You do not have permission to delete this poll");
                });
        });

        it('should return 404 when poll not found', () => {
            return request(httpServer)
                .delete('/polls/99999')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });

        it('should return 401 when no token provided', () => {
            return request(httpServer)
                .delete(`/polls/${pollId}`)
                .expect(401);
        });
    });

    describe('PATCH /polls/:id/active', () => {
        let pollId: number;

        beforeEach(async () => {
            const response = await request(httpServer)
                .post('/polls')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(testPoll);
            pollId = response.body.id;
        });

        it('should successfully toggle active status to false', () => {
            return request(httpServer)
                .patch(`/polls/${pollId}/active`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ isActive: false })
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('isActive');
                    expect(res.body.isActive).toBe(false);
                });
        });

        it('should successfully toggle active status to true', async () => {
            await request(httpServer)
                .patch(`/polls/${pollId}/active`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ isActive: false });

            return request(httpServer)
                .patch(`/polls/${pollId}/active`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ isActive: true })
                .expect(200)
                .expect((res) => {
                    expect(res.body.isActive).toBe(true);
                });
        });

        it('should return 403 when user is not the owner', async () => {

            const anotherUser = {
                name: 'Another User',
                email: 'another_active@example.com',
                password: 'Test123!',
            };

            const registerResponse = await request(httpServer)
                .post('/auth/register')
                .send(anotherUser);

            const anotherAccessToken = registerResponse.body.accessToken;

            return request(httpServer)
                .patch(`/polls/${pollId}/active`)
                .set('Authorization', `Bearer ${anotherAccessToken}`)
                .send({ isActive: false })
                .expect(403)
                .expect((res) => {
                    expect(res.body.message).toBe("You do not have permission to update this poll");
                });
        });

        it('should return 404 when poll not found', () => {
            return request(httpServer)
                .patch('/polls/99999/active')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ isActive: false })
                .expect(404)
                .expect((res) => {
                    expect(res.body.message).toBe("Poll not found");
                });
        });

        it('should return 401 when no token provided', () => {
            return request(httpServer)
                .patch(`/polls/${pollId}/active`)
                .send({ isActive: false })
                .expect(401);
        });

        it('should return 400 when isActive is not a boolean', () => {
            return request(httpServer)
                .patch(`/polls/${pollId}/active`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ isActive: 'not-a-boolean' })
                .expect(400);
        });

        it('should return 400 when isActive is missing', () => {
            return request(httpServer)
                .patch(`/polls/${pollId}/active`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({})
                .expect(400);
        });

        it('should return 400 when poll id is invalid', () => {
            return request(httpServer)
                .patch('/polls/invalid/active')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ isActive: false })
                .expect(400);
        });
    });

    describe('PATCH /polls/:id/public', () => {
        let pollId: number;

        beforeEach(async () => {
            const response = await request(httpServer)
                .post('/polls')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(testPoll);
            pollId = response.body.id;
        });

        it('should successfully toggle public status to true', () => {
            return request(httpServer)
                .patch(`/polls/${pollId}/public`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ isPublic: true })
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('isPublic');
                    expect(res.body.isPublic).toBe(true);
                });
        });

        it('should successfully toggle public status to false', async () => {
            await request(httpServer)
                .patch(`/polls/${pollId}/public`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ isPublic: true });

            return request(httpServer)
                .patch(`/polls/${pollId}/public`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ isPublic: false })
                .expect(200)
                .expect((res) => {
                    expect(res.body.isPublic).toBe(false);
                });
        });

        it('should allow another user to view poll when isPublic is true', async () => {

            await request(httpServer)
                .patch(`/polls/${pollId}/public`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ isPublic: true });

            const anotherUser = {
                name: 'Another User',
                email: 'another_public@example.com',
                password: 'Test123!',
            };

            const registerResponse = await request(httpServer)
                .post('/auth/register')
                .send(anotherUser);

            const anotherAccessToken = registerResponse.body.accessToken;

            return request(httpServer)
                .get(`/polls/${pollId}`)
                .set('Authorization', `Bearer ${anotherAccessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.id).toBe(pollId);
                    expect(res.body.isPublic).toBe(true);
                });
        });

        it('should return 403 when user is not the owner', async () => {
            const anotherUser = {
                name: 'Another User',
                email: 'another_public2@example.com',
                password: 'Test123!',
            };

            const registerResponse = await request(httpServer)
                .post('/auth/register')
                .send(anotherUser);

            const anotherAccessToken = registerResponse.body.accessToken;

            return request(httpServer)
                .patch(`/polls/${pollId}/public`)
                .set('Authorization', `Bearer ${anotherAccessToken}`)
                .send({ isPublic: true })
                .expect(403)
                .expect((res) => {
                    expect(res.body.message).toBe("You do not have permission to update this poll");
                });
        });

        it('should return 404 when poll not found', () => {
            return request(httpServer)
                .patch('/polls/99999/public')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ isPublic: true })
                .expect(404)
                .expect((res) => {
                    expect(res.body.message).toBe("Poll not found");
                });
        });

        it('should return 401 when no token provided', () => {
            return request(httpServer)
                .patch(`/polls/${pollId}/public`)
                .send({ isPublic: true })
                .expect(401);
        });

        it('should return 400 when isPublic is not a boolean', () => {
            return request(httpServer)
                .patch(`/polls/${pollId}/public`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ isPublic: 'not-a-boolean' })
                .expect(400);
        });

        it('should return 400 when isPublic is missing', () => {
            return request(httpServer)
                .patch(`/polls/${pollId}/public`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({})
                .expect(400);
        });

        it('should return 400 when poll id is invalid', () => {
            return request(httpServer)
                .patch('/polls/invalid/public')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ isPublic: true })
                .expect(400);
        });

        it('should verify that changing public status does not affect active status', async () => {

            await request(httpServer)
                .patch(`/polls/${pollId}/public`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ isPublic: true })
                .expect(200);

            return request(httpServer)
                .get(`/polls/${pollId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.isPublic).toBe(true);
                    expect(res.body.isActive).toBe(true); 
                });
        });

        it('should verify that changing active status does not affect public status', async () => {

            await request(httpServer)
                .patch(`/polls/${pollId}/active`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ isActive: false })
                .expect(200);


            return request(httpServer)
                .patch(`/polls/${pollId}/public`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ isPublic: true })
                .expect(200)
                .expect((res) => {
                    expect(res.body.isPublic).toBe(true);
                });
        });
    });

});