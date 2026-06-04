import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { UserModel } from "../../users/models/user.model";
import { PollModel } from "../../polls/models/polls.model";
import { QuestionModel } from "../../questions/questions-variant/models/questions.model";
import { QuestionOptionModel } from "../../questions/question-options/models/question-options.model";

@Entity('users_answers')
@Unique(['userId', 'pollId', 'questionId', 'optionId'])
export class UsersAnswersModel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', name: 'user_id', nullable: false })
    userId: number;

    @Column({ type: 'int', name: 'poll_id', nullable: false })
    pollId: number;

    @Column({ type: 'int', name: 'question_id', nullable: false })
    questionId: number;

    @Column({ type: 'int', name: 'option_id', nullable: false })
    optionId: number;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at', nullable: false })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at', nullable: false })
    updatedAt: Date;

    @ManyToOne(() => UserModel, (user) => user.usersAnswers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: UserModel;

    @ManyToOne(() => PollModel, (poll) => poll.usersAnswers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'poll_id' })
    poll: PollModel;

    @ManyToOne(() => QuestionModel, (question) => question.usersAnswers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'question_id' })
    question: QuestionModel;

    @ManyToOne(() => QuestionOptionModel, (option) => option.usersAnswers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'option_id' })
    option: QuestionOptionModel;
}