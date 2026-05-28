import { DataSource } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { PollEntity } from '../../polls/entities/polls.entity';
import { QuestionEntity } from '../../questions/entities/questions.entity';
import { QuestionOptionEntity } from '../../questions/entities/question-options.entity';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';

//yarn seed

dotenv.config();

async function seed() {
    console.log('Starting database seed...');

    // Создаем подключение к БД с правильной обработкой порта
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5433,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'pass',
        database: process.env.DB_DATABASE || 'voting_system_dev',
        entities: [UserEntity, PollEntity, QuestionEntity, QuestionOptionEntity],
        synchronize: false, // Лучше использовать миграции
    });

    await dataSource.initialize();

    // Получаем репозитории
    const userRepository = dataSource.getRepository(UserEntity);
    const pollRepository = dataSource.getRepository(PollEntity);
    const questionRepository = dataSource.getRepository(QuestionEntity);
    const questionOptionRepository = dataSource.getRepository(QuestionOptionEntity);

    // Очищаем таблицы с помощью QueryRunner (работает во всех версиях)
    console.log('Cleaning database...');
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
        // Удаляем все записи в правильном порядке
        await queryRunner.query('DELETE FROM "question_options"');
        await queryRunner.query('DELETE FROM "questions"');
        await queryRunner.query('DELETE FROM "polls"');
        await queryRunner.query('DELETE FROM "users"');

        // Сбрасываем последовательности (чтобы id начинались с 1)
        await queryRunner.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
        await queryRunner.query('ALTER SEQUENCE polls_id_seq RESTART WITH 1');
        await queryRunner.query('ALTER SEQUENCE questions_id_seq RESTART WITH 1');
        await queryRunner.query('ALTER SEQUENCE question_options_id_seq RESTART WITH 1');

        console.log('Database cleaned');
    } finally {
        await queryRunner.release();
    }

    // Хешируем пароли с помощью argon2
    const passwordHash = await argon2.hash('1234');

    // Создаем пользователей
    const user1 = UserEntity.createInstance('user1', 'u1@bk.ru', passwordHash);
    const user2 = UserEntity.createInstance('user2', 'u2@bk.ru', passwordHash);
    const [savedUser1, savedUser2] = await userRepository.save([user1, user2]);

    // Создаем опросы
    const poll1 = PollEntity.createInstance(
        'Опрос о предпочтениях в IT',
        'Расскажите о ваших предпочтениях в программировании',
        savedUser1
    );
    const poll2 = PollEntity.createInstance(
        'Опрос о здоровом образе жизни',
        'Поделитесь своими привычками',
        savedUser2
    );
    const [savedPoll1, savedPoll2] = await pollRepository.save([poll1, poll2]);

    // Данные для вопросов и опций (оптимизированная структура)
    const questionsData = [
        // Опрос 1
        {
            pollId: savedPoll1.id,
            text: 'Какой язык программирования вы предпочитаете?',
            orderNum: 1,
            type: 'single' as const,
            options: ['JavaScript/TypeScript', 'Python', 'Java', 'Go', 'Rust']
        },
        {
            pollId: savedPoll1.id,
            text: 'Какие IDE вы используете?',
            orderNum: 2,
            type: 'multiple' as const,
            options: ['VS Code', 'IntelliJ IDEA', 'PyCharm', 'WebStorm', 'Vim/Neovim']
        },
        {
            pollId: savedPoll1.id,
            text: 'Какой у вас опыт работы с базами данных?',
            orderNum: 3,
            type: 'single' as const,
            options: ['Начинающий (менее 1 года)', 'Средний (1-3 года)', 'Продвинутый (3-5 лет)', 'Эксперт (более 5 лет)']
        },
        {
            pollId: savedPoll1.id,
            text: 'Какие технологии вы изучаете в данный момент?',
            orderNum: 4,
            type: 'multiple' as const,
            options: ['React/Vue/Angular', 'Node.js', 'Docker/Kubernetes', 'GraphQL', 'Machine Learning']
        },
        {
            pollId: savedPoll1.id,
            text: 'Как часто вы участвуете в code review?',
            orderNum: 5,
            type: 'single' as const,
            options: ['Ежедневно', 'Несколько раз в неделю', 'Раз в неделю', 'Редко']
        },

        // Опрос 2
        {
            pollId: savedPoll2.id,
            text: 'Как часто вы занимаетесь спортом?',
            orderNum: 1,
            type: 'single' as const,
            options: ['Ежедневно', '3-5 раз в неделю', '1-2 раза в неделю', 'Несколько раз в месяц', 'Не занимаюсь']
        },
        {
            pollId: savedPoll2.id,
            text: 'Какие виды физической активности предпочитаете?',
            orderNum: 2,
            type: 'multiple' as const,
            options: ['Бег/ходьба', 'Фитнес/тренажерный зал', 'Йога/стретчинг', 'Плавание', 'Командные виды спорта']
        },
        {
            pollId: savedPoll2.id,
            text: 'Сколько воды вы выпиваете в день?',
            orderNum: 3,
            type: 'single' as const,
            options: ['Менее 1 литра', '1-1.5 литра', '1.5-2 литра', '2-2.5 литра', 'Более 2.5 литров']
        },
        {
            pollId: savedPoll2.id,
            text: 'Какой у вас режим сна?',
            orderNum: 4,
            type: 'single' as const,
            options: ['Менее 6 часов', '6-7 часов', '7-8 часов', '8-9 часов', 'Более 9 часов']
        },
        {
            pollId: savedPoll2.id,
            text: 'Какие полезные привычки вы практикуете?',
            orderNum: 5,
            type: 'multiple' as const,
            options: ['Медитация', 'Ведение дневника', 'Правильное питание', 'Отказ от вредных привычек', 'Регулярные чек-апы у врача']
        },
    ];

    // Создаем вопросы и опции в транзакции
    await dataSource.transaction(async (manager) => {
        for (const qData of questionsData) {
            const question = QuestionEntity.createInstance(
                qData.pollId,
                qData.text,
                qData.orderNum,
                qData.type
            );
            const savedQuestion = await manager.save(question);

            // Создаем опции для вопроса
            const options = qData.options.map((text, idx) =>
                QuestionOptionEntity.createInstance(savedQuestion.id, text, idx + 1)
            );
            await manager.save(options);
        }
    });

    const usersCount = await userRepository.count();
    const pollsCount = await pollRepository.count();
    const questionsCount = await questionRepository.count();
    const optionsCount = await questionOptionRepository.count();

    console.log('✅ Seed completed successfully!');
    console.log(`📊 Statistics:`);
    console.log(`   - Users: ${usersCount}`);
    console.log(`   - Polls: ${pollsCount}`);
    console.log(`   - Questions: ${questionsCount}`);
    console.log(`   - Question options: ${optionsCount}`);

    await dataSource.destroy();
}

seed().catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
});