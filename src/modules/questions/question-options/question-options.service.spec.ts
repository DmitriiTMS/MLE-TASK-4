import { BadRequestException, ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QuestionOptionsService } from './question-options.service';
import { IQuestionOptionsRepository } from './question-options.repository.interface';
import { IQuestionsRepository } from '../questions-variant/questions.repository.interface';
import { IPollsRepository } from '../../polls/polls.repository.interface';

import { POLLS_MESSAGE } from '../../polls/constants/types.message';
import { QUESTIONS_MESSAGE } from '../questions-variant/constants/types.messages';
import { OPTIONS_MESSAGE } from './constants/types-messages';

import { QUESTIONS_INJECTION_TOKENS } from '../questions-variant/constants/questions-injection-tokens';
import { POLL_INJECTION_TOKENS } from '../../polls/constants/poll-injection-tokens';
import { OPTIONS_INJECTION_TOKENS } from './constants/option-injection-tokens';

import { PollEntity } from '../../polls/domain/polls.entity';
import { QuestionEntity } from '../questions-variant/domain/questions.entity';
import { UserEntity } from '../../users/domain/user.entity';
import { QuestionOptionEntity } from './domain/question-options.entity';
import { QuestionType } from '../questions-variant/constants/question-type.enum';
import { CreateOptionDto } from './dto/create-question-option.dto';

// yarn test -- src/modules/questions/question-options/question-options.service.spec.ts

describe('QuestionOptionsService', () => {
    let service: QuestionOptionsService;
    let questionsRepository: jest.Mocked<IQuestionsRepository>;
    let pollsRepository: jest.Mocked<IPollsRepository>;
    let questionOptionsRepository: jest.Mocked<IQuestionOptionsRepository>;
    let logger: jest.Mocked<Logger>;

    const mockCreateUser = {
        id: 100,
        name: 'Test User',
        email: 'test@example.com',
    } as UserEntity;

    const createMockPoll = (overrides?: Partial<PollEntity>): PollEntity => {
        const mockPoll = {
            id: 1,
            title: 'Test Poll',
            description: 'Test Description',
            isActive: true,
            isPublic: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            createUser: mockCreateUser,
            questions: [],
            belongsToUser: jest.fn().mockReturnValue(true),
            isPublicStatus: jest.fn().mockReturnValue(true),
            update: jest.fn(),
            toResponse: jest.fn(),
            toResponseList: jest.fn(),
            fromJSON: jest.fn(),
            fromJSONArray: jest.fn(),
            toResponsePollWithQuestions: jest.fn(),
            ...overrides,
        } as PollEntity;

        return mockPoll;
    };

    const createMockQuestionOption = (id: number, text: string, orderNum: number): QuestionOptionEntity => {
        return {
            id,
            questionId: 10,
            text,
            orderNum,
            question: null as any,
            createInstance: jest.fn().mockReturnThis(),
            toEntity: jest.fn().mockReturnThis(),
        } as unknown as QuestionOptionEntity;
    };

    const createMockQuestion = (overrides?: Partial<QuestionEntity>): QuestionEntity => {
        const mockQuestion = {
            id: 10,
            pollId: 1,
            text: 'Test Question?',
            type: 'single' as QuestionType,
            orderNum: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            poll: createMockPoll(),
            questionOptions: [
                createMockQuestionOption(1, 'Option A', 1),
                createMockQuestionOption(2, 'Option B', 2),
            ],
            createInstance: jest.fn(),
            updateWithOptions: jest.fn(),
            toResponse: jest.fn(),
            ...overrides,
        } as QuestionEntity;

        return mockQuestion;
    };

    let mockPoll: PollEntity;
    let mockQuestion: QuestionEntity;

    const createOptionDto: CreateOptionDto = {
        text: 'New Option',
        orderNum: 3,
    };

    beforeEach(async () => {
        mockPoll = createMockPoll();
        mockQuestion = createMockQuestion();

        const mockQuestionsRepository = {
            findOneQuestion: jest.fn(),
        };

        const mockPollsRepository = {
            findById: jest.fn(),
        };

        const mockQuestionOptionsRepository = {
            createOption: jest.fn(),
            findOptionById: jest.fn(),
            deleteOption: jest.fn(),
        };

        const mockLogger = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuestionOptionsService,
                {
                    provide: Logger,
                    useValue: mockLogger,
                },
                {
                    provide: QUESTIONS_INJECTION_TOKENS.IQUESTIONS_REPOSITORY,
                    useValue: mockQuestionsRepository,
                },
                {
                    provide: POLL_INJECTION_TOKENS.IPOLL_REPOSITORY,
                    useValue: mockPollsRepository,
                },
                {
                    provide: OPTIONS_INJECTION_TOKENS.IOPTIONS_REPOSITORY,
                    useValue: mockQuestionOptionsRepository,
                },
            ],
        }).compile();

        service = module.get<QuestionOptionsService>(QuestionOptionsService);
        questionsRepository = module.get(QUESTIONS_INJECTION_TOKENS.IQUESTIONS_REPOSITORY);
        pollsRepository = module.get(POLL_INJECTION_TOKENS.IPOLL_REPOSITORY);
        questionOptionsRepository = module.get(OPTIONS_INJECTION_TOKENS.IOPTIONS_REPOSITORY);
        logger = module.get(Logger);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createOption', () => {
        const data = {
            userId: 100,
            questionId: 10,
            createOptionDto,
        };

        const savedOption = createMockQuestionOption(3, 'New Option', 3);

        it('should successfully create an option', async () => {
            questionsRepository.findOneQuestion.mockResolvedValue(mockQuestion);
            pollsRepository.findById.mockResolvedValue(mockPoll);
            questionOptionsRepository.createOption.mockResolvedValue(savedOption);

            const result = await service.createOption(data);

            expect(result).toEqual(savedOption);
            expect(questionsRepository.findOneQuestion).toHaveBeenCalledWith(10);
            expect(pollsRepository.findById).toHaveBeenCalledWith(1);
            expect(questionOptionsRepository.createOption).toHaveBeenCalledTimes(1);
            expect(logger.log).toHaveBeenCalledWith(
                expect.stringContaining('createOption'),
            );
        });

        it('should throw NotFoundException when question does not exist', async () => {
            questionsRepository.findOneQuestion.mockResolvedValue(null);

            await expect(service.createOption(data)).rejects.toThrow(
                new NotFoundException(QUESTIONS_MESSAGE.QUESTION_NOT_FOUND),
            );

            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Question with ID: 10 not found'),
            );
            expect(questionOptionsRepository.createOption).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException when poll does not exist', async () => {
            questionsRepository.findOneQuestion.mockResolvedValue(mockQuestion);
            pollsRepository.findById.mockResolvedValue(null);

            await expect(service.createOption(data)).rejects.toThrow(
                new NotFoundException(POLLS_MESSAGE.POLL_NOT_FOUND),
            );

            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Poll with ID: 1 not found'),
            );
            expect(questionOptionsRepository.createOption).not.toHaveBeenCalled();
        });

        it('should throw ForbiddenException when user is not the poll creator', async () => {
            const pollWithDifferentUser = createMockPoll();
            pollWithDifferentUser.belongsToUser = jest.fn().mockReturnValue(false);

            questionsRepository.findOneQuestion.mockResolvedValue(mockQuestion);
            pollsRepository.findById.mockResolvedValue(pollWithDifferentUser);

            await expect(service.createOption(data)).rejects.toThrow(
                new ForbiddenException(QUESTIONS_MESSAGE.USER_NOT_THE_SURVEY_CREATOR),
            );

            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining(QUESTIONS_MESSAGE.USER_NOT_THE_SURVEY_CREATOR),
            );
            expect(questionOptionsRepository.createOption).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException when orderNum already exists', async () => {
            questionsRepository.findOneQuestion.mockResolvedValue(mockQuestion);
            pollsRepository.findById.mockResolvedValue(mockPoll);

            const dataWithDuplicateOrderNum = {
                ...data,
                createOptionDto: { ...createOptionDto, orderNum: 1 },
            };

            await expect(service.createOption(dataWithDuplicateOrderNum)).rejects.toThrow(
                new BadRequestException(OPTIONS_MESSAGE.OPTION_ORDER_NUMBER),
            );

            expect(questionOptionsRepository.createOption).not.toHaveBeenCalled();
        });

        it('should handle repository error when creating option', async () => {
            questionsRepository.findOneQuestion.mockResolvedValue(mockQuestion);
            pollsRepository.findById.mockResolvedValue(mockPoll);
            questionOptionsRepository.createOption.mockRejectedValue(new Error('Database error'));

            await expect(service.createOption(data)).rejects.toThrow('Database error');

            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Database error'),
            );
        });
    });

    describe('deleteOption', () => {
        const data = {
            userId: 100,
            questionId: 10,
            optionId: 1,
        };

        const existingOption = createMockQuestionOption(1, 'Option A', 1);

        it('should successfully delete an option', async () => {
            questionsRepository.findOneQuestion.mockResolvedValue(mockQuestion);
            pollsRepository.findById.mockResolvedValue(mockPoll);
            questionOptionsRepository.findOptionById.mockResolvedValue(existingOption);
            questionOptionsRepository.deleteOption.mockResolvedValue(undefined);

            await expect(service.deleteOption(data)).resolves.toBeUndefined();

            expect(questionsRepository.findOneQuestion).toHaveBeenCalledWith(10);
            expect(pollsRepository.findById).toHaveBeenCalledWith(1);
            expect(questionOptionsRepository.findOptionById).toHaveBeenCalledWith(1);
            expect(questionOptionsRepository.deleteOption).toHaveBeenCalledWith(1);
            expect(logger.log).toHaveBeenCalledWith(
                expect.stringContaining('optionId:1'),
            );
        });

        it('should throw NotFoundException when question does not exist', async () => {
            questionsRepository.findOneQuestion.mockResolvedValue(null);

            await expect(service.deleteOption(data)).rejects.toThrow(
                new NotFoundException(QUESTIONS_MESSAGE.QUESTION_NOT_FOUND),
            );

            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Question with ID: 10 not found'),
            );
            expect(questionOptionsRepository.deleteOption).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException when poll does not exist', async () => {
            questionsRepository.findOneQuestion.mockResolvedValue(mockQuestion);
            pollsRepository.findById.mockResolvedValue(null);

            await expect(service.deleteOption(data)).rejects.toThrow(
                new NotFoundException(POLLS_MESSAGE.POLL_NOT_FOUND),
            );

            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Poll with ID: 1 not found'),
            );
            expect(questionOptionsRepository.deleteOption).not.toHaveBeenCalled();
        });

        it('should throw ForbiddenException when user is not the poll creator', async () => {
            const pollWithDifferentUser = createMockPoll();
            pollWithDifferentUser.belongsToUser = jest.fn().mockReturnValue(false);

            questionsRepository.findOneQuestion.mockResolvedValue(mockQuestion);
            pollsRepository.findById.mockResolvedValue(pollWithDifferentUser);

            await expect(service.deleteOption(data)).rejects.toThrow(
                new ForbiddenException(QUESTIONS_MESSAGE.USER_NOT_THE_SURVEY_CREATOR),
            );

            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining(QUESTIONS_MESSAGE.USER_NOT_THE_SURVEY_CREATOR),
            );
            expect(questionOptionsRepository.deleteOption).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException when option does not exist', async () => {
            questionsRepository.findOneQuestion.mockResolvedValue(mockQuestion);
            pollsRepository.findById.mockResolvedValue(mockPoll);
            questionOptionsRepository.findOptionById.mockResolvedValue(null);

            await expect(service.deleteOption(data)).rejects.toThrow(
                new NotFoundException(`Option with ID ${data.optionId} not found`),
            );

            expect(questionOptionsRepository.deleteOption).not.toHaveBeenCalled();
        });

        it('should handle repository error when deleting option', async () => {
            questionsRepository.findOneQuestion.mockResolvedValue(mockQuestion);
            pollsRepository.findById.mockResolvedValue(mockPoll);
            questionOptionsRepository.findOptionById.mockResolvedValue(existingOption);
            questionOptionsRepository.deleteOption.mockRejectedValue(new Error('Database error'));

            await expect(service.deleteOption(data)).rejects.toThrow('Database error');

            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Database error'),
            );
        });

        it('should delete option even if question has multiple options', async () => {
            const questionWithManyOptions = createMockQuestion({
                questionOptions: [
                    createMockQuestionOption(1, 'Option 1', 1),
                    createMockQuestionOption(2, 'Option 2', 2),
                    createMockQuestionOption(3, 'Option 3', 3),
                    createMockQuestionOption(4, 'Option 4', 4),
                ],
            });

            questionsRepository.findOneQuestion.mockResolvedValue(questionWithManyOptions);
            pollsRepository.findById.mockResolvedValue(mockPoll);
            questionOptionsRepository.findOptionById.mockResolvedValue(existingOption);
            questionOptionsRepository.deleteOption.mockResolvedValue(undefined);

            await expect(service.deleteOption(data)).resolves.toBeUndefined();

            expect(questionOptionsRepository.deleteOption).toHaveBeenCalledWith(1);
        });
    });
});