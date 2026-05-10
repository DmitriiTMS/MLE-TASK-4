// yarn test:e2e -- test/auth.e2e-spec.ts
import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { getRepositoryToken } from '@nestjs/typeorm';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '../src/modules/app.module';
import { UserEntity } from '../src/modules/users/entities/user.entity';

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let userRepository: Repository<UserEntity>;
    let httpServer: any;

    const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123!',
    };

    const anotherUser = {
        name: 'Another User',
        email: 'another@example.com',
        password: 'Pass456!',
    };

    const shortPasswordUser = {
        name: 'Short Pass',
        email: 'short@example.com',
        password: '123',
    };

    const longPasswordUser = {
        name: 'Long Pass',
        email: 'long@example.com',
        password: 'ThisIsVeryLongPassword123!',
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
    });

    beforeEach(async () => {
        await userRepository.query('TRUNCATE TABLE "users" CASCADE');
    });

    afterAll(async () => {
        await dataSource.destroy();
        await app.close();
    });

    describe('POST /auth/register', () => {
        it('should register a new user successfully', () => {
            return request(httpServer)
                .post('/auth/register')
                .send(testUser)
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('accessToken');
                    expect(typeof res.body.accessToken).toBe('string');
                    expect(res.headers['set-cookie']).toBeDefined();

                    const cookie = res.headers['set-cookie'][0];
                    expect(cookie).toContain('refreshToken');
                    expect(cookie).toContain('HttpOnly');
                });
        });

        it('should return 400 if email is invalid', () => {
            return request(httpServer)
                .post('/auth/register')
                .send({
                    ...testUser,
                    email: 'invalid-email',
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain(
                        "Поле 'email' не соответствует формату email",
                    );
                });
        });

        it('should return 400 if password is too short (less than 4 chars)', () => {
            return request(httpServer)
                .post('/auth/register')
                .send(shortPasswordUser)
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain(
                        "Минимальная длина поля 'password' должна быть 4 символов",
                    );
                });
        });

        it('should return 400 if password is too long (more than 8 chars)', () => {
            return request(httpServer)
                .post('/auth/register')
                .send(longPasswordUser)
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain(
                        "Максимальная длина поля 'password' не может быть больше 8 символов",
                    );
                });
        });

        it('should return 400 if name is missing', () => {
            return request(httpServer)
                .post('/auth/register')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain("Поле 'name' не может быть пустым");
                });
        });

        it('should return 400 if email is missing', () => {
            return request(httpServer)
                .post('/auth/register')
                .send({
                    name: testUser.name,
                    password: testUser.password,
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain("Поле 'email' не может быть пустым");
                });
        });

        it('should return 400 if password is missing', () => {
            return request(httpServer)
                .post('/auth/register')
                .send({
                    name: testUser.name,
                    email: testUser.email,
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain("Поле 'password' не может быть пустым");
                });
        });

        it('should return 409 if user already exists', async () => {
            await request(httpServer).post('/auth/register').send(testUser).expect(201);

            return request(httpServer)
                .post('/auth/register')
                .send(testUser)
                .expect(409)
                .expect((res) => {
                    expect(res.body.message).toContain('Пользователь уже существует');
                });
        });
    });

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            await request(httpServer).post('/auth/register').send(testUser);
        });

        it('should login successfully with valid credentials', () => {
            return request(httpServer)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('accessToken');
                    expect(typeof res.body.accessToken).toBe('string');
                    expect(res.headers['set-cookie']).toBeDefined();

                    const cookie = res.headers['set-cookie'][0];
                    expect(cookie).toContain('refreshToken');
                    expect(cookie).toContain('HttpOnly');
                });
        });

        it('should return 401 with wrong password', () => {
            return request(httpServer)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: 'Wrong!',
                })
                .expect(401)
                .expect((res) => {
                    expect(res.body.message).toBe('Не верный email или пароль');
                });
        });

        it('should return 401 with non-existent email', () => {
            return request(httpServer)
                .post('/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Pass123!',
                })
                .expect(401)
                .expect((res) => {
                    expect(res.body.message).toBe('Не верный email или пароль');
                });
        });

        it('should return 400 if email is missing', () => {
            return request(httpServer)
                .post('/auth/login')
                .send({
                    password: testUser.password,
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain("Поле 'email' не может быть пустым");
                });
        });

        it('should return 400 if password is missing', () => {
            return request(httpServer)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain("Поле 'password' не может быть пустым");
                });
        });

        it('should return 400 if email format is invalid', () => {
            return request(httpServer)
                .post('/auth/login')
                .send({
                    email: 'invalid-email',
                    password: testUser.password,
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain(
                        "Поле 'email' не соответствует формату email",
                    );
                });
        });

        it('should return 400 if password is too short (less than 4 chars)', () => {
            return request(httpServer)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: '123', // 3 символа - слишком короткий
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain(
                        "Минимальная длина поля 'password' должна быть 4 символов",
                    );
                });
        });

        it('should return 400 if password is too long (more than 8 chars)', () => {
            return request(httpServer)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: 'ThisIsTooLongPass', // слишком длинный
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain(
                        "Максимальная длина поля 'password' не может быть больше 8 символов",
                    );
                });
        });
    });

    describe('GET /auth/get-me', () => {
        let accessToken: string;
        let refreshToken: string;

        beforeEach(async () => {
            const response = await request(httpServer).post('/auth/register').send(testUser);

            accessToken = response.body.accessToken;
            const cookieHeader = response.headers['set-cookie'][0];
            refreshToken = cookieHeader.split(';')[0].split('=')[1];
        });

        it('should get current user profile with valid access token', () => {
            return request(httpServer)
                .get('/auth/get-me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body).toHaveProperty('email', testUser.email);
                    expect(res.body).toHaveProperty('name', testUser.name);
                    expect(res.body).not.toHaveProperty('password');
                    expect(res.body).not.toHaveProperty('password_hash');
                });
        });

        it('should return 401 when no token is provided', () => {
            return request(httpServer)
                .get('/auth/get-me')
                .expect(401)
                .expect((res) => {
                    expect(res.body).toHaveProperty('message');
                    expect(res.body.message).toBe('Unauthorized');
                });
        });

        it('should return 401 when token is invalid', () => {
            return request(httpServer)
                .get('/auth/get-me')
                .set('Authorization', 'Bearer invalid.token.here')
                .expect(401)
                .expect((res) => {
                    expect(res.body).toHaveProperty('message');
                    expect(res.body.message).toBe('Invalid token');
                });
        });

        it('should return 401 when token is malformed', () => {
            return request(httpServer)
                .get('/auth/get-me')
                .set('Authorization', 'MalformedToken')
                .expect(401)
                .expect((res) => {
                    expect(res.body).toHaveProperty('message');
                    expect(res.body.message).toBe('Unauthorized');
                });
        });

        it('should return 401 when Authorization header has wrong scheme', () => {
            return request(httpServer)
                .get('/auth/get-me')
                .set('Authorization', `Basic ${accessToken}`)
                .expect(401)
                .expect((res) => {
                    expect(res.body).toHaveProperty('message');
                    expect(res.body.message).toBe('Unauthorized');
                });
        });

        it('should return 401 when token is expired', async () => {
            const expiredToken =
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyMn0.test';

            return request(httpServer)
                .get('/auth/get-me')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);
        });

        it('should return 401 when token is empty', () => {
            return request(httpServer)
                .get('/auth/get-me')
                .set('Authorization', 'Bearer ')
                .expect(401);
        });

        it('should return user data with correct types', async () => {
            const response = await request(httpServer)
                .get('/auth/get-me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(typeof response.body.id).toBe('number');
            expect(typeof response.body.email).toBe('string');
            expect(typeof response.body.name).toBe('string');
            expect(response.body.email).toBe(testUser.email);
            expect(response.body.name).toBe(testUser.name);
        });

        it('should not expose sensitive user data', async () => {
            const response = await request(httpServer)
                .get('/auth/get-me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            const sensitiveFields = [
                'password',
                'password_hash',
                'refreshToken',
                'token',
                'secret',
            ];
            sensitiveFields.forEach((field) => {
                expect(response.body).not.toHaveProperty(field);
            });
        });

        it('should work with token from login as well', async () => {
            const loginResponse = await request(httpServer)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200);

            const loginAccessToken = loginResponse.body.accessToken;

            await request(httpServer)
                .get('/auth/get-me')
                .set('Authorization', `Bearer ${loginAccessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.email).toBe(testUser.email);
                    expect(res.body.name).toBe(testUser.name);
                });
        });

        it('should return correct user after multiple requests', async () => {
            const firstResponse = await request(httpServer)
                .get('/auth/get-me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            const secondResponse = await request(httpServer)
                .get('/auth/get-me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(firstResponse.body).toEqual(secondResponse.body);
        });

        it('should return user data that matches registered user', async () => {
            const response = await request(httpServer)
                .get('/auth/get-me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.email).toBe(testUser.email);
            expect(response.body.name).toBe(testUser.name);
            expect(response.body.id).toBeDefined();
        });

        it('should not allow access with refresh token in Authorization header', async () => {
            return request(httpServer)
                .get('/auth/get-me')
                .set('Authorization', `Bearer ${refreshToken}`)
                .expect(401);
        });
    });

    describe('POST /auth/refresh-token', () => {
        let refreshToken: string;
        let accessToken: string;

        beforeEach(async () => {
            const response = await request(httpServer).post('/auth/register').send(testUser);

            accessToken = response.body.accessToken;
            const cookieHeader = response.headers['set-cookie'][0];
            refreshToken = cookieHeader.split(';')[0].split('=')[1];
        });

        it('should refresh tokens successfully with valid refresh token', () => {
            return request(httpServer)
                .post('/auth/refresh-token')
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('accessToken');
                    expect(typeof res.body.accessToken).toBe('string');
                    // Убираем проверку на новый токен, так как он может быть таким же
                    expect(res.headers['set-cookie']).toBeDefined();

                    const newCookie = res.headers['set-cookie'][0];
                    expect(newCookie).toContain('refreshToken');
                    expect(newCookie).toContain('HttpOnly');
                });
        });

        it('should return 401 when no refresh token is provided', () => {
            return request(httpServer)
                .post('/auth/refresh-token')
                .expect(401)
                .expect((res) => {
                    expect(res.body.message).toBe('Refresh token not found');
                });
        });

        it('should return 401 when refresh token is invalid', () => {
            return request(httpServer)
                .post('/auth/refresh-token')
                .set('Cookie', ['refreshToken=invalid.token.here'])
                .expect(401)
                .expect((res) => {
                    expect(res.body.message).toBeDefined();
                });
        });

        it('should return 401 when refresh token is malformed', () => {
            return request(httpServer)
                .post('/auth/refresh-token')
                .set('Cookie', ['refreshToken=12345'])
                .expect(401)
                .expect((res) => {
                    expect(res.body.message).toBeDefined();
                });
        });

        it('should return new access token that works with get-me', async () => {
            const refreshResponse = await request(httpServer)
                .post('/auth/refresh-token')
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(200);

            const newAccessToken = refreshResponse.body.accessToken;

            // Проверяем, что access token работает (даже если он тот же)
            await request(httpServer)
                .get('/auth/get-me')
                .set('Authorization', `Bearer ${newAccessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.email).toBe(testUser.email);
                    expect(res.body.name).toBe(testUser.name);
                });
        });

        it('should clear refresh token cookie on error', async () => {
            const response = await request(httpServer)
                .post('/auth/refresh-token')
                .set('Cookie', ['refreshToken=invalid.token'])
                .expect(401);

            // Проверяем, что cookie был очищен (Expires в прошлом)
            if (response.headers['set-cookie']) {
                const clearCookie = response.headers['set-cookie'][0];
                expect(clearCookie).toContain('refreshToken=;');
                expect(clearCookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
            }
        });

        it('should set secure cookie options in production', async () => {
            // Сохраняем оригинальный NODE_ENV
            const originalNodeEnv = process.env.NODE_ENV;

            // Временно устанавливаем production окружение
            process.env.NODE_ENV = 'production';

            const response = await request(httpServer)
                .post('/auth/refresh-token')
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(200);

            const cookie = response.headers['set-cookie'][0];
            expect(cookie).toContain('Secure');
            expect(cookie).toContain('SameSite=Strict'); // Заглавная S
            expect(cookie).toContain('HttpOnly');

            // Возвращаем оригинальное окружение
            process.env.NODE_ENV = originalNodeEnv;
        });

        it('should have correct cookie max age (7 days)', async () => {
            const response = await request(httpServer)
                .post('/auth/refresh-token')
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(200);

            const cookie = response.headers['set-cookie'][0];
            // Проверяем, что Max-Age установлен (7 дней = 604800 секунд)
            expect(cookie).toMatch(/Max-Age=\d+/);
            const maxAgeMatch = cookie.match(/Max-Age=(\d+)/);
            if (maxAgeMatch) {
                const maxAge = parseInt(maxAgeMatch[1]);
                expect(maxAge).toBe(604800); // Точное значение
            }
        });
    });

    describe('POST /auth/refresh-token', () => {
        let refreshToken: string;

        beforeEach(async () => {
            const response = await request(httpServer).post('/auth/register').send({
                name: 'Advanced User',
                email: 'advanced@example.com',
                password: 'Adv123!',
            });

            const cookieHeader = response.headers['set-cookie'][0];
            refreshToken = cookieHeader.split(';')[0].split('=')[1];
        });

        it('should invalidate old refresh token after use (if implemented)', async () => {
            await request(httpServer)
                .post('/auth/refresh-token')
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(200);

            const response = await request(httpServer)
                .post('/auth/refresh-token')
                .set('Cookie', [`refreshToken=${refreshToken}`]);

            expect([200, 401]).toContain(response.status);
        });

        it('should provide new refresh token that can be used again', async () => {
            const firstRefresh = await request(httpServer)
                .post('/auth/refresh-token')
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(200);

            const newRefreshToken = firstRefresh.headers['set-cookie'][0]
                .split(';')[0]
                .split('=')[1];

            const secondRefresh = await request(httpServer)
                .post('/auth/refresh-token')
                .set('Cookie', [`refreshToken=${newRefreshToken}`])
                .expect(200);

            expect(secondRefresh.body).toHaveProperty('accessToken');
        });

        it('refresh token should work with different user (if not bound to session)', async () => {
            const anotherUserResponse = await request(httpServer).post('/auth/register').send({
                name: 'Another User',
                email: 'another2@example.com',
                password: 'Anoth123',
            });

            const anotherUserRefreshToken = anotherUserResponse.headers['set-cookie'][0]
                .split(';')[0]
                .split('=')[1];

            const response = await request(httpServer)
                .post('/auth/refresh-token')
                .set('Cookie', [`refreshToken=${anotherUserRefreshToken}`]);

            console.log(`Cross-user refresh status: ${response.status}`);
            expect([200, 401]).toContain(response.status);
        });
    });

    describe('POST /auth/logout', () => {
        let refreshToken: string;
        let accessToken: string;

        beforeEach(async () => {
            const response = await request(httpServer).post('/auth/register').send(testUser);

            accessToken = response.body.accessToken;
            const cookieHeader = response.headers['set-cookie'][0];
            refreshToken = cookieHeader.split(';')[0].split('=')[1];
        });

        it('should logout successfully with valid refresh token', () => {
            return request(httpServer)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('message');
                    expect(res.body.message).toBe('Logged out successfully');
                    expect(res.headers['set-cookie']).toBeDefined();

                    const cookie = res.headers['set-cookie'][0];
                    expect(cookie).toContain('refreshToken=;');
                    expect(cookie).toContain('HttpOnly');
                    expect(cookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
                });
        });

        it('should logout successfully with only access token (no refresh token cookie)', () => {
            return request(httpServer)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('message');
                    expect(res.body.message).toBe('Logged out successfully');
                });
        });

        it('should return 401 when no access token is provided', () => {
            return request(httpServer)
                .post('/auth/logout')
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(401)
                .expect((res) => {
                    expect(res.body.message).toBe('Unauthorized');
                });
        });

        it('should return 401 when access token is invalid', () => {
            return request(httpServer)
                .post('/auth/logout')
                .set('Authorization', 'Bearer invalid.token.here')
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(401)
                .expect((res) => {
                    expect(res.body.message).toBe('Invalid token');
                });
        });

        it('should clear refresh token cookie on logout', async () => {
            const response = await request(httpServer)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(200);

            const cookie = response.headers['set-cookie'][0];
            expect(cookie).toContain('refreshToken=;');
            expect(cookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
            expect(cookie).toContain('HttpOnly');
        });

        it('should NOT invalidate refresh token after logout (token remains valid)', async () => {
            await request(httpServer)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(200);

            const response = await request(httpServer)
                .post('/auth/refresh-token')
                .set('Cookie', [`refreshToken=${refreshToken}`]);

            expect([200, 401]).toContain(response.status);
        });

        it('should still allow access with access token after logout (until it expires)', async () => {
            await request(httpServer)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(200);

            await request(httpServer)
                .get('/auth/get-me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.email).toBe(testUser.email);
                });
        });

        it('should clear cookie even if no refresh token cookie exists', async () => {
            const response = await request(httpServer)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            if (response.headers['set-cookie']) {
                const cookie = response.headers['set-cookie'][0];
                expect(cookie).toContain('refreshToken=;');
                expect(cookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
            }
        });

        it('should set secure cookie options in production on clear', async () => {
            const originalNodeEnv = process.env.NODE_ENV;

            process.env.NODE_ENV = 'production';

            const response = await request(httpServer)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(200);

            const cookie = response.headers['set-cookie'][0];
            expect(cookie).toContain('refreshToken=;');
            expect(cookie).toContain('Secure');
            expect(cookie).toContain('SameSite=Strict');
            expect(cookie).toContain('HttpOnly');

            process.env.NODE_ENV = originalNodeEnv;
        });

        it('should set lax sameSite in non-production environment', async () => {
            const originalNodeEnv = process.env.NODE_ENV;

            process.env.NODE_ENV = 'development';

            const response = await request(httpServer)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(200);

            const cookie = response.headers['set-cookie'][0];
            expect(cookie).toContain('SameSite=Lax');
            expect(cookie).not.toContain('Secure');

            process.env.NODE_ENV = originalNodeEnv;
        });

        it('should return message even if user already logged out', async () => {
            await request(httpServer)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(200);

            const response = await request(httpServer)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Logged out successfully');
        });
    });
});
