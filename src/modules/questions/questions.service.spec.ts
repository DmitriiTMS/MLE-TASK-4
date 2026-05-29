import { ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { IQuestionsRepository } from './questions.repository.interface';
import { IPollsRepository } from '../polls/polls.repository.interface';
import { PollEntity } from '../polls/entities/polls.entity';
import { QuestionEntity } from './entities/questions.entity';
import { QuestionOptionEntity } from '../question-options/entities/question-options.entity';
import { IDataRequestQuestion, QuestionType } from './constants/types';
import { UpdateQuestionWithOptionsDto } from './dto/update-question-with-options.dto';
import { POLLS_MESSAGE } from '../polls/constants/types.message';
import { QUESTIONS_MESSAGE } from './constants/types.messages';
import { UserEntity } from '../users/entities/user.entity';
import { QUESTIONS_INJECTION_TOKENS } from './constants/questions-injection-tokens';
import { POLL_INJECTION_TOKENS } from '../polls/constants/poll-injection-tokens';

// yarn test -- src/modules/questions/questions.service.spec.ts

describe('QuestionsService', () => {
    let service: QuestionsService;
    let pollsRepository: jest.Mocked<IPollsRepository>;
    let questionsRepository: jest.Mocked<IQuestionsRepository>;
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
            createInstance: jest.fn(),
        } as QuestionOptionEntity;
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
    let mockPollWithQuestions: PollEntity;

    const createQuestionDto = {
        text: 'New Question?',
        type: 'multiple' as QuestionType,
        orderNum: 2,
        options: [
            { text: 'Option 1', orderNum: 1 },
            { text: 'Option 2', orderNum: 2 },
        ],
    };

    const updateQuestionDto: UpdateQuestionWithOptionsDto = {
        text: 'Updated Question?',
        type: 'single' as QuestionType,
        orderNum: 1,
        options: [
            { text: 'Updated Option 1', orderNum: 1 },
            { text: 'Updated Option 2', orderNum: 2 },
        ],
    };

    beforeEach(async () => {
        mockPoll = createMockPoll();
        mockQuestion = createMockQuestion();
        mockPollWithQuestions = createMockPoll({ questions: [mockQuestion] });

        const mockPollsRepository = {
            findById: jest.fn(),
        };

        const mockQuestionsRepository = {
            createQuestion: jest.fn(),
            findPollWithQuestions: jest.fn(),
            findQuestion: jest.fn(),
            updateQuestionWithOptions: jest.fn(),
            deleteQuestionWithOptions: jest.fn(),
        };

        const mockLogger = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuestionsService,
                {
                    provide: Logger,
                    useValue: mockLogger,
                },
                {
                    provide: POLL_INJECTION_TOKENS.IPOLL_REPOSITORY,
                    useValue: mockPollsRepository,
                },
                {
                    provide: QUESTIONS_INJECTION_TOKENS.IQUESTIONS_REPOSITORY,
                    useValue: mockQuestionsRepository,
                },
            ],
        }).compile();

        service = module.get<QuestionsService>(QuestionsService);
        pollsRepository = module.get(POLL_INJECTION_TOKENS.IPOLL_REPOSITORY);
        questionsRepository = module.get(QUESTIONS_INJECTION_TOKENS.IQUESTIONS_REPOSITORY);
        logger = module.get(Logger);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createQuestionWithOptions', () => {
        const data: IDataRequestQuestion = {
            userId: 100,
            pollId: 1,
            createQuestionDto,
        };

        it('should successfully create a question with options', async () => {
            pollsRepository.findById.mockResolvedValue(mockPoll);
            questionsRepository.createQuestion.mockResolvedValue(mockQuestion);

            const result = await service.createQuestionWithOptions(data);

            expect(result).toEqual(mockQuestion);
            expect(pollsRepository.findById).toHaveBeenCalledWith(1);
            expect(questionsRepository.createQuestion).toHaveBeenCalledTimes(1);
            expect(logger.log).toHaveBeenCalledWith(
                expect.stringContaining(QUESTIONS_MESSAGE.QUESTION_CREATED),
            );
        });

        it('should throw NotFoundException when poll does not exist', async () => {
            pollsRepository.findById.mockResolvedValue(null);

            await expect(service.createQuestionWithOptions(data)).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.createQuestionWithOptions(data)).rejects.toThrow(
                POLLS_MESSAGE.POLL_NOT_FOUND,
            );
            expect(logger.warn).toHaveBeenCalled();
            expect(questionsRepository.createQuestion).not.toHaveBeenCalled();
        });

        it('should throw ForbiddenException when user is not the poll creator', async () => {
            const pollWithDifferentUser = createMockPoll({
                belongsToUser: jest.fn().mockReturnValue(false),
            });

            pollsRepository.findById.mockResolvedValue(pollWithDifferentUser);

            await expect(service.createQuestionWithOptions(data)).rejects.toThrow(
                ForbiddenException,
            );
            await expect(service.createQuestionWithOptions(data)).rejects.toThrow(
                QUESTIONS_MESSAGE.USER_NOT_THE_SURVEY_CREATOR,
            );
            expect(logger.warn).toHaveBeenCalled();
            expect(questionsRepository.createQuestion).not.toHaveBeenCalled();
        });

        it('should log error and rethrow when repository throws', async () => {
            pollsRepository.findById.mockResolvedValue(mockPoll);
            const dbError = new Error('Database error');
            questionsRepository.createQuestion.mockRejectedValue(dbError);

            await expect(service.createQuestionWithOptions(data)).rejects.toThrow(
                dbError,
            );
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('findPollWithAllQuestions', () => {
        it('should successfully return poll with questions for owner', async () => {
            pollsRepository.findById.mockResolvedValue(mockPoll);
            questionsRepository.findPollWithQuestions.mockResolvedValue(mockPollWithQuestions);

            const result = await service.findPollWithAllQuestions(100, 1);

            expect(result).toEqual(mockPollWithQuestions);
            expect(pollsRepository.findById).toHaveBeenCalledWith(1);
            expect(questionsRepository.findPollWithQuestions).toHaveBeenCalledWith(1, true);
        });

        it('should successfully return poll with questions for non-owner if public', async () => {
            const publicPoll = createMockPoll({
                belongsToUser: jest.fn().mockReturnValue(false),
                isPublicStatus: jest.fn().mockReturnValue(true),
            });

            pollsRepository.findById.mockResolvedValue(publicPoll);
            questionsRepository.findPollWithQuestions.mockResolvedValue(mockPollWithQuestions);

            const result = await service.findPollWithAllQuestions(200, 1);

            expect(result).toEqual(mockPollWithQuestions);
            expect(questionsRepository.findPollWithQuestions).toHaveBeenCalledWith(1, false);
        });

        it('should throw NotFoundException when poll does not exist', async () => {
            pollsRepository.findById.mockResolvedValue(null);

            await expect(service.findPollWithAllQuestions(100, 1)).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.findPollWithAllQuestions(100, 1)).rejects.toThrow(
                POLLS_MESSAGE.POLL_NOT_FOUND,
            );
        });

        it('should throw ForbiddenException when poll is not public and user is not owner', async () => {
            const privatePoll = createMockPoll({
                belongsToUser: jest.fn().mockReturnValue(false),
                isPublicStatus: jest.fn().mockReturnValue(false),
            });

            pollsRepository.findById.mockResolvedValue(privatePoll);

            await expect(service.findPollWithAllQuestions(200, 1)).rejects.toThrow(
                ForbiddenException,
            );
            await expect(service.findPollWithAllQuestions(200, 1)).rejects.toThrow(
                POLLS_MESSAGE.SURVEY_NOT_AVAILABLE,
            );
        });

        it('should throw ForbiddenException when pollWithQuestions is null', async () => {
            pollsRepository.findById.mockResolvedValue(mockPoll);
            questionsRepository.findPollWithQuestions.mockResolvedValue(null);

            await expect(service.findPollWithAllQuestions(100, 1)).rejects.toThrow(
                ForbiddenException,
            );
            await expect(service.findPollWithAllQuestions(100, 1)).rejects.toThrow(
                POLLS_MESSAGE.SURVEY_NOT_AVAILABLE,
            );
        });
    });

    describe('findQuestion', () => {
        const data = { userId: 100, pollId: 1, questionId: 10 };

        it('should successfully return a question', async () => {
            pollsRepository.findById.mockResolvedValue(mockPoll);
            questionsRepository.findQuestion.mockResolvedValue(mockQuestion);

            const result = await service.findQuestion(data);

            expect(result).toEqual(mockQuestion);
            expect(questionsRepository.findQuestion).toHaveBeenCalledWith(1, 10);
        });

        it('should throw NotFoundException when poll does not exist', async () => {
            pollsRepository.findById.mockResolvedValue(null);

            await expect(service.findQuestion(data)).rejects.toThrow(NotFoundException);
            await expect(service.findQuestion(data)).rejects.toThrow(
                POLLS_MESSAGE.POLL_NOT_FOUND,
            );
        });

        it('should throw ForbiddenException when user is not the poll creator', async () => {
            const pollWithDifferentUser = createMockPoll({
                belongsToUser: jest.fn().mockReturnValue(false),
            });

            pollsRepository.findById.mockResolvedValue(pollWithDifferentUser);

            await expect(service.findQuestion(data)).rejects.toThrow(ForbiddenException);
            await expect(service.findQuestion(data)).rejects.toThrow(
                POLLS_MESSAGE.SURVEY_NOT_AVAILABLE,
            );
        });

        it('should throw NotFoundException when question does not exist', async () => {
            pollsRepository.findById.mockResolvedValue(mockPoll);
            questionsRepository.findQuestion.mockResolvedValue(null);

            await expect(service.findQuestion(data)).rejects.toThrow(NotFoundException);
            await expect(service.findQuestion(data)).rejects.toThrow(
                QUESTIONS_MESSAGE.QUESTION_NOT_FOUND,
            );
        });
    });

    describe('updateQuestion', () => {
        const data = {
            userId: 100,
            pollId: 1,
            questionId: 10,
            updateData: updateQuestionDto,
        };

        it('should successfully update a question with options', async () => {
            const updatedQuestion = createMockQuestion({
                text: 'Updated Question?',
                type: 'single',
                orderNum: 1,
            });

            pollsRepository.findById.mockResolvedValue(mockPoll);
            questionsRepository.findQuestion.mockResolvedValue(mockQuestion);
            questionsRepository.updateQuestionWithOptions.mockResolvedValue(updatedQuestion);

            const result = await service.updateQuestion(data);

            expect(result).toBeDefined();
            expect(result.text).toBe('Updated Question?');
            expect(questionsRepository.updateQuestionWithOptions).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException when poll does not exist', async () => {
            pollsRepository.findById.mockResolvedValue(null);

            await expect(service.updateQuestion(data)).rejects.toThrow(NotFoundException);
            await expect(service.updateQuestion(data)).rejects.toThrow(
                POLLS_MESSAGE.POLL_NOT_FOUND,
            );
        });

        it('should throw ForbiddenException when user is not the poll creator', async () => {
            const pollWithDifferentUser = createMockPoll({
                belongsToUser: jest.fn().mockReturnValue(false),
            });

            pollsRepository.findById.mockResolvedValue(pollWithDifferentUser);

            await expect(service.updateQuestion(data)).rejects.toThrow(ForbiddenException);
            await expect(service.updateQuestion(data)).rejects.toThrow(
                POLLS_MESSAGE.SURVEY_NOT_AVAILABLE,
            );
        });

        it('should throw NotFoundException when question does not exist', async () => {
            pollsRepository.findById.mockResolvedValue(mockPoll);
            questionsRepository.findQuestion.mockResolvedValue(null);

            await expect(service.updateQuestion(data)).rejects.toThrow(NotFoundException);
            await expect(service.updateQuestion(data)).rejects.toThrow(
                QUESTIONS_MESSAGE.QUESTION_NOT_FOUND,
            );
        });
    });

    describe('deleteQuestionWithOptions', () => {
        const data = { userId: 100, pollId: 1, questionId: 10 };

        it('should successfully delete a question with options', async () => {
            pollsRepository.findById.mockResolvedValue(mockPoll);
            questionsRepository.findQuestion.mockResolvedValue(mockQuestion);
            questionsRepository.deleteQuestionWithOptions.mockResolvedValue(undefined);

            await expect(service.deleteQuestionWithOptions(data)).resolves.toBeUndefined();
            expect(questionsRepository.deleteQuestionWithOptions).toHaveBeenCalledWith(1, 10);
        });

        it('should throw NotFoundException when poll does not exist', async () => {
            pollsRepository.findById.mockResolvedValue(null);

            await expect(service.deleteQuestionWithOptions(data)).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.deleteQuestionWithOptions(data)).rejects.toThrow(
                POLLS_MESSAGE.POLL_NOT_FOUND,
            );
        });

        it('should throw ForbiddenException when user is not the poll creator', async () => {
            const pollWithDifferentUser = createMockPoll({
                belongsToUser: jest.fn().mockReturnValue(false),
            });

            pollsRepository.findById.mockResolvedValue(pollWithDifferentUser);

            await expect(service.deleteQuestionWithOptions(data)).rejects.toThrow(
                ForbiddenException,
            );
            await expect(service.deleteQuestionWithOptions(data)).rejects.toThrow(
                POLLS_MESSAGE.SURVEY_NOT_AVAILABLE,
            );
        });

        it('should throw NotFoundException when question does not exist', async () => {
            pollsRepository.findById.mockResolvedValue(mockPoll);
            questionsRepository.findQuestion.mockResolvedValue(null);

            await expect(service.deleteQuestionWithOptions(data)).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.deleteQuestionWithOptions(data)).rejects.toThrow(
                QUESTIONS_MESSAGE.QUESTION_NOT_FOUND,
            );
        });
    });
});