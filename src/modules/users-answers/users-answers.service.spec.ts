import { BadRequestException, ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersAnswersService } from './users-answers.service';
import { UsersAnswersGateway } from './users-answers.gateway';
import { IDataCreateAnswer } from './constants/types';
import { UsersAnswersEntity } from './domain/users-answers.entity';
import { USERS_ANSWERS_INJECTION_TOKENS } from './constants/users-answers-injection-tokens';
import { QUESTIONS_INJECTION_TOKENS } from '../questions/questions-variant/constants/questions-injection-tokens';
import { POLL_INJECTION_TOKENS } from '../polls/constants/poll-injection-tokens';
import { QUESTIONS_MESSAGE } from '../questions/questions-variant/constants/types.messages';
import { POLLS_MESSAGE } from '../polls/constants/types.message';
import { OPTIONS_MESSAGE } from '../questions/question-options/constants/types-messages';
import { USERS_ANSWERS_MESSAGE } from './constants/types-messages';

// yarn test -- src/modules/users-answers/users-answers.service.spec.ts

interface IQuestionsRepository {
    findOneQuestion(questionId: number): Promise<any>;
}

interface IPollsRepository {
    findById(pollId: number): Promise<any>;
}

interface IUsersAnswersRepository {
    findByUserAndQuestion(userId: number, pollId: number, questionId: number, questionOptionIds: number[]): Promise<any[]>;
    createMultipleAnswers(answerEntities: UsersAnswersEntity[]): Promise<{ userAnswerSave: boolean }>;
}

describe('UsersAnswersService', () => {
    let usersAnswersService: UsersAnswersService;
    let questionsRepository: IQuestionsRepository;
    let pollsRepository: IPollsRepository;
    let usersAnswersRepository: IUsersAnswersRepository;
    let usersAnswersGateway: UsersAnswersGateway;
    let logger: Logger;

    const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
    };

    const mockPoll = {
        id: 1,
        title: 'Test Poll',
        description: 'Test Description',
        isActive: true,
        belongsToUser: jest.fn(),
    };

    const mockQuestion = {
        id: 1,
        text: 'Test Question',
        pollId: 1,
        options: [
            { id: 1, text: 'Option 1' },
            { id: 2, text: 'Option 2' },
        ],
        belongsToPoll: jest.fn().mockReturnValue(true),
        hasAllOptions: jest.fn().mockReturnValue(true),
    };

    const mockAnswerEntities = [
        UsersAnswersEntity.createInstance(1, 1, 1, 1),
        UsersAnswersEntity.createInstance(1, 1, 1, 2),
    ];

    const mockCreateAnswerData: IDataCreateAnswer = {
        userId: 1,
        pollId: 1,
        questionId: 1,
        questionOptionIds: [1, 2],
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersAnswersService,
                {
                    provide: Logger,
                    useValue: {
                        log: jest.fn(),
                        warn: jest.fn(),
                        error: jest.fn(),
                    },
                },
                {
                    provide: QUESTIONS_INJECTION_TOKENS.IQUESTIONS_REPOSITORY,
                    useValue: {
                        findOneQuestion: jest.fn(),
                    },
                },
                {
                    provide: POLL_INJECTION_TOKENS.IPOLL_REPOSITORY,
                    useValue: {
                        findById: jest.fn(),
                    },
                },
                {
                    provide: USERS_ANSWERS_INJECTION_TOKENS.IUSERS_ANSWERS_REPOSITORY,
                    useValue: {
                        findByUserAndQuestion: jest.fn(),
                        createMultipleAnswers: jest.fn(),
                    },
                },
                {
                    provide: UsersAnswersGateway,
                    useValue: {
                        getQuantityAnswers: jest.fn(),
                    },
                },
            ],
        }).compile();

        usersAnswersService = module.get<UsersAnswersService>(UsersAnswersService);
        questionsRepository = module.get<IQuestionsRepository>(QUESTIONS_INJECTION_TOKENS.IQUESTIONS_REPOSITORY);
        pollsRepository = module.get<IPollsRepository>(POLL_INJECTION_TOKENS.IPOLL_REPOSITORY);
        usersAnswersRepository = module.get<IUsersAnswersRepository>(USERS_ANSWERS_INJECTION_TOKENS.IUSERS_ANSWERS_REPOSITORY);
        usersAnswersGateway = module.get<UsersAnswersGateway>(UsersAnswersGateway);
        logger = module.get<Logger>(Logger);
    });

    describe('createAnswer', () => {
        it('should successfully create a new answer and emit gateway event', async () => {
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPoll);
            jest.spyOn(questionsRepository, 'findOneQuestion').mockResolvedValue(mockQuestion);
            jest.spyOn(usersAnswersRepository, 'findByUserAndQuestion').mockResolvedValue([]);
            jest.spyOn(usersAnswersRepository, 'createMultipleAnswers').mockResolvedValue({ userAnswerSave: true });
            jest.spyOn(UsersAnswersEntity, 'createMultipleInstances').mockReturnValue(mockAnswerEntities as any);

            const result = await usersAnswersService.createAnswer(mockCreateAnswerData);

            expect(pollsRepository.findById).toHaveBeenCalledWith(mockCreateAnswerData.pollId);
            expect(questionsRepository.findOneQuestion).toHaveBeenCalledWith(mockCreateAnswerData.questionId);
            expect(usersAnswersRepository.findByUserAndQuestion).toHaveBeenCalledWith(
                mockCreateAnswerData.userId,
                mockCreateAnswerData.pollId,
                mockCreateAnswerData.questionId,
                mockCreateAnswerData.questionOptionIds
            );
            expect(UsersAnswersEntity.createMultipleInstances).toHaveBeenCalledWith(
                mockCreateAnswerData.userId,
                mockCreateAnswerData.pollId,
                mockCreateAnswerData.questionId,
                mockCreateAnswerData.questionOptionIds
            );
            expect(usersAnswersRepository.createMultipleAnswers).toHaveBeenCalledWith(mockAnswerEntities);
            expect(usersAnswersGateway.getQuantityAnswers).toHaveBeenCalledWith(mockCreateAnswerData.pollId);
            expect(result).toEqual({ userAnswerSave: true });
            expect(logger.log).toHaveBeenCalled();
        });

        it('should throw NotFoundException when poll does not exist', async () => {
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(null);

            await expect(usersAnswersService.createAnswer(mockCreateAnswerData)).rejects.toThrow(
                NotFoundException,
            );
            await expect(usersAnswersService.createAnswer(mockCreateAnswerData)).rejects.toThrow(
                POLLS_MESSAGE.POLL_NOT_FOUND,
            );
            expect(pollsRepository.findById).toHaveBeenCalledWith(mockCreateAnswerData.pollId);
            expect(questionsRepository.findOneQuestion).not.toHaveBeenCalled();
            expect(usersAnswersRepository.findByUserAndQuestion).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should throw NotFoundException when question does not exist', async () => {
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPoll);
            jest.spyOn(questionsRepository, 'findOneQuestion').mockResolvedValue(null);

            await expect(usersAnswersService.createAnswer(mockCreateAnswerData)).rejects.toThrow(
                NotFoundException,
            );
            await expect(usersAnswersService.createAnswer(mockCreateAnswerData)).rejects.toThrow(
                QUESTIONS_MESSAGE.QUESTION_NOT_FOUND,
            );
            expect(questionsRepository.findOneQuestion).toHaveBeenCalledWith(mockCreateAnswerData.questionId);
            expect(usersAnswersRepository.findByUserAndQuestion).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should throw ForbiddenException when question does not belong to poll', async () => {
            const questionNotBelongToPoll = {
                ...mockQuestion,
                belongsToPoll: jest.fn().mockReturnValue(false),
            };
            
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPoll);
            jest.spyOn(questionsRepository, 'findOneQuestion').mockResolvedValue(questionNotBelongToPoll);

            await expect(usersAnswersService.createAnswer(mockCreateAnswerData)).rejects.toThrow(
                ForbiddenException,
            );
            await expect(usersAnswersService.createAnswer(mockCreateAnswerData)).rejects.toThrow(
                QUESTIONS_MESSAGE.QUESTION_DOES_NOT_POLL,
            );
            expect(questionNotBelongToPoll.belongsToPoll).toHaveBeenCalledWith(mockCreateAnswerData.pollId);
            expect(usersAnswersRepository.findByUserAndQuestion).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should throw BadRequestException when options do not belong to question', async () => {
            const questionWithoutOptions = {
                ...mockQuestion,
                hasAllOptions: jest.fn().mockReturnValue(false),
            };
            
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPoll);
            jest.spyOn(questionsRepository, 'findOneQuestion').mockResolvedValue(questionWithoutOptions);

            await expect(usersAnswersService.createAnswer(mockCreateAnswerData)).rejects.toThrow(
                BadRequestException,
            );
            await expect(usersAnswersService.createAnswer(mockCreateAnswerData)).rejects.toThrow(
                OPTIONS_MESSAGE.OPTION_DO_NOT_BELONG_TO_QUESTION,
            );
            expect(questionWithoutOptions.hasAllOptions).toHaveBeenCalledWith(mockCreateAnswerData.questionOptionIds);
            expect(usersAnswersRepository.findByUserAndQuestion).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should throw BadRequestException when user has already answered this question', async () => {
            const existingAnswers = [{ id: 1, userId: 1, questionId: 1, pollId: 1 }];
            
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPoll);
            jest.spyOn(questionsRepository, 'findOneQuestion').mockResolvedValue(mockQuestion);
            jest.spyOn(usersAnswersRepository, 'findByUserAndQuestion').mockResolvedValue(existingAnswers);

            await expect(usersAnswersService.createAnswer(mockCreateAnswerData)).rejects.toThrow(
                BadRequestException,
            );
            await expect(usersAnswersService.createAnswer(mockCreateAnswerData)).rejects.toThrow(
                USERS_ANSWERS_MESSAGE.THERE_ARE_VOICES,
            );
            expect(usersAnswersRepository.findByUserAndQuestion).toHaveBeenCalled();
            expect(usersAnswersRepository.createMultipleAnswers).not.toHaveBeenCalled();
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should throw error when repository save fails', async () => {
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPoll);
            jest.spyOn(questionsRepository, 'findOneQuestion').mockResolvedValue(mockQuestion);
            jest.spyOn(usersAnswersRepository, 'findByUserAndQuestion').mockResolvedValue([]);
            jest.spyOn(UsersAnswersEntity, 'createMultipleInstances').mockReturnValue(mockAnswerEntities as any);
            jest.spyOn(usersAnswersRepository, 'createMultipleAnswers').mockRejectedValue(new Error('Database error'));

            await expect(usersAnswersService.createAnswer(mockCreateAnswerData)).rejects.toThrow(
                'Database error',
            );
            expect(usersAnswersGateway.getQuantityAnswers).not.toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalled();
        });

        it('should still throw error even if gateway fails after repository save', async () => {
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPoll);
            jest.spyOn(questionsRepository, 'findOneQuestion').mockResolvedValue(mockQuestion);
            jest.spyOn(usersAnswersRepository, 'findByUserAndQuestion').mockResolvedValue([]);
            jest.spyOn(UsersAnswersEntity, 'createMultipleInstances').mockReturnValue(mockAnswerEntities as any);
            jest.spyOn(usersAnswersRepository, 'createMultipleAnswers').mockResolvedValue({ userAnswerSave: true });
            jest.spyOn(usersAnswersGateway, 'getQuantityAnswers').mockRejectedValue(new Error('Gateway error'));

            await expect(usersAnswersService.createAnswer(mockCreateAnswerData)).rejects.toThrow(
                'Gateway error',
            );
            expect(logger.error).toHaveBeenCalled();
        });

        
    });

    describe('checkingPollQuestionOptions', () => {
        const operation = 'testOperation';
        const pollId = 1;
        const questionId = 1;
        const questionOptionIds = [1, 2];

        it('should successfully validate poll, question, and options', async () => {
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPoll);
            jest.spyOn(questionsRepository, 'findOneQuestion').mockResolvedValue(mockQuestion);

            await expect(
                usersAnswersService.checkingPollQuestionOptions(pollId, questionId, questionOptionIds, operation)
            ).resolves.not.toThrow();

            expect(pollsRepository.findById).toHaveBeenCalledWith(pollId);
            expect(questionsRepository.findOneQuestion).toHaveBeenCalledWith(questionId);
            expect(mockQuestion.belongsToPoll).toHaveBeenCalledWith(pollId);
            expect(mockQuestion.hasAllOptions).toHaveBeenCalledWith(questionOptionIds);
        });

        it('should throw NotFoundException when poll not found', async () => {
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(null);

            await expect(
                usersAnswersService.checkingPollQuestionOptions(pollId, questionId, questionOptionIds, operation)
            ).rejects.toThrow(NotFoundException);
            await expect(
                usersAnswersService.checkingPollQuestionOptions(pollId, questionId, questionOptionIds, operation)
            ).rejects.toThrow(POLLS_MESSAGE.POLL_NOT_FOUND);
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should throw NotFoundException when question not found', async () => {
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPoll);
            jest.spyOn(questionsRepository, 'findOneQuestion').mockResolvedValue(null);

            await expect(
                usersAnswersService.checkingPollQuestionOptions(pollId, questionId, questionOptionIds, operation)
            ).rejects.toThrow(NotFoundException);
            await expect(
                usersAnswersService.checkingPollQuestionOptions(pollId, questionId, questionOptionIds, operation)
            ).rejects.toThrow(QUESTIONS_MESSAGE.QUESTION_NOT_FOUND);
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should throw ForbiddenException when question does not belong to poll', async () => {
            const questionNotBelong = {
                ...mockQuestion,
                belongsToPoll: jest.fn().mockReturnValue(false),
            };
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPoll);
            jest.spyOn(questionsRepository, 'findOneQuestion').mockResolvedValue(questionNotBelong);

            await expect(
                usersAnswersService.checkingPollQuestionOptions(pollId, questionId, questionOptionIds, operation)
            ).rejects.toThrow(ForbiddenException);
            await expect(
                usersAnswersService.checkingPollQuestionOptions(pollId, questionId, questionOptionIds, operation)
            ).rejects.toThrow(QUESTIONS_MESSAGE.QUESTION_DOES_NOT_POLL);
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should throw BadRequestException when options do not belong to question', async () => {
            const questionWithoutOptions = {
                ...mockQuestion,
                hasAllOptions: jest.fn().mockReturnValue(false),
            };
            jest.spyOn(pollsRepository, 'findById').mockResolvedValue(mockPoll);
            jest.spyOn(questionsRepository, 'findOneQuestion').mockResolvedValue(questionWithoutOptions);

            await expect(
                usersAnswersService.checkingPollQuestionOptions(pollId, questionId, questionOptionIds, operation)
            ).rejects.toThrow(BadRequestException);
            await expect(
                usersAnswersService.checkingPollQuestionOptions(pollId, questionId, questionOptionIds, operation)
            ).rejects.toThrow(OPTIONS_MESSAGE.OPTION_DO_NOT_BELONG_TO_QUESTION);
            expect(logger.warn).toHaveBeenCalled();
        });
    });
});